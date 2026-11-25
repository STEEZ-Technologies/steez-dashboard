"""Build inert templates: python3 build-kawada-previews.py EXPORT [RENDERED].

RENDERED can contain browser-rendered pages at LANG/SLUG/index.html. Use a
render of Products after .dsh-head appears to capture its client-only selector.
"""
from copy import deepcopy
import json
import re
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup, NavigableString

export = Path(sys.argv[1])
output = Path("public/kawada-preview")
output.mkdir(exist_ok=True)
origin = "https://kawada.steez.digital"
migrations = Path("prisma/migrations")
copy_sql = (migrations / "20261122000000_website_copy/migration.sql").read_text()
media_sql = (migrations / "20261122020000_kawada_page_media/migration.sql").read_text()
media_sql += (migrations / "20261125010000_animation_pictures/migration.sql").read_text()
fields = defaultdict(list)
for page, lang, position, value in re.findall(r"\('([^']+)', '([^']+)', (\d+), '((?:''|[^'])*)'\)", copy_sql):
    fields[page, lang].append((int(position), value.replace("''", "'")))

assets = defaultdict(list)
for page, lang, section, url in re.findall(r"\('([^']+)', '([^']+)', (\d+), '[^']+', '(https://[^']+)'", media_sql):
    assets[page + "/" + lang].append([int(section), url])
Path("lib/kawada-preview-media.json").write_text(json.dumps(assets, ensure_ascii=False, indent=1) + "\n")

