# Portfolio — Lương Nguyễn Thu Trang (Video Editor)

Static site (HTML/CSS/JS, no build step). Deploys on Vercel as-is.

## Add or change videos
Edit **`data.js`**:
- `showreel`: link to the main showreel.
- each section (`game-ads`, `led-visual`, `brand-product`) has an `items` list.
  Each item: `title`, `tags`, `year`, `format` (`"vertical"` 9:16 or `"wide"` 16:9) and `video`.
- `video` accepts YouTube links (watch, youtu.be, shorts) or Vimeo links. Leave `""` to show a "coming soon" frame.

## Deploy
1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project → import the repo → Deploy** (Framework preset: *Other*, no build command).
3. Every push to `main` redeploys automatically.

## Files
- `index.html` – page structure · `style.css` – look · `script.js` – tabs, lightbox, animations · `assets/` – vector graphics from the CV.
