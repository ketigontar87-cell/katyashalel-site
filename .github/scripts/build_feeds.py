# -*- coding: utf-8 -*-
"""Build Atom and RSS feeds for katyashalel.com from the published essays.

Reads dates, headlines and descriptions out of the JSON-LD already present on
each page, so the feed can never drift from the structured data. Run from the
repository root.
"""
import io, os, glob, json, re
from datetime import datetime, timezone
from xml.sax.saxutils import escape
from bs4 import BeautifulSoup

SITE = "https://katyashalel.com"
AUTHOR = "Ekaterina Shalel"
EMAIL = "shalelekaterina@gmail.com"

FEEDS = {
    "en": {
        "globs": ["essays/**/index.html"],
        "atom": "feed.xml",
        "rss": "rss.xml",
        "title": "Ekaterina Shalel — Essays",
        "subtitle": "Legibility: how founders, products and companies get read correctly by AI systems.",
        "home": f"{SITE}/",
    },
    "ru": {
        "globs": ["ru/essays/**/index.html"],
        "atom": "ru/feed.xml",
        "rss": "ru/rss.xml",
        "title": "Екатерина Шалель — Эссе",
        "subtitle": "Читаемость: как основатели, продукты и компании становятся понятны AI-системам.",
        "home": f"{SITE}/ru/",
    },
}


def jsonld_nodes(soup):
    for sc in soup.find_all("script", type="application/ld+json"):
        if not sc.string:
            continue
        try:
            doc = json.loads(sc.string)
        except Exception:
            continue
        stack = [doc]
        while stack:
            o = stack.pop()
            if isinstance(o, dict):
                yield o
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)


def read(path):
    soup = BeautifulSoup(io.open(path, encoding="utf-8").read(), "lxml")
    art = None
    for n in jsonld_nodes(soup):
        if n.get("@type") in ("BlogPosting", "Article", "ScholarlyArticle"):
            art = n
            break
    url = SITE + "/" + os.path.dirname(path).replace(os.sep, "/") + "/"

    title = (art or {}).get("headline")
    if not title:
        t = soup.find("title")
        title = t.get_text().strip().split(" · ")[0] if t else url

    desc = (art or {}).get("description")
    if not desc:
        m = soup.find("meta", attrs={"name": "description"})
        desc = (m.get("content") or "").strip() if m else ""

    pub = (art or {}).get("datePublished")
    if not pub:
        m = soup.find("meta", property="article:published_time")
        pub = (m.get("content") or "").strip() if m else None
    if not pub:
        return None  # never invent a date

    mod = (art or {}).get("dateModified") or pub
    img = (art or {}).get("image")
    if isinstance(img, dict):
        img = img.get("url")
    if isinstance(img, list):
        img = img[0] if img else None
    if not img:
        og = soup.find("meta", property="og:image")
        img = og.get("content") if og else None

    return {"url": url, "title": title, "desc": desc, "pub": pub, "mod": mod, "image": img}


def iso(d):
    return d if "T" in d else d + "T09:00:00+00:00"


def rfc822(d):
    dt = datetime.fromisoformat(iso(d).replace("Z", "+00:00"))
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


def build(lang, cfg):
    items = []
    for g in cfg["globs"]:
        for p in glob.glob(g, recursive=True):
            it = read(p)
            if it:
                items.append(it)
    items.sort(key=lambda x: x["pub"], reverse=True)
    if not items:
        return 0
    updated = iso(max(i["mod"] for i in items))

    e = escape
    atom = ['<?xml version="1.0" encoding="utf-8"?>',
            '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="%s">' % lang,
            "  <title>%s</title>" % e(cfg["title"]),
            "  <subtitle>%s</subtitle>" % e(cfg["subtitle"]),
            '  <link href="%s/%s" rel="self" type="application/atom+xml"/>' % (SITE, cfg["atom"]),
            '  <link href="%s" rel="alternate" type="text/html"/>' % cfg["home"],
            "  <id>%s/%s</id>" % (SITE, cfg["atom"]),
            "  <updated>%s</updated>" % updated,
            "  <author><name>%s</name><uri>%s/</uri><email>%s</email></author>" % (e(AUTHOR), SITE, EMAIL),
            "  <rights>All rights reserved, %s</rights>" % datetime.now(timezone.utc).year]
    for i in items:
        atom += ["  <entry>",
                 "    <title>%s</title>" % e(i["title"]),
                 '    <link href="%s" rel="alternate" type="text/html"/>' % i["url"],
                 "    <id>%s</id>" % i["url"],
                 "    <published>%s</published>" % iso(i["pub"]),
                 "    <updated>%s</updated>" % iso(i["mod"]),
                 "    <summary type=\"text\">%s</summary>" % e(i["desc"])]
        if i["image"]:
            atom.append('    <link rel="enclosure" type="image/jpeg" href="%s"/>' % e(i["image"]))
        atom.append("  </entry>")
    atom.append("</feed>")
    io.open(cfg["atom"], "w", encoding="utf-8").write("\n".join(atom) + "\n")

    rss = ['<?xml version="1.0" encoding="utf-8"?>',
           '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
           "  <channel>",
           "    <title>%s</title>" % e(cfg["title"]),
           "    <link>%s</link>" % cfg["home"],
           "    <description>%s</description>" % e(cfg["subtitle"]),
           "    <language>%s</language>" % lang,
           "    <lastBuildDate>%s</lastBuildDate>" % rfc822(max(i["mod"] for i in items)),
           '    <atom:link href="%s/%s" rel="self" type="application/rss+xml"/>' % (SITE, cfg["rss"])]
    for i in items:
        rss += ["    <item>",
                "      <title>%s</title>" % e(i["title"]),
                "      <link>%s</link>" % i["url"],
                '      <guid isPermaLink="true">%s</guid>' % i["url"],
                "      <pubDate>%s</pubDate>" % rfc822(i["pub"]),
                "      <description>%s</description>" % e(i["desc"]),
                "    </item>"]
    rss += ["  </channel>", "</rss>"]
    io.open(cfg["rss"], "w", encoding="utf-8").write("\n".join(rss) + "\n")
    return len(items)


if __name__ == "__main__":
    for lang, cfg in FEEDS.items():
        n = build(lang, cfg)
        print("%s: %d entries -> %s, %s" % (lang, n, cfg["atom"], cfg["rss"]))
