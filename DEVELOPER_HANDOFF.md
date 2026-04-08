# Nextdot Sales Engine — Developer Handoff
**For:** Tanvi / Developer
**From:** Ayush Prashar
**Project:** Internal Sales CRM + AI Assistant
**Stack:** React, Google Sheets (backend), Anthropic Claude API

---

## What You're Building

A live internal sales tool for Nextdot. It reads and writes deal data to Google Sheets, uses Claude AI for sales coaching and intelligence, and has a voice + text chatbot built in. Two user roles: CEO and Sales Team.

**Live URL target:** `crm.nextdot.co.in` (or a Vercel subdomain to start)

---

## Files You're Receiving

```
nextdot-sales-engine/
├── src/
│   ├── App.js          ← The entire application (single file)
│   └── index.js        ← React entry point (do not edit)
├── public/
│   └── index.html      ← HTML shell (do not edit)
├── .env.example        ← Template for environment variables
├── .gitignore          ← Protects secrets from being committed
└── package.json        ← Dependencies
```

---

## Step 1 — Prerequisites

Make sure you have these installed:
```bash
node --version    # Should be 16+ (install from nodejs.org if not)
npm --version     # Comes with Node
```

---

## Step 2 — Set Up the Project

```bash
# 1. Create a folder and place all the files inside it
mkdir nextdot-sales-engine
cd nextdot-sales-engine

# 2. Install dependencies (takes 2-3 minutes first time)
npm install

# 3. Create your environment file
cp .env.example .env
```

---

## Step 3 — Configure the API Keys (IMPORTANT)

Open the `.env` file in any text editor. You will see:

```
REACT_APP_ANTHROPIC_KEY=sk-ant-api03-YOUR_KEY_HERE
REACT_APP_SHEETS_API=https://script.google.com/macros/s/AKfycbzJbniVPx5n5FMKh9v6MIIP6Lew6LmIJMDve659rLi2qvV4sfbQxi2sJBTSoOJq7FKz6Q/exec
```

### API Key 1: Anthropic (Claude AI)
- Go to: https://console.anthropic.com/keys
- Click **Create Key**
- Copy the key (starts with `sk-ant-api03-...`)
- Paste it as the value of `REACT_APP_ANTHROPIC_KEY`
- **The Google Sheets URL is already filled in — do not change it**

Your `.env` should look like this when done:
```
REACT_APP_ANTHROPIC_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxx
REACT_APP_SHEETS_API=https://script.google.com/macros/s/AKfycbzJbniVPx5n5FMKh9v6MIIP6Lew6LmIJMDve659rLi2qvV4sfbQxi2sJBTSoOJq7FKz6Q/exec
```

### ⚠️ CRITICAL SECURITY RULES
1. **NEVER commit `.env` to GitHub** — it's already in `.gitignore`
2. **NEVER share the `.env` file** over email or Slack
3. The Anthropic key is paid — if it leaks, it costs money
4. For production (Vercel), you will add these keys in the Vercel dashboard — NOT in a file

---

## Step 4 — Run Locally (Test First)

```bash
npm start
```

This opens the app at `http://localhost:3000`

**Test logins:**
| Role | Password |
|------|----------|
| Ayush (CEO) | `nd-ceo-2026` |
| Sales Team | `nd-sales-2026` |

**First time only:** Log in as Ayush → look for **"Seed Sheets"** button in the header → click it once to populate Google Sheets with the initial deal data.

If everything works locally, proceed to deployment.

---

## Step 5 — Deploy to Vercel (Recommended)

### Option A — Via Vercel CLI (fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (run from project folder)
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: nextdot-sales-engine
# - Which directory is your code? ./  (press Enter)
# - Override settings? No
```

### Option B — Via GitHub + Vercel Dashboard

1. Create a GitHub repo (private): `nextdot-sales-engine`
2. Push the code:
```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_ORG/nextdot-sales-engine.git
git push -u origin main
```
3. Go to vercel.com → **New Project** → Import from GitHub
4. Select the repo → Click **Deploy**

### Add Environment Variables to Vercel

After deploying, go to:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add both variables:
```
REACT_APP_ANTHROPIC_KEY    →  sk-ant-api03-xxxx...
REACT_APP_SHEETS_API       →  https://script.google.com/macros/s/AKfycbz.../exec
```

Set both to apply to: **Production, Preview, Development**

Then go to **Deployments → Redeploy** (so the new env vars take effect).

---

## Step 6 — Custom Domain (Optional)

To use `crm.nextdot.co.in`:

1. Vercel Dashboard → Your Project → **Settings → Domains**
2. Add: `crm.nextdot.co.in`
3. Vercel gives you a CNAME record — e.g. `cname.vercel-dns.com`
4. Log into GoDaddy → DNS Management for `nextdot.co.in`
5. Add a CNAME record:
   - **Name:** `crm`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 600
6. Wait 10–30 minutes for DNS to propagate
7. Done — `crm.nextdot.co.in` is live

---

## Architecture Overview

```
User Browser
    │
    ├──── React App (Vercel) ─────────────────────────────────┐
    │         │                                               │
    │         ├── Reads/Writes deals, activity,              │
    │         │   win/loss, decks                            │
    │         ▼                                               │
    │    Google Sheets API                                    │
    │    (Apps Script Web App)                                │
    │                                                         │
    │         ├── AI features (coach, capture,               │
    │         │   proposal, chatbot, forecast)                │
    │         ▼                                               │
    │    Anthropic Claude API                                 │
    │    (claude-sonnet-4-20250514)                          │
    └────────────────────────────────────────────────────────┘
```

---

## Google Sheets Structure

The app reads/writes to 5 tabs in the Sheet. Headers must match exactly.

**Deals**
```
id | client | contact | value | stage | owner | vertical | priority | lastTouch | nextAction | nextDate | notes | handoffDone | healthScore | createdAt | updatedAt
```

**Activity**
```
id | dealId | client | type | note | owner | timestamp
```

**WinLoss**
```
id | client | value | vertical | result | reason | daysInPipeline | stage | owner | closedAt
```

**Targets**
```
month | aiSolutions_target | aiSolutions_actual | aiProducts_target | aiProducts_actual | services_target | services_actual | totalHeadcount
```

**Decks**
```
id | title | link | tags | lastUpdated | notes
```

---

## Common Issues & Fixes

**"Network error" on API calls**
→ Check that `.env` has correct keys and you've restarted `npm start` after editing `.env`

**Sheet data not loading**
→ Make sure the Apps Script is deployed as "Anyone can access"
→ Check Sheet tab names match exactly (case-sensitive)

**Voice input not working**
→ Voice requires Chrome browser. Won't work on Safari or Firefox.

**Build fails on Vercel**
→ Make sure environment variables are set in Vercel dashboard before deploying
→ Run `npm run build` locally first to catch errors

**CORS error on Anthropic API**
→ The app uses `anthropic-dangerous-direct-browser-access: true` header — this is expected for browser-based apps

---

## Estimated Setup Time

| Task | Time |
|------|------|
| Install Node + npm | 5 min |
| Install dependencies (`npm install`) | 3 min |
| Configure `.env` file | 5 min |
| Test locally (`npm start`) | 5 min |
| Deploy to Vercel | 10 min |
| Add env vars to Vercel + redeploy | 5 min |
| Custom domain DNS | 10 min + propagation |
| **Total** | **~45 minutes** |

---

## Contact

Any questions during setup → WhatsApp Ayush directly.
Do not share API keys over any channel. Store them only in `.env` locally and in Vercel environment variables.
