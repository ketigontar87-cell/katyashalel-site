import imaplib, email, os, ssl, re, json, urllib.request, urllib.parse
from email.header import decode_header

HOST = os.environ["MAIL_HOST"]; USER = os.environ["MAIL_USER"]; PASS = os.environ["MAIL_PASS"]
TG_TOKEN = os.environ.get("TG_BOT_TOKEN", ""); TG_CHAT = os.environ.get("TG_CHAT_ID", "")
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_DB = "cdd74a45dc02441b80de559ff9ed0e61"
FLAG = "TGNotified"
FREEMAIL = {"gmail.com","yahoo.com","mail.ru","yandex.ru","icloud.com","outlook.com","hotmail.com","proton.me","protonmail.com","bk.ru","list.ru","inbox.ru","rambler.ru"}
NOT_LEAD = re.compile(r'^(no-?reply|noreply|donotreply|mailer|notification|notifications|newsletter|bounce|postmaster|mailer-daemon|support|billing|accounts?|info)@', re.I)

def dec(s):
    if not s: return ""
    out = ""
    for text, enc in decode_header(s):
        out += text.decode(enc or "utf-8", "replace") if isinstance(text, bytes) else text
    return out

def tg(text):
    if not TG_TOKEN or not TG_CHAT:
        print("TG absent:", text[:60]); return
    data = urllib.parse.urlencode({"chat_id": TG_CHAT, "text": text}).encode()
    urllib.request.urlopen(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage", data=data, timeout=20)

def notion_lead(name, addr, company, phone, subj, snippet, source, date_iso):
    if not NOTION_TOKEN:
        print("NOTION_TOKEN absent, lead skipped:", addr); return False
    props = {
        "Имя / отправитель": {"title": [{"text": {"content": name or addr}}]},
        "Email": {"email": addr},
        "Тема письма": {"rich_text": [{"text": {"content": subj[:200]}}]},
        "Суть": {"rich_text": [{"text": {"content": snippet[:1900]}}]},
        "Источник": {"select": {"name": source}},
        "Статус": {"select": {"name": "Новый"}},
    }
    if company: props["Компания"] = {"rich_text": [{"text": {"content": company}}]}
    if phone: props["Телефон"] = {"phone_number": phone}
    if date_iso: props["Дата письма"] = {"date": {"start": date_iso}}
    body = json.dumps({"parent": {"database_id": NOTION_DB}, "properties": props}).encode()
    req = urllib.request.Request("https://api.notion.com/v1/pages", data=body, headers={
        "Authorization": f"Bearer {NOTION_TOKEN}", "Content-Type": "application/json", "Notion-Version": "2022-06-28"})
    try:
        urllib.request.urlopen(req, timeout=20); print("notion lead created:", addr); return True
    except Exception as e:
        print("notion error:", e); return False

def extract_phone(text):
    m = re.search(r'(?:\+|00)[\d][\d\s().-]{8,18}\d', text)
    if m:
        p = re.sub(r'[^\d+]', '', m.group(0))
        if 10 <= len(p.lstrip('+')) <= 15: return p
    return ""

M = imaplib.IMAP4_SSL(HOST, 993, ssl_context=ssl.create_default_context())
M.login(USER, PASS)

typ, boxes = M.list()
spam_folders = []
for b in boxes or []:
    line = b.decode("utf-8", "replace")
    m = re.match(r'\((?P<attrs>[^)]*)\)\s+"(?P<delim>[^"]*)"\s+"?(?P<name>[^"]+)"?$', line)
    if not m: continue
    attrs, name = m.group("attrs").lower(), m.group("name")
    if "\\junk" in attrs or re.search(r'(^|[./])(spam|junk)$', name, re.I):
        spam_folders.append(name)

def check(folder, source, prefix):
    try:
        typ, _ = M.select(f'"{folder}"')
        if typ != "OK": print("cannot select:", folder); return
    except Exception as e:
        print("select error:", folder, e); return
    typ, data = M.uid("SEARCH", None, f"(UNSEEN UNKEYWORD {FLAG})")
    uids = data[0].split() if data and data[0] else []
    print(folder, "new unseen:", len(uids))
    for uid in uids[-10:]:
        typ, msg_data = M.uid("FETCH", uid, "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)] BODY.PEEK[TEXT]<0.1500>)")
        frm = subj = snippet = date_iso = ""
        for part in msg_data:
            if isinstance(part, tuple):
                block = part[1].decode("utf-8", "replace")
                if "From:" in block or "Subject:" in block:
                    msg = email.message_from_string(block)
                    frm = dec(msg.get("From", "")); subj = dec(msg.get("Subject", ""))
                    try:
                        from email.utils import parsedate_to_datetime
                        date_iso = parsedate_to_datetime(msg.get("Date")).isoformat()
                    except Exception: pass
                else:
                    snippet = " ".join(block.split())[:1500]
        name, addr = "", ""
        m = re.match(r'(?:"?([^"<]*)"?\s*)?<?([\w.+-]+@[\w.-]+)>?', frm)
        if m: name, addr = (m.group(1) or "").strip(), m.group(2).lower()
        tg(f"{prefix}\n\n\u041e\u0442: {frm}\n\u0422\u0435\u043c\u0430: {subj}\n\n{snippet[:300]}")
        if addr and not NOT_LEAD.match(addr):
            domain = addr.split("@")[-1]
            company = "" if domain in FREEMAIL else domain.rsplit(".", 1)[0].replace("-", " ").title()
            phone = extract_phone(snippet)
            notion_lead(name, addr, company, phone, subj, snippet, source, date_iso)
        M.uid("STORE", uid, "+FLAGS", f"({FLAG})")

check("INBOX", "\u0412\u0445\u043e\u0434\u044f\u0449\u0438\u0435", "\U0001F4E9 skinbot.ru \u2014 \u043d\u043e\u0432\u043e\u0435 \u043f\u0438\u0441\u044c\u043c\u043e")
for sf in spam_folders:
    check(sf, "\u0421\u043f\u0430\u043c", "\u26A0\uFE0F skinbot.ru \u2014 \u043f\u0438\u0441\u044c\u043c\u043e \u0432 \u0421\u041f\u0410\u041c\u0415")
M.logout()
