# Running a Split FastAPI + Node/Vite App

A personal reference for shipping and launching local-first web apps that have a Python (FastAPI/uvicorn) backend and a JavaScript (React/Vite, Next, Svelte, etc.) frontend. Focus is on **single-user, local-only** use — no cloud, no Docker required.

Ordered from simplest to fanciest. Pick based on how "app-like" you want the experience.

---

## TL;DR decision tree

- Just want to stop opening two terminals? → **Option 1** (one shell script).
- Want a single process / single port? → **Option 2** (FastAPI serves the built frontend).
- Want it always running, auto-start on login? → **Option 5** (systemd user service) + Option 2.
- Want it to feel like a real desktop app? → **Option 6** (pywebview / Tauri / PWA).

---

## Prerequisites

Before any of these options, the frontend must be **built** for production:

```bash
cd frontend
npm install      # once, or after dependency changes
npm run build    # produces frontend/dist/ (Vite) or frontend/.next/ (Next), etc.
```

You only re-run `npm run build` when frontend source changes. Backend changes just need uvicorn to restart.

> `npm run dev` is **dev-only** (HMR, source maps, unminified). Don't use it for "finished" apps.
> `npm run preview` serves the built `dist/` on port 4173 — useful for quickly sanity-checking a build.

---

## Option 1 — One shell script (two processes, one command)

Lowest-effort fix for "I'm tired of opening two terminals." Keeps backend and frontend as separate processes but starts/stops them together.

### `start.sh` (Linux/macOS)

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

cleanup() { kill 0; }
trap cleanup EXIT INT TERM

uv run uvicorn backend.main:app --port 8000 &
( cd frontend && npm run preview -- --port 5173 ) &

wait
```

Make it executable once: `chmod +x start.sh`. Then just `./start.sh`. Ctrl+C kills both.

### Variant: open the browser too

Append before `wait`:

```bash
sleep 1 && xdg-open http://localhost:5173 &   # Linux
# sleep 1 && open http://localhost:5173 &     # macOS
```

### `start.ps1` (Windows)

```powershell
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$backend  = Start-Process -PassThru -NoNewWindow uv "run uvicorn backend.main:app --port 8000"
$frontend = Start-Process -PassThru -NoNewWindow -WorkingDirectory frontend npm "run preview -- --port 5173"

try   { Wait-Process -Id $backend.Id, $frontend.Id }
finally {
  Stop-Process -Id $backend.Id, $frontend.Id -ErrorAction SilentlyContinue
}
```

**Pros:** trivial, works everywhere, still easy to debug each process.
**Cons:** still two ports, two processes, CORS/proxy config required.

---

## Option 2 — Single process: FastAPI serves the built frontend (recommended)

The cleanest setup for a personal tool. Backend and frontend share one port, one process. No CORS, no Vite preview server.

### Setup

1. Build the frontend: `cd frontend && npm run build`.
2. Mount the `dist/` directory in `backend/main.py`:

```python
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# ... your /api routes here ...

# Mount LAST so /api routes take precedence
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="spa")
```

3. Start:

```bash
uv run uvicorn backend.main:app --port 8000
```

4. Open `http://localhost:8000`. Done.

### SPA routing gotcha

If the frontend uses client-side routing (React Router, etc.), a hard refresh on `/some/deep/route` returns 404 because FastAPI looks for a file. Add a catch-all that falls back to `index.html`:

```python
from fastapi.responses import FileResponse

@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    return FileResponse(DIST / "index.html")
```

Register this **after** all `/api` routes and after the `StaticFiles` mount.

### For Next.js instead of Vite

Next.js in production is its own Node server. Either:
- Use `next export` (if your app is static-friendly) and treat `out/` the same as `dist/` above.
- Or keep Next running separately and stick with Option 1 / Option 3.

