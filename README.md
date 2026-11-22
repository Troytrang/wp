# Portfolio — Lương Nguyễn Thu Trang (Video Editor)

Static site (HTML/CSS/JS, no build step). Deploys on Vercel as-is.

## Add or change videos
Videos are listed in the Google Sheet **"Portfolio – Danh sách video"** (id in `data.js` → `sheetId`). Add a row, paste the link, pick the group (Game Ads / LED Visual / Brand & Product) and frame (Dọc / Ngang). The site reads it on every visit; no deploy needed. The sheet must stay shared as *Anyone with the link – Viewer*.

If the sheet can't be read, the lists in **`data.js`** are used:
- `showreel`: link to the main showreel.
- each section (`game-ads`, `led-visual`, `brand-product`) has an `items` list.
  Each item: `title`, `tags`, `year`, `format` (`"vertical"` 9:16 or `"wide"` 16:9) and `video`.
- `video` accepts YouTube links (watch, youtu.be, shorts), Vimeo links or direct .mp4/.webm links. Videos play muted on loop inside their frame; a click opens them with sound. Leave `""` to show a "coming soon" frame.

## Deploy
1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project → import the repo → Deploy** (Framework preset: *Other*, no build command).
3. Every push to `main` redeploys automatically.

## Files
- `index.html` – page structure · `style.css` – look · `script.js` – tabs, lightbox, animations · `assets/` – vector graphics from the CV.

### Cột "Tiếng" (không bắt buộc)
Ghi **Có** hoặc **Không**. Để trống thì web tự đoán: LED Visual = không tiếng, Game Ads và Brand & Product = có tiếng.
Video không tiếng hiện nút "▶ PLAY" (thay vì "PLAY WITH SOUND"), có nhãn NO AUDIO khi mở, và nhạc nền của web vẫn chạy tiếp.
