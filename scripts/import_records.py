#!/usr/bin/env python3
"""Imports the records shown on https://records.selar.com/breakable-records into the exhibition.

Writes:
  content/exhibition/records.js           the records as exhibit-shaped data (generated: do not edit by hand)
  public/exhibition/creators/*.jpg        creator photos, centre-cropped square (the UI draws them as circles)

Publication/verification flags live in content/exhibition/records-status.js so re-running this never loses decisions.
Usage: python3 scripts/import_records.py [--no-images]
"""
import json, os, re, sys, urllib.request, io
from PIL import Image

URL = "https://records.selar.com/breakable-records"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "exhibition", "creators")
UA = {"User-Agent": "Mozilla/5.0 (selar-exhibition-import)"}
GET_IMAGES = "--no-images" not in sys.argv

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()

def clean(v):
    # React Server Component payloads escape "$" as "$$" and encode undefined as "$undefined".
    if isinstance(v, str):
        if v == "$undefined": return None
        if v.startswith("$$"): return v[1:]
        return v
    if isinstance(v, list): return [clean(x) for x in v]
    if isinstance(v, dict): return {k: clean(x) for k, x in v.items()}
    return v

def extract(html):
    parts = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
    txt = "".join(json.loads(p) for p in parts)
    i = txt.index('"all":[') + len('"all":')
    depth, k = 0, i
    while True:
        c = txt[k]
        if c == "[": depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0: break
        elif c == '"':
            k += 1
            while txt[k] != '"':
                if txt[k] == "\\": k += 1
                k += 1
        k += 1
    gen = re.search(r'"generatedAt":"([^"]+)"', txt)
    return clean(json.loads(txt[i:k + 1])), (gen.group(1) if gen else None)

MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"]
def parse_date(s):
    """-> (iso, precision, display). Ongoing records have no single date."""
    if not s: return None, None, ""
    if s.lower().startswith("ongoing"):
        return None, None, re.sub(r",", "", s)
    m = re.match(r"(\d+)(?:st|nd|rd|th)\s+(\w+),\s*(\d{4})", s)
    if m: return f"{m[3]}-{MONTHS.index(m[2].lower())+1:02d}-{int(m[1]):02d}", "day", f"{int(m[1])} {m[2]} {m[3]}"
    m = re.match(r"(\w+),\s*(\d{4})", s)
    if m and m[1].lower() in MONTHS: return f"{m[2]}-{MONTHS.index(m[1].lower())+1:02d}", "month", f"{m[1]} {m[2]}"
    m = re.match(r"(\d{4})$", s)
    if m: return m[1], "year", m[1]
    return None, None, s

def split_sentences(text):
    return [t.strip() for t in re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", (text or "").strip()) if t.strip()]
def first_sentence(text, fallback):
    ss = split_sentences(text); return ss[0] if ss else fallback
def rest_after_first(text):
    return " ".join(split_sentences(text)[1:])

def slugify(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def norm(name): return re.sub(r"\s+", " ", name.replace("™", "")).strip().lower()

GROUPS = [
    ("records-speed", "Fastest to Reach", lambda r: r["award"].startswith("Fastest")),
    ("records-streaks", "Streaks and Loyalty", lambda r: "streak" in r["award"].lower() or "returning" in r["award"].lower()),
    ("records-honour", "Creator of the Year", lambda r: r["award"] == "Creator of the Year"),
    ("records-volume", "Volume and Revenue", lambda r: r["award"].startswith(("Most", "Highest"))),
    ("records-firsts", "Firsts on Selar", lambda r: r["award"].startswith("First")),
]
def group_of(r):
    for slug, _, test in GROUPS:
        if test(r): return slug
    raise SystemExit(f"No group for {r['award']}")

photo_for_url = {}
def photo(url):
    """Downloads a creator photo as a square JPEG; returns its site path (or None)."""
    if not url: return None
    if url in photo_for_url: return photo_for_url[url]
    base = slugify(os.path.splitext(url.rsplit("/", 1)[-1])[0])
    rel = f"/exhibition/creators/{base}.jpg"
    path = os.path.join(IMG_DIR, base + ".jpg")
    if GET_IMAGES and not os.path.exists(path):
        try:
            im = Image.open(io.BytesIO(fetch(url)))
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); im = bg
            else: im = im.convert("RGB")
            w, h = im.size; s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)).resize((420, 420), Image.LANCZOS)
            im.save(path, "JPEG", quality=82, optimize=True, progressive=True)
        except Exception as e:
            print("  ! could not fetch", url, e); photo_for_url[url] = None; return None
    photo_for_url[url] = rel if os.path.exists(path) else None
    return photo_for_url[url]