**Pros:** one port, one process, one URL to bookmark, deployable anywhere later.
**Cons:** you must rebuild the frontend after every change (no HMR — that's what dev mode is for).

---

## Option 3 — Process manager (two processes, better ergonomics)

If you prefer keeping backend/frontend split but want nicer logs and restart behavior than a bare shell script.

### Using [`concurrently`](https://www.npmjs.com/package/concurrently) (Node)

```bash
npm install --save-dev concurrently
```

Add to root `package.json`:

```json
{
  "scripts": {
    "start": "concurrently -n api,web -c blue,green \"uv run uvicorn backend.main:app --port 8000\" \"cd frontend && npm run preview -- --port 5173\""
  }
}
```

Then `npm start`.

### Using [`honcho`](https://honcho.readthedocs.io/) / `foreman` (Procfile)

Create a `Procfile`:

```
api: uv run uvicorn backend.main:app --port 8000
web: cd frontend && npm run preview -- --port 5173
```

Then:

```bash
uv run honcho start     # or: foreman start
```

### Using [`overmind`](https://github.com/DarthSim/overmind)

Same `Procfile`, but with tmux-backed sessions — you can attach to each process individually. Nicest for long-lived personal apps.

```bash
overmind start
overmind connect api     # attach to backend logs
```

**Pros:** colored/prefixed logs, clean shutdown, per-process inspection.
**Cons:** extra dependency.

---

## Option 4 — Dev mode (what you're probably doing now)

Only worth listing for completeness. Fine while actively developing; overkill once you're "done."

```bash
# Terminal 1
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev    # Vite on :5173, proxies /api to :8000
```

Graduate to Option 1 or 2 once the app stabilizes.

---

## Option 5 — systemd user service (Linux, set-and-forget)

Auto-starts on login, restarts on crash, survives reboots. Pairs best with **Option 2** (single process).

Create `~/.config/systemd/user/myapp.service`:

```ini
[Unit]
Description=My App
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/path/to/project
ExecStart=/usr/bin/env uv run uvicorn backend.main:app --port 8000
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
```

Enable and start:

```bash
systemctl --user daemon-reload
systemctl --user enable --now myapp.service
systemctl --user status myapp.service
journalctl --user -u myapp.service -f    # tail logs
```

To survive full logout (not just screen lock):

```bash
sudo loginctl enable-linger "$USER"
```

Create a `.desktop` launcher at `~/.local/share/applications/myapp.desktop` so it shows up in your app menu:

```ini
[Desktop Entry]
Name=My App
Exec=xdg-open http://localhost:8000
Icon=text-html
Type=Application
Categories=Utility;
```

**Pros:** zero friction forever. Bookmark the URL and forget it exists.
**Cons:** Linux-only; debugging means reading `journalctl`.

### macOS equivalent: `launchd`

Drop a plist at `~/Library/LaunchAgents/com.you.myapp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.you.myapp</string>
  <key>WorkingDirectory</key><string>/Users/you/path/to/project</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/env</string>
    <string>uv</string><string>run</string>
    <string>uvicorn</string><string>backend.main:app</string>
    <string>--port</string><string>8000</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict>
</plist>
```

Load it: `launchctl load ~/Library/LaunchAgents/com.you.myapp.plist`.

### Windows equivalent

- **Task Scheduler** with "At log on" trigger running `start.ps1`, or
- **[NSSM](https://nssm.cc/)** to register uvicorn as a real Windows service.

---

## Option 6 — Desktop wrapper (feels like a real app)

If "localhost:8000 in a browser tab" bugs you, wrap it.

### 6a. pywebview (easiest, pure Python)

```bash
uv add pywebview
```

Create `launch.py` in the repo root:

```python
import threading
import uvicorn
import webview
from backend.main import app

def run_api():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

if __name__ == "__main__":
    threading.Thread(target=run_api, daemon=True).start()
    webview.create_window("My App", "http://127.0.0.1:8000", width=1200, height=800)
    webview.start()
```

Run: `uv run python launch.py`. You get a native window with the app inside. Closing the window exits cleanly.

**Pros:** ~20 lines, no Node wrapper, uses system webview (GTK WebKit / WebView2 / WKWebView).
**Cons:** not easily distributable as a single binary.

### 6b. PWA "Install app"

Zero extra dependencies. If you're using Option 2:

1. Add `frontend/public/manifest.webmanifest` with name, icons, `start_url: "/"`, `display: "standalone"`.
2. Link it in `index.html`: `<link rel="manifest" href="/manifest.webmanifest">`.
3. Optional: add a minimal service worker so Chrome's "Install" prompt fires.
4. In Chrome/Edge: menu → "Install app." You now have a launcher icon and a chrome-less window.

**Pros:** near-zero effort, OS-integrated icon.
**Cons:** still requires the backend process running (use Option 5).

### 6c. Tauri

Rust-based. Ships a real `.AppImage`/`.deb`/`.dmg`/`.msi`. Uses the system webview (light; ~5–15 MB bundles).

Rough shape: your Python backend is spawned as a sidecar process; the Tauri Rust shell opens a webview pointing at it. Setup is non-trivial — worth it only if you want a polished, distributable app.

### 6d. Electron

Same idea but bundles its own Chromium (~100 MB). Heavier than Tauri. Only pick this if you already know Electron well.

---

## Port & environment conventions

A few small habits that make all of the above painless:

- **Pick a fixed port per app** and write it down. Don't let Vite/Uvicorn auto-pick.
- **Centralize config in `.env`** (read by both Python via `python-dotenv` and Vite via `VITE_*` prefixes). Example:

  ```
  API_HOST=127.0.0.1
  API_PORT=8000
  VITE_API_BASE=http://127.0.0.1:8000/api
  ```

- **During dev**, configure Vite's `server.proxy` so the frontend can call `/api/...` without CORS:

  ```ts
  // vite.config.ts
  export default defineConfig({
    server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  });
  ```

- **In production (Option 2)**, the frontend hits `/api/...` on the same origin — no proxy or CORS needed.

---

## Recommendation matrix

| Want…                                        | Use                         |
| -------------------------------------------- | --------------------------- |
| "Just stop opening two terminals"            | Option 1 (shell script)     |
| "One URL, one process, feels clean"          | Option 2                    |
| "Nicer logs than a shell script"             | Option 3 (overmind/honcho)  |
| "Never think about starting it again"        | Option 2 + Option 5         |
| "Double-click an app icon"                   | Option 2 + Option 6a        |
| "Give it to a friend as a real app"          | Option 6c (Tauri)           |

For most personal tools the sweet spot is **Option 2 + Option 5 + a `.desktop` launcher**: build once, systemd keeps it running, clicking the launcher opens the browser to `localhost:<port>`.
