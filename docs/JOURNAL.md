# Building ISU Qatalog — A Dev Journal

A personal log of building and shipping ISU Qatalog, an academic co-pilot for Iowa State University students.

---

## March 7, 2026 — Deploying to Production

Today was deployment day. The app has been running great locally for a while — React frontend, Express API, SQLite database, AI-powered course recommendations — but it was time to get it live on [isuqatalog.me](https://isuqatalog.me).

### Choosing Where to Host

My first instinct was Cloudflare since the domain is managed there, but I quickly learned that Express and SQLite can't run on Cloudflare Workers. Workers use a V8 isolate runtime, not Node.js, so none of my backend code would work without a full rewrite to something like Hono + Cloudflare D1. That's a project for another day.

I considered Railway (easy, free tier), but ended up going with a **DigitalOcean droplet** — more control, SQLite just works on disk, and Cloudflare still handles DNS and SSL in front of it. About $6/month for a small Ubuntu box.

### The Production Code Change

In development, Vite serves the React frontend and proxies API calls to Express. In production, there's no Vite dev server — Express needs to serve both the API and the built frontend. The change was small: after all the API routes, serve the `dist/` folder as static files and return `index.html` for any non-API route (SPA routing).

### A Series of Unfortunate Errors

Deployment was not smooth. I hit five distinct issues back-to-back, each one only revealing itself after the previous one was fixed. A debugging matryoshka doll.

**The OOM Kill.** I started with the cheapest droplet (512 MB RAM). Vite's production build transforms 2,100+ modules and needs real memory for the bundling step. The Linux kernel killed the process mid-build. Lesson learned: don't cheap out on the build machine. Upgraded the droplet and the build finished in 15 seconds.

**The Missing Script.** After the build succeeded, PM2 reported the app as "errored." The logs showed `Missing script: "start"`. I had added the start script locally but forgot to push to GitHub before cloning on the server. A classic "works on my machine" moment. Pushed, pulled, problem solved.

**The Missing Directory.** Next crash: `Cannot open database because the directory does not exist`. SQLite needs a `data/` directory to store the database file, but that directory is gitignored (as it should be). On a fresh clone it doesn't exist. One `mkdir` later, the server finally stayed up.

**The Ghost of GitHub Pages.** The server was running, `curl` from the server returned the correct HTML, but the browser still showed a blank page. This one was sneaky. I inspected the response headers and found `x-github-request-id` — the request wasn't even hitting my server. Turns out my Cloudflare DNS had old A records pointing to GitHub Pages from a previous setup. Cloudflare was round-robining between GitHub Pages and my droplet, and GitHub Pages was serving the raw unbuilt `index.html`. Deleted the stale records.

**The SSL Mismatch.** Final boss. After fixing DNS, Cloudflare showed a 521 "Host Error." Cloudflare's SSL mode was set to "Full," which means it tries to connect to the origin server over HTTPS. But Nginx was only listening on port 80 (HTTP). Switched Cloudflare to "Flexible" mode — it terminates SSL for visitors and talks to my server over plain HTTP.

### The Architecture

The final setup is clean:

```
Browser → Cloudflare (HTTPS + CDN) → Nginx → Express
                                                ├── API routes
                                                └── React SPA
```

Cloudflare handles SSL certificates and caching. Nginx reverse-proxies to Express. Express serves both the API and the static frontend. SQLite lives on disk. PM2 keeps the process alive and restarts it on crashes or reboots.

### Takeaways

- Always check your DNS records for stale entries before debugging the app itself.
- Vite builds need more than 512 MB RAM. Budget at least 1 GB.
- Gitignored directories that your app creates at runtime won't exist on a fresh deploy. Document them or create them programmatically.
- Cloudflare's SSL modes matter — "Full" expects HTTPS on your origin, "Flexible" doesn't.
- Five errors in a row sounds frustrating, but each one took under five minutes to diagnose once I read the logs carefully. **Read the logs.**

---

## March 7, 2026 — Cleaning Up and Automating Deploys

After getting the site live, I spent some time cleaning up the repo. Removed a stale `CNAME` file left over from when the domain pointed to GitHub Pages — that was actually the root cause of the blank page earlier. Organized all the documentation into a `docs/` folder, added Cloudflare Web Analytics, and set up the `.gitignore` properly so private notes and editor configs stay local.

The biggest quality-of-life improvement: a one-command deploy. Instead of SSHing into the server manually every time, `npm run deploy` does everything — pulls the latest code, installs dependencies, rebuilds the frontend, and restarts the server. One line, about 30 seconds, done. I considered setting up auto-deploy via GitHub webhooks but decided against it — for a solo project, having explicit control over when deploys happen is more practical and there's no webhook endpoint to secure.

---
