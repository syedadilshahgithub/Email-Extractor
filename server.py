#!/usr/bin/env python3
"""
Email Extractor Backend Server
Run: pip install flask flask-cors requests beautifulsoup4 lxml
Then: python server.py
"""

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import re
import time
import requests
import warnings
import json
import threading
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
from concurrent.futures import ThreadPoolExecutor, wait

try:
    from bs4 import XMLParsedAsHTMLWarning
    warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
except ImportError:
    pass
warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

# ── Config ──────────────────────────────────────────
MAX_PAGES_SITE  = 15
PAGE_WORKERS    = 10
REQUEST_TIMEOUT = 6
SITE_TIMEOUT    = 30

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

BAD_EMAILS = {
    "example@example.com","example@mysite.com","email@domain.com",
    "name@example.com","test@test.com","user@example.com",
    "email@email.com","info@example.com","admin@example.com",
}
BAD_DOMAIN_KW = [
    "wixpress","sentry","example.com","jquery","schema.org",
    "gravatar","wordpress.org","bloomberg","ring2chat",
]
BAD_FULL_DOMAINS = {
    "google.com","facebook.com","twitter.com","instagram.com",
    "youtube.com","apple.com","microsoft.com","amazonaws.com",
    "cloudflare.com","wp.com","domain.com",
}
SKIP_EXTS = (
    ".png",".jpg",".jpeg",".gif",".svg",".webp",".ico",
    ".css",".js",".woff",".woff2",".ttf",".pdf",".zip",
    ".mp4",".mp3",".xml",".json",".rss",
)
PRIORITY_KW = ["contact","about","team","staff","reach","email","get-in-touch"]
SKIP_KW     = ["login","logout","cart","shop","product","wp-","feed","sitemap","privacy","terms"]

def clean_emails(raw):
    out = set()
    for em in raw:
        em = re.sub(r"^mailto:", "", em.lower().strip()).rstrip(".,;:")
        if not em or "@" not in em or len(em) > 100:
            continue
        if em in BAD_EMAILS:
            continue
        domain = em.split("@")[-1]
        if domain in BAD_FULL_DOMAINS:
            continue
        if any(kw in domain for kw in BAD_DOMAIN_KW):
            continue
        if any(em.endswith(x) or domain.endswith(x) for x in SKIP_EXTS):
            continue
        out.add(em)
    return out

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def fetch(url):
    try:
        r = SESSION.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        ct = r.headers.get("Content-Type", "")
        if r.status_code == 200 and "text/html" in ct:
            return r.text
    except Exception:
        pass
    return None

def extract_emails(html):
    found = set(EMAIL_RE.findall(html))
    try:
        soup = BeautifulSoup(html, "lxml")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "mailto:" in href.lower():
                em = href.lower().split("mailto:")[-1].split("?")[0].strip()
                if "@" in em:
                    found.add(em)
        for tag in ["header","footer","nav","aside"]:
            for section in soup.find_all(tag):
                for a in section.find_all("a", href=True):
                    if "mailto:" in a["href"].lower():
                        em = a["href"].lower().split("mailto:")[-1].split("?")[0].strip()
                        if "@" in em:
                            found.add(em)
                found.update(EMAIL_RE.findall(section.get_text(separator=" ")))
        for attr_val in ["contact","footer","header","topbar","sidebar"]:
            for el in soup.find_all(attrs={"class": re.compile(attr_val, re.I)}):
                for a in el.find_all("a", href=True):
                    if "mailto:" in a["href"].lower():
                        em = a["href"].lower().split("mailto:")[-1].split("?")[0].strip()
                        if "@" in em:
                            found.add(em)
                found.update(EMAIL_RE.findall(el.get_text(separator=" ")))
    except Exception:
        pass
    return clean_emails(found)

def get_links(base_url, html):
    try:
        soup = BeautifulSoup(html, "lxml")
    except Exception:
        return [], []
    base_netloc = urlparse(base_url).netloc
    priority, normal = [], []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("#","mailto:","tel:","javascript:")):
            continue
        full = urljoin(base_url, href)
        p = urlparse(full)
        if p.netloc != base_netloc:
            continue
        path = p.path.lower()
        if any(path.endswith(x) for x in SKIP_EXTS):
            continue
        if any(kw in path for kw in SKIP_KW):
            continue
        clean = p._replace(fragment="", query="").geturl()
        if clean in seen:
            continue
        seen.add(clean)
        if any(kw in path for kw in PRIORITY_KW):
            priority.append(clean)
        else:
            normal.append(clean)
    return priority, normal

def crawl_site(start_url):
    site_start = time.time()
    all_emails = set()
    visited = set()
    priority_q = deque([start_url])
    normal_q = deque()
    pages = 0

    def time_left():
        return SITE_TIMEOUT - (time.time() - site_start)

    def fetch_batch(batch):
        results = {}
        with ThreadPoolExecutor(max_workers=PAGE_WORKERS) as ex:
            fs = {ex.submit(fetch, u): u for u in batch}
            done, _ = wait(fs, timeout=min(REQUEST_TIMEOUT + 2, max(time_left(), 1)))
            for f in done:
                u = fs[f]
                try:
                    results[u] = f.result()
                except Exception:
                    results[u] = None
        return results

    while pages < MAX_PAGES_SITE and time_left() > 2:
        batch = []
        for q in (priority_q, normal_q):
            while q and len(batch) < PAGE_WORKERS:
                url = q.popleft()
                if url not in visited:
                    visited.add(url)
                    batch.append(url)
        if not batch:
            break
        results = fetch_batch(batch)
        for url, html in results.items():
            pages += 1
            if not html:
                continue
            found = extract_emails(html)
            all_emails |= found
            if pages < MAX_PAGES_SITE and time_left() > 3:
                pri, norm = get_links(url, html)
                for lnk in pri:
                    if lnk not in visited:
                        priority_q.appendleft(lnk)
                for lnk in norm:
                    if lnk not in visited:
                        normal_q.append(lnk)

    return list(all_emails)

# ── Routes ───────────────────────────────────────────

@app.route("/extract", methods=["POST"])
def extract():
    data = request.json
    urls = data.get("urls", [])
    if not urls:
        return jsonify({"error": "No URLs provided"}), 400

    def generate():
        for url in urls:
            url = url.strip()
            if not url:
                continue
            domain = urlparse(url).netloc or url
            # Send "processing" event
            yield f"data: {json.dumps({'type': 'processing', 'url': url, 'domain': domain})}\n\n"
            try:
                emails = crawl_site(url)
                yield f"data: {json.dumps({'type': 'result', 'url': url, 'domain': domain, 'emails': emails})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'url': url, 'domain': domain, 'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    print("=" * 50)
    print("  ⚡ Email Extractor Server starting...")
    print("  📡 Running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=False, port=5000, threaded=True)