def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    html = fetch(URL).decode("utf8")
    raw, generated = extract(html)
    print(f"{len(raw)} records (site data generated {generated})")
    name_photo = {}
    def note(name, url):
        p = photo(url)
        if p and norm(name) not in name_photo: name_photo[norm(name)] = p
        return p

    out = []
    for i, r in enumerate(raw):
        iso, prec, display = parse_date(r.get("setDate"))
        p = note(r["name"], r.get("photo"))
        runners = [{"place": x["place"], "placeLabel": x["placeLabel"], "name": x["name"], "figure": x["figure"], "date": x.get("date") or "",
                    "photo": note(x["name"], x.get("photo")), "storeUrl": x.get("storeUrl")} for x in r.get("runnerUps", [])]
        past = [{"name": x["name"], "stat": x["stat"], "photo": note(x["name"], x.get("photo")), "storeUrl": x.get("storeUrl")} for x in r.get("pastHolders", [])]
        rec = {
            "id": f"rec-{i+1:03d}", "slug": f"record-{r['slug']}" + (f"-{slugify(r['name'])}" if sum(1 for q in raw if q['slug'] == r['slug']) > 1 else ""),
            "title": r["award"], "category": group_of(r), "creator": r["name"].replace("  ", " "),
            # The site's own blurb about the record: first sentence on the panel, the rest as the longer description.
            "achievement": first_sentence(r.get("about"), f"{r['award']}: {r['figure']}."),
            "description": rest_after_first(r.get("about")),
            "figure": {"value": r["figure"], "label": display or ""},
            "photo": p, "storeUrl": r.get("storeUrl"), "runnerUps": runners, "pastHolders": past,
            "displayDate": display, "ongoing": bool(r.get("ongoing")) if isinstance(r.get("ongoing"), bool) else False,
            "sourceNote": f"records.selar.com/breakable-records (site data generated {generated}).",
            "sortOrder": 100 + i,
        }
        if iso: rec["date"], rec["datePrecision"] = iso, prec
        out.append(rec)

    head = ("// GENERATED by scripts/import_records.py from https://records.selar.com/breakable-records. Do not edit by hand.\n"
            "// Publication and verification decisions live in records-status.js. Re-run the script to refresh.\n")
    meta = {"source": URL, "generatedAt": generated, "count": len(out)}
    with open(os.path.join(ROOT, "content", "exhibition", "records.js"), "w", encoding="utf8") as f:
        f.write(head + "export const recordsMeta = " + json.dumps(meta, indent=2) + ";\n\n")
        f.write("export const recordGroups = " + json.dumps([{"slug": s, "title": t} for s, t, _ in GROUPS], indent=2, ensure_ascii=False) + ";\n\n")
        f.write("// Normalised creator name -> photo, collected from every place a creator appears on the site.\n")
        f.write("export const creatorPhotos = " + json.dumps(dict(sorted(name_photo.items())), indent=2, ensure_ascii=False) + ";\n\n")
        f.write("export const records = " + json.dumps(out, indent=2, ensure_ascii=False) + ";\n")
    n = len([f for f in os.listdir(IMG_DIR) if f.endswith('.jpg')])
    print(f"wrote records.js; {n} photos; {sum(1 for r in out if not r['photo'])} records without a photo")

main()
