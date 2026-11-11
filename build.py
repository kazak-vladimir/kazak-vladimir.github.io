"""Scans writing/ for PDFs and writes writing/posts.js.

Name PDFs like:  2026-11-01 Shrinking a Unity build.pdf
Optional summary: a .txt file with the same name, first line is used.
Runs automatically on GitHub after every upload. Run it yourself only to preview locally.
"""
import json, os, re, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, "writing")
posts = []
for name in os.listdir(DIR):
    if not name.lower().endswith(".pdf"):
        continue
    stem = name[:-4]
    m = re.match(r"(\d{4}-\d{2}-\d{2})[ _-]+(.+)", stem)
    if m:
        date, title = m.group(1), m.group(2)
    else:
        date = datetime.date.fromtimestamp(os.path.getmtime(os.path.join(DIR, name))).isoformat()
        title = stem
    title = title.replace("_", " ").strip()
    summary = ""
    txt = os.path.join(DIR, stem + ".txt")
    if os.path.exists(txt):
        with open(txt, encoding="utf-8") as f:
            summary = f.readline().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    posts.append({"slug": slug, "title": title, "date": date, "summary": summary, "file": name})

posts.sort(key=lambda p: p["date"], reverse=True)
with open(os.path.join(DIR, "posts.js"), "w", encoding="utf-8") as f:
    f.write("window.POSTS = " + json.dumps(posts, ensure_ascii=False, indent=2) + ";\n")
print(f"{len(posts)} post(s) written to writing/posts.js")