owners = "h1 h2 h3 h4 h5 h6 p li button a label option dt dd td th figcaption div section".split()
styles = set()
chinese = json.loads(Path(__file__).with_name("kawada-preview-zh.json").read_text())
for (page, lang), entries in fields.items():
    file = export / lang / ("" if page == "home" else page) / "index.html"
    if len(sys.argv) > 2:
        rendered = Path(sys.argv[2]) / file.relative_to(export)
        if rendered.is_file():
            file = rendered
    if page == "products" and "FormatOrbit_stageLoading" in file.read_text() and (output / f"{page}-{lang}.txt").exists():
        # Keep the last complete render when refreshing the static pages alone.
        if "dsh-head" in (output / f"{page}-{lang}.txt").read_text():
            continue
    soup = BeautifulSoup(file.read_text(), "html.parser")
    for node in soup.select("script,iframe,object,embed,template,noscript,base,meta,link:not([rel=stylesheet])"):
        node.decompose()
    # Exclude the shared site footer and its animation stage, retaining in-page credits.
    for footer_stage in soup.select(".kwf-shader-trigger"):
        footer_stage.decompose()
    # The inert preview never activates the scroll animation’s decorative masks.
    for mask in soup.select('.pad-materials[aria-hidden="true"] > [data-active="false"]'):
        mask.decompose()
    for link in soup.select("link[rel=stylesheet]"):
        sheet = export / link["href"].lstrip("/")
        styles.add(sheet)
        link["href"] = "/kawada-preview/" + sheet.name

    groups = []
    for node in soup.main.find_all(string=True):
        if type(node) is not NavigableString or not node.strip() or node.find_parent(["svg","style"]) or node.find_parent(hidden=True):
            continue
        owner = node.find_parent(owners)
        if not groups or groups[-1][0] is not owner:
            groups.append((owner, []))
        groups[-1][1].append(node)

    # Require matching source text, even if the export has gained new fields.
    actual = defaultdict(list)
    for _, nodes in groups:
        actual[" ".join("".join(nodes).split())].append(nodes)
    counts = Counter(value for _, value in entries)
    aligned = {value for value, count in counts.items() if len(actual[value]) == count}
    for pos, value in entries:
        candidates = actual[value]
        if value not in aligned:
            continue
        for node in candidates.pop(0):
            span = soup.new_tag("span", attrs={"data-copy": str(pos)})
            node.wrap(span)

    if page == "catalogue":
        loading = soup.select_one('[class*="CatalogueReader_loading"]')
        full_size = soup.select_one('a[href*="/page-01.jpg"]')
        if loading and full_size:
            photo = soup.new_tag("img", src=full_size["href"], alt=full_size.get_text(strip=True))
            photo["style"] = "display:block;width:100%;height:100%;object-fit:contain"
            loading.clear()
            loading.append(photo)
    if lang == "zh":
        for node in soup.body.find_all(string=True):
            if str(node).strip() in chinese:
                node.replace_with(str(node).replace(str(node).strip(), chinese[str(node).strip()]))
        for node in soup.body.find_all(True):
            for attr in ("alt", "title", "aria-label", "placeholder"):
                if node.get(attr) in chinese:
                    node[attr] = chinese[node[attr]]

    if page == "oem-odm":
        style = soup.new_tag("style")
        style.string = """
        #walkthrough [role=tabpanel][aria-hidden=true] {display:none}
        #walkthrough [role=tabpanel][aria-hidden=false] > .grid > div {
            opacity:1!important;visibility:visible!important;transition:none!important
        }
        """
        soup.head.append(style)
        # These panels mount their photos only after a visitor selects a step.
        stills = ["step-01-1080.jpg", "step-02-1080.jpg", "nonwoven-unwind-rolls-level-v2.webp",
                  "step-04-1080.jpg", "step-05-1080.jpg", "inspection-pad-measurement-v1.webp", "shipment-loading-v1.webp"]
        for panel, still in zip(soup.select("#walkthrough [role=tabpanel]"), stills):
            placeholder = panel.select_one('div.aspect-video[aria-hidden=true]')
            if placeholder:
                src = ("/videos/order-steps/" if still.endswith(".jpg") else "/images/factory/") + still
                placeholder.attrs.pop("aria-hidden", None)
                placeholder.append(soup.new_tag("img", src=src, alt=panel.h3.get_text(strip=True),
                                                attrs={"class": "size-full rounded-2xl object-cover", "loading":"lazy"}))
    media = assets[page + "/" + lang]
    for node in soup.find_all(True):
        for attr in list(node.attrs):
            if attr.startswith("on") or attr in ("target","action","formaction","autofocus","contenteditable","srcdoc","download"):
                del node[attr]
        for attr in ("src","poster","href"):
            value = node.get(attr, "")
            if value.startswith("/") and not value.startswith("/kawada-preview/"):
                node[attr] = urljoin(origin, value)
        for attr in ("style","srcset"):
            if attr in node.attrs:
                node[attr] = re.sub(r"(?<=[( ,\"'])/(?!/)", origin + "/", " " + node[attr]).strip()
        if node.name in ("img","video","source","a") and node.find_parent("main"):
            url = node.get("href" if node.name == "a" else "src")
            matches = [i for i, (_, src) in enumerate(media) if src == url]
            target = node.parent if node.name == "source" else node
            if len(matches) == 1:
                target["data-asset"] = str(matches[0])
        if node.name == "video":
            poster = node.get("poster", "")
            indices = [i for i, (_, src) in enumerate(media) if src == poster]
            if len(indices) == 1:
                node["data-poster"] = str(indices[0])
            if not node.get("src") and poster.endswith(("hero-reel-hd.jpg","hero-poster.jpg")):
                film = poster.replace("hero-reel-hd.jpg","hero-reel-hd.mp4").replace("hero-poster.jpg","hero.mp4")
                for i, (_, src) in enumerate(media):
                    if src == film:
                        node["data-asset"] = str(i)
        if node.name == "source" and node.parent.name == "picture":
            for i, (_, src) in enumerate(media):
                if node.get("srcset") == src:
                    node["data-picture-source"] = str(i)
        if node.name == "a":
            node.attrs.pop("href", None)
        if node.name in ("input","select","textarea"):
            node["disabled"] = ""
        if node.name == "video":
            node.attrs.pop("autoplay", None)
            node["preload"] = "none"
    # Some slides reuse one image element. Bind every source that can occupy it.
    if page == "oem-odm":
        target = soup.select_one("#ways-to-begin figure img")
        slots = [i for i,(section, _) in enumerate(media) if section == 4]
    elif page == "innovation":
        target = soup.select_one("#factory img")
        slots = [i for i,(_, url) in enumerate(media) if "/factory/" in url and url.endswith("-enhanced.webp")]
    elif page == "catalogue":
        target = soup.select_one('img[src*="page-01.jpg"]')
        slots = [i for i,(section, _) in enumerate(media) if section == 5]
    else:
        target, slots = None, []
    if target and slots:
        target["data-gallery-slots"] = " ".join(map(str, slots))

    if page == "home":
        # The current banner headline is a different field from the earlier headline (1).
        for line in soup.select("#hero-heading .loren-line"):
            line["data-copy"] = "90"

    if page == "about-us":
        # Keep the date and status badge independently editable.
        status = soup.select_one(".history-year-row .label [data-copy]")
        if status:
            status["data-copy"] = "75"
        slot = soup.select_one("#made-in-heading span[aria-hidden=true]")
        photo = soup.select_one("#plants picture")
        if slot and photo:
            slot.append(deepcopy(photo))
    viewport = soup.new_tag("meta", attrs={"name":"viewport","content":"width=device-width,initial-scale=1"})
    soup.head.append(viewport)
    (output / f"{page}-{lang}.txt").write_text(str(soup))

# Read the final captures, including any retained product render.
missing_copy = {}
for (page, lang), entries in fields.items():
    capture = (output / f"{page}-{lang}.txt").read_text()
    rendered = {int(position) for position in re.findall(r'data-copy="(\d+)"', capture)}
    expected = {position for position, _ in entries}
    if page == "home":
        expected.add(90)
    if page == "about-us":
        expected.add(75)
    if missing := sorted(expected - rendered):
        missing_copy[page + "/" + lang] = missing

Path("lib/kawada-preview-text.json").write_text(json.dumps(missing_copy, ensure_ascii=False, indent=2) + "\n")

for sheet in styles:
    css = sheet.read_text()
    # Retain the export's primary font subsets. Other glyphs use the site's fallback stack.
    css = re.sub(r"@font-face\{[^{}]+\}", lambda m: "" if ".woff2" in m[0] and "-s.p.woff2" not in m[0] else m[0], css)
    css = css.replace("/_next/static/media/", "/kawada-preview/").replace("url(/textures/", "url(" + origin + "/textures/")
    (output / sheet.name).write_text(css)
for font in (export / "_next/static/media").glob("*-s.p.woff2"):
    shutil.copyfile(font, output / font.name)
