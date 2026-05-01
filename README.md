# DAILY YOU

> **Gamified Self-Improvement Tracker** — Goals, Sleep, Macros, and Tasks with a real points-based accountability system and multiplayer leaderboard.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://daily-you-dun.vercel.app/about)

---

## What Is This?

Daily You is a personal productivity app that works by holding you financially accountable — with *points*. Hit your daily goals, sleep target, and macro targets? Earn points. Miss them? Lose points. At the end of every month, positive points carry forward and your negative balance resets to zero. It's designed to be honest and a little brutal.

**Key Features:**
- 🎯 **Goals** — High / Medium / Low priority daily goals with auto-penalty after your deadline
- 🌙 **Sleep** — Log sleep/wake times, score based on duration and deviation from target
- 🍽️ **Macros** — Track protein, carbs, and fat against your daily targets
- ✅ **Tasks** — Simple recurring habit checklist
- 🛒 **Shop** — Spend points on items like Freeze Cards (skip a day's penalties)
- 👥 **Friends** — Add friends by username and compete on a live leaderboard
- 🧊 **Freeze System** — Protect yourself from any single day's penalties

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express (Vercel Serverless) |
| Database | MongoDB Atlas |
| Auth | JWT (30-day tokens, localStorage) |
| Deployment | Vercel (frontend + backend) |
| Styling | Vanilla CSS, Outfit font, neon dark theme |

---

## Quick Start (Local)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/daily-you.git
cd daily-you

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure Environment

**Backend** — create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

Fill in:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dailyyou?retryWrites=true&w=majority
JWT_SECRET=your_long_random_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Frontend** — the client proxies `/api` to `localhost:5000` via Vite during dev. No extra config needed locally.

### 3. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open → `http://localhost:5173`  
About page (public) → `http://localhost:5173/about`

---

## Deployment (Vercel — Both Frontend & Backend)

This repo is configured for **single-project Vercel deployment** via `vercel.json`. Both the React frontend and Express backend are served from one Vercel project.

### Step-by-Step

**1. Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/daily-you.git
git push -u origin main
```

**2. Import on Vercel**
- Go to [vercel.com](https://vercel.com) → New Project → Import your repo
- **Root Directory**: leave as `/` (the repo root, NOT client or server)
- **Framework Preset**: Other
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`

**3. Add Environment Variables on Vercel**

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string |
| `CLIENT_URL` | `https://daily-you-dun.vercel.app` |
| `VITE_API_URL` | `https://daily-you-dun.vercel.app/api` |

**4. Deploy** → Vercel will build the frontend and deploy the backend as serverless functions automatically.

---

## Points System

### Goals

| Action | Points |
|---|---|
| High goal completed | +4 |
| High goal missed | −6 |
| Medium goal completed | +2 |
| Medium goal missed | −3 |
| Low goal completed | +1 |
| Low goal missed | −2 |

### Sleep

| Condition | Points |
|---|---|
| Exact target + 8h | +5 |
| Any 8h sleep | +3 |
| Within ±1.5h of target | +2 |
| < 6.5h or major deviation | −5 |

### Macros (per macro, total deviation)

| Deviation | Points |
|---|---|
| ≤ 10g | +5 |
| ≤ 30g | +2 |
| 31–49g | +1 |
| ≥ 50g | −5 |

### Shop

| Item | Cost | Effect |
|---|---|---|
| 🧊 Freeze Card | 15 pts | No penalties for one day |

> **Monthly Reset**: Positive points carry forward. Negative balance resets to 0.

---

## Project Structure

```
daily-you/
├── client/             # React + Vite frontend
│   ├── src/
│   │   ├── api/        # Axios instance
│   │   ├── components/ # Layout, Header
│   │   ├── context/    # AuthContext
│   │   └── pages/      # Goals, Sleep, Macros, Tasks, Shop, Friends, Settings, About
│   └── vite.config.js
├── server/             # Node.js + Express backend
│   ├── middleware/     # auth.js, autoSaveGoals.js
│   ├── models/         # User, Goal, Sleep, Macro, Task, Item
│   ├── routes/         # auth, goals, sleep, macros, tasks, shop, items, friends, user
│   └── index.js
├── vercel.json         # Monorepo deployment config
└── .gitignore
```

---

## License

MIT — do whatever you want with it.
