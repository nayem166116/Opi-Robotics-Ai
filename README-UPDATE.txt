OPI ROBOTICS — UPDATED STATIC WEBSITE

The existing page copy and content have been preserved. The site remains a
static HTML/CSS/JavaScript project; no backend was added or changed.

PREVIEW / DEPLOY
Run a web server from this folder (for example: python3 -m http.server 8000)
and visit http://localhost:8000/. Do not open index.html as a file: the site
uses root-relative asset paths. For production, host at a domain root with
clean-URL support. The included vercel.json supports deployment on Vercel.
The page generators are retained; to regenerate pages, run each generate-*.js
with Node.js from this directory. No build step is required to host the pages.

CHANGES
- Inter and Space Grotesk are included locally with their OFL license files.
- Responsive layouts, spacing, forms, navigation and accessibility refined.
- Videos are compressed and poster images supplied. Only bundled MP4 sources
  are listed by the generator; replace the same MP4 path to update a video.
- Font Awesome assets are bundled with their license, avoiding a CDN dependency.
- Calculator uses the published starting node rates: Starter for 1–25 nodes,
  Scale for 26–150 nodes; Enterprise is custom, so its cost and net are not
  estimated. Actual pricing, terms and deployment costs may differ.
- The form does not collect upfront project costs. Therefore, the payback
  field shows a dash instead of inventing a break-even time. Monthly/annual
  savings remain directional estimates using the original recovery rates.

IMPORTANT: The original login, registration, email verification and password
reset are frontend-only. They do not connect to real accounts, send email, or
provide security. A backend is required before using those flows in production.

SIGNATURE DESIGN UPDATE
- Hero and page typography refreshed with the locally bundled IBM Plex Sans.
- Reworked home, capability and use-case layouts while retaining page copy.
- Backend/authentication remain unchanged and are still frontend-only.

FOOTER UPDATE
- Redesigned the footer directory and social links across every page.
- Existing footer text, link destinations, and frontend-only scope preserved.

FOOTER SPACING UPDATE
- Reduced extra space and grouped brand, copyright, and social links.
