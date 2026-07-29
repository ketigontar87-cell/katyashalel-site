import imaplib, email, os, ssl, urllib.request, urllib.parse
from email.header import decode_header

HOST = os.environ["MAIL_HOST"]
USER = os.environ["MAIL_USER"]
PASS = os.environ["MAIL_PASS"]
TG_TOKEN = os.environ.get("TG_BOT_TOKEN", "")
TG_CHAT = os.environ.get("TG_CHAT_ID", "")
FLAG = "TGNotified"

def dec(s):
    if not s: return ""
    parts = decode_header(s)
    out = ""
    for text, enc in parts:
        out += text.decode(enc or "utf-8", "replace") if isinstance(text, bytes) else text
    return out

def notify(frm, subj, snippet):
    if not TG_TOKEN or not TG_CHAT:
        print("TG creds absent, would notify:", frm, "|", subj)
        return
    text = f"\U0001F4E9 skinbot.ru \u2014 \u043d\u043e\u0432\u043e\u0435 \u043f\u0438\u0441\u044c\u043c\u043e\n\n\u041e\u0442: {frm}\n\u0422\u0435\u043c\u0430: {subj}\n\n{snippet[:300]}"
    data = urllib.parse.urlencode({"chat_id": TG_CHAT, "text": text}).encode()
    r = urllib.request.urlopen(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage", data=data, timeout=20)
    print("notified:", r.status)

M = imaplib.IMAP4_SSL(HOST, 993, ssl_context=ssl.create_default_context())
M.login(USER, PASS)
M.select("INBOX")
typ, data = M.uid("SEARCH", None, f"(UNSEEN UNKEYWORD {FLAG})")
uids = data[0].split() if data and data[0] else []
print("new unseen:", len(uids))
for uid in uids[-10:]:
    typ, msg_data = M.uid("FETCH", uid, "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)] BODY.PEEK[TEXT]<0.500>)")
    frm = subj = snippet = ""
    for part in msg_data:
        if isinstance(part, tuple):
            block = part[1].decode("utf-8", "replace")
            if "From:" in block or "Subject:" in block:
                msg = email.message_from_string(block)
                frm = dec(msg.get("From", "")); subj = dec(msg.get("Subject", ""))
            else:
                snippet = " ".join(block.split())[:300]
    notify(frm or "?", subj or "(no subject)", snippet)
    M.uid("STORE", uid, "+FLAGS", f"({FLAG})")
M.logout()
