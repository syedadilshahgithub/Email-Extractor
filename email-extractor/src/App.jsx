import { useState, useRef } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; color: #e8e4d9; font-family: 'Syne', sans-serif; display: flex; justify-content: center; }
  :root { --acid: #c8f135; --dim: #2a2a35; --muted: #6b6b7a; --surface: #13131a; --border: #1e1e2a; }

  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px 80px; position: relative; overflow: hidden; }
  .bg-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(200,241,53,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,241,53,0.03) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
  .glow { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(200,241,53,0.06) 0%, transparent 70%); top: -200px; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: 0; }
  .content { position: relative; z-index: 1; width: 100%; max-width: 760px; margin-left: auto; margin-right: auto; }
  .header { text-align: center; margin-bottom: 48px; }
  .badge { display: inline-block; background: var(--dim); border: 1px solid var(--border); color: var(--acid); font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.2em; padding: 6px 14px; border-radius: 2px; margin-bottom: 24px; }
  h1 { font-size: clamp(36px, 6vw, 60px); font-weight: 800; line-height: 1; letter-spacing: -0.03em; margin-bottom: 14px; background: linear-gradient(135deg, #e8e4d9 40%, #c8f135 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { color: var(--muted); font-size: 15px; }

  .server-status { display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 11px; padding: 8px 14px; border-radius: 2px; border: 1px solid var(--border); background: var(--surface); margin-bottom: 20px; }
  .dot-green { width:7px; height:7px; border-radius:50%; background:#4ade80; box-shadow: 0 0 6px #4ade80; }
  .dot-red { width:7px; height:7px; border-radius:50%; background:#f87171; }
  .dot-yellow { width:7px; height:7px; border-radius:50%; background:#fbbf24; animation: pulse 1s infinite; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 28px; margin-bottom: 20px; }
  .label { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.15em; color: var(--acid); text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  textarea { width: 100%; min-height: 160px; background: #0a0a0f; border: 1px solid var(--border); border-radius: 2px; color: #e8e4d9; font-family: 'Space Mono', monospace; font-size: 13px; line-height: 1.7; padding: 16px; resize: vertical; outline: none; transition: border-color 0.2s; }
  textarea:focus { border-color: var(--acid); }
  textarea::placeholder { color: var(--muted); }

  .row { display: flex; gap: 12px; margin-top: 16px; align-items: center; flex-wrap: wrap; }
  .btn-primary { background: var(--acid); color: #0a0a0f; border: none; padding: 14px 28px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; cursor: pointer; border-radius: 2px; transition: all 0.15s; text-transform: uppercase; }
  .btn-primary:hover:not(:disabled) { background: #d4f840; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); padding: 13px 18px; font-family: 'Space Mono', monospace; font-size: 12px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
  .btn-ghost:hover { color: #e8e4d9; border-color: #444; }
  .url-count { margin-left: auto; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); }
  .url-count span { color: var(--acid); }

  .progress-wrap { margin-top: 14px; }
  .progress-bar-bg { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin: 10px 0 6px; }
  .progress-bar-fill { height: 100%; background: var(--acid); border-radius: 2px; transition: width 0.4s ease; }
  .progress-text { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .pulse { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--acid); margin-right:8px; animation:pulse 1s infinite; }

  .site-block { border: 1px solid var(--border); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
  .site-header { display: flex; align-items: center; gap: 10px; padding: 11px 16px; background: #0d0d14; }
  .site-domain { font-family: 'Space Mono', monospace; font-size: 12px; color: #e8e4d9; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .dot-found { background: var(--acid); }
  .dot-none { background: #444; }
  .dot-proc { background: #fbbf24; animation: pulse 1s infinite; }
  .dot-pending { background: #2a2a35; border: 1px solid #444; }

  .email-list { padding: 10px 16px 12px 32px; display: flex; flex-wrap: wrap; gap: 6px; }
  .email-tag { background: rgba(200,241,53,0.08); border: 1px solid rgba(200,241,53,0.2); color: var(--acid); font-family: 'Space Mono', monospace; font-size: 12px; padding: 4px 10px; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
  .email-tag:hover { background: rgba(200,241,53,0.18); }
  .no-email { padding: 8px 16px 10px 32px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--muted); }
  .error-tag { padding: 8px 16px 10px 32px; font-family: 'Space Mono', monospace; font-size: 12px; color: #f87171; }

  .stat-chip { background: var(--dim); border: 1px solid var(--border); border-radius: 2px; padding: 5px 12px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--acid); }
  .results-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }

  .export-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
  .btn-export { background: var(--dim); color: #e8e4d9; border: 1px solid var(--border); padding: 10px 20px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; border-radius: 2px; transition: all 0.15s; letter-spacing: 0.04em; }
  .btn-export:hover { border-color: var(--acid); color: var(--acid); }

  .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--acid); color: #0a0a0f; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 2px; z-index: 999; animation: fadeUp 0.25s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translate(-50%,10px)} to{opacity:1;transform:translate(-50%,0)} }

  .install-box { background: #0a0a0f; border: 1px solid var(--border); border-radius: 2px; padding: 16px; margin-top: 12px; font-family: 'Space Mono', monospace; font-size: 12px; line-height: 2; color: var(--muted); }
  .install-box span { color: var(--acid); }
`;

const BACKEND = "http://localhost:5000";

function parseUrls(text) {
  return text.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 3 && (u.startsWith("http") || u.includes("."))).map(u => u.startsWith("http") ? u : "https://" + u);
}

function getDomain(url) {
  try { return new URL(url.trim()).hostname; } catch { return url.trim(); }
}

export default function App() {
  const [urlText, setUrlText] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [toast, setToast] = useState("");
  const [serverOk, setServerOk] = useState(null); // null=checking, true=ok, false=down
  const abortRef = useRef(false);
  const readerRef = useRef(null);

  const urls = parseUrls(urlText);

  // Check server on mount
  useState(() => {
    fetch(`${BACKEND}/health`).then(r => r.ok ? setServerOk(true) : setServerOk(false)).catch(() => setServerOk(false));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  async function run() {
    if (!urls.length || !serverOk) return;
    abortRef.current = false;
    setRunning(true);
    setProgress({ done: 0, total: urls.length });

    const init = urls.map(u => ({ url: u, domain: getDomain(u), status: "pending", emails: [] }));
    setResults([...init]);
    const arr = [...init];

    try {
      const res = await fetch(`${BACKEND}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || abortRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "processing") {
              const i = arr.findIndex(r => r.url === event.url);
              if (i !== -1) { arr[i] = { ...arr[i], status: "processing" }; setResults([...arr]); }
            } else if (event.type === "result") {
              const i = arr.findIndex(r => r.url === event.url);
              if (i !== -1) {
                arr[i] = { ...arr[i], status: event.emails.length ? "found" : "none", emails: event.emails };
                setResults([...arr]);
                setProgress(p => ({ ...p, done: p.done + 1 }));
              }
            } else if (event.type === "error") {
              const i = arr.findIndex(r => r.url === event.url);
              if (i !== -1) { arr[i] = { ...arr[i], status: "error" }; setResults([...arr]); setProgress(p => ({ ...p, done: p.done + 1 })); }
            } else if (event.type === "done") {
              break;
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }

    setRunning(false);
  }

  function stop() {
    abortRef.current = true;
    try { readerRef.current?.cancel(); } catch {}
    setRunning(false);
  }

  function getAllEmails() {
    if (!results) return [];
    const all = new Set();
    for (const r of results) for (const e of r.emails) all.add(e);
    return [...all].sort();
  }

  function copyAll() {
    const emails = getAllEmails();
    if (!emails.length) return;
    navigator.clipboard.writeText(emails.join("\n"));
    showToast(`✓ Copied ${emails.length} emails`);
  }

  function downloadCSV() {
    if (!results) return;
    const rows = [["website", "email"]];
    for (const r of results) {
      if (r.emails.length) for (const e of r.emails) rows.push([r.domain, e]);
      else rows.push([r.domain, "NOT FOUND"]);
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "emails_found.csv";
    a.click();
    showToast("✓ CSV downloaded");
  }

  function downloadTXT() {
    const emails = getAllEmails();
    const txt = `ALL UNIQUE EMAILS\n${"=".repeat(40)}\n\n${emails.join("\n")}\n\nTotal: ${emails.length}`;
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = "emails_found.txt";
    a.click();
    showToast("✓ TXT downloaded");
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const allEmails = getAllEmails();
  const foundCount = results ? results.filter(r => r.status === "found").length : 0;

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <div className="bg-grid" /><div className="glow" />
        <div className="content">
          <div className="header">
            <div className="badge">⚡ EMAIL EXTRACTOR v2</div>
            <h1>EXTRACT EMAILS<br />FROM ANY SITE</h1>
            <p className="subtitle">No API key needed — direct website crawling</p>
          </div>

          {/* Server Status */}
          <div className="server-status">
            <div className={serverOk === null ? "dot-yellow" : serverOk ? "dot-green" : "dot-red"} />
            {serverOk === null && "Server check kar raha hun..."}
            {serverOk === true && "Backend server connected ✓ — Ready to extract"}
            {serverOk === false && (
              <span>Backend server not found — <span style={{color:"#fbbf24"}}>Run first server.py!</span></span>
            )}
            {serverOk === false && (
              <button className="btn-ghost" style={{marginLeft:"auto", padding:"4px 10px", fontSize:11}} onClick={() => {
                setServerOk(null);
                fetch(`${BACKEND}/health`).then(r => r.ok ? setServerOk(true) : setServerOk(false)).catch(() => setServerOk(false));
              }}>Retry</button>
            )}
          </div>

          {serverOk === false && (
            <div className="install-box">
              <span>Run these commands in CMD:</span><br />
              pip install flask flask-cors requests beautifulsoup4 lxml<br />
              python server.py<br /><br />
              <span>Then refresh the browser</span>
            </div>
          )}

          <div className="card">
            <div className="label">URLs</div>
            <textarea
              value={urlText}
              onChange={e => setUrlText(e.target.value)}
              placeholder={"https://example.com\nhttps://company.com\nhttps://business.com\n\n(Ek line mein ek URL)"}
              disabled={running}
            />
            <div className="row">
              <button className="btn-primary" onClick={run} disabled={running || !urls.length || !serverOk}>
                {running ? "Extracting..." : "Extract Emails →"}
              </button>
              {running && <button className="btn-ghost" onClick={stop}>Stop</button>}
              {!running && urlText && <button className="btn-ghost" onClick={() => { setUrlText(""); setResults(null); }}>Clear</button>}
              {urls.length > 0 && <div className="url-count"><span>{urls.length}</span> URLs</div>}
            </div>
            {running && (
              <div className="progress-wrap">
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: pct + "%" }} /></div>
                <div className="progress-text">
                  <span><span className="pulse" />{progress.done} / {progress.total} done</span>
                  <span>{pct}%</span>
                </div>
              </div>
            )}
          </div>

          {results && (
            <div className="card">
              <div className="results-top">
                <div className="label" style={{ marginBottom: 0, flex: 1 }}>Results</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="stat-chip">{allEmails.length} emails</div>
                  <div className="stat-chip">{foundCount}/{results.length} sites</div>
                </div>
              </div>
              {results.map((r, i) => (
                <div key={i} className="site-block">
                  <div className="site-header">
                    <div className={`status-dot ${r.status === "found" ? "dot-found" : r.status === "processing" ? "dot-proc" : r.status === "pending" ? "dot-pending" : "dot-none"}`} />
                    <div className="site-domain">{r.domain}</div>
                    {r.status === "processing" && <span style={{ fontFamily: "Space Mono", fontSize: 11, color: "#fbbf24" }}>scanning...</span>}
                    {r.emails.length > 0 && <span style={{ fontFamily: "Space Mono", fontSize: 11, color: "var(--acid)" }}>{r.emails.length}</span>}
                  </div>
                  {r.status === "found" && (
                    <div className="email-list">
                      {r.emails.map((em, j) => (
                        <span key={j} className="email-tag" onClick={() => { navigator.clipboard.writeText(em); showToast("✓ Copied!"); }} title="Click to copy">{em}</span>
                      ))}
                    </div>
                  )}
                  {r.status === "none" && <div className="no-email">No email found</div>}
                  {r.status === "error" && <div className="error-tag">⚠ Could not reach site</div>}
                </div>
              ))}
              {allEmails.length > 0 && (
                <div className="export-row">
                  <button className="btn-export" onClick={copyAll}>Copy All Emails</button>
                  <button className="btn-export" onClick={downloadCSV}>Download CSV</button>
                  <button className="btn-export" onClick={downloadTXT}>Download TXT</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}