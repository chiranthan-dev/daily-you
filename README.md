# 🚀 Daily You

> **A full-stack productivity platform that transforms self-improvement into a competitive game.**

Daily You combines **goal tracking, sleep analysis, nutrition tracking, habit management, and social competition** into one application. Instead of simply recording progress, the platform rewards consistency and penalizes missed goals through a points-based economy, encouraging long-term discipline and accountability.

---

# 📸 Application Preview

> **Replace these placeholders with your screenshots.**

## Hero Screenshot

**Image:** `images/dashboard.png`

*A full dashboard showing Goals, Today's Points, Progress, and Navigation.*

---

## Goal Management

**Image:** `images/goals.png`

Track High, Medium, and Low priority goals with automatic deadline penalties.

---

## Sleep Tracking

**Image:** `images/sleep.png`

Monitor sleep duration and consistency while earning or losing points based on your target schedule.

---

## Nutrition & Macros

**Image:** `images/macros.png`

Track protein, carbohydrates, and fats against daily nutritional targets.

---

## Leaderboard

**Image:** `images/leaderboard.png`

Compete with friends through a live leaderboard to encourage consistency.

---

## Shop

**Image:** `images/shop.png`

Spend earned points on rewards such as Freeze Cards that protect against daily penalties.

---

# 🎥 Demo

> Add a GIF here showing:

1. Login
2. Create Goal
3. Complete Goal
4. Gain Points
5. Open Leaderboard
6. Purchase Freeze Card

**Recommended file**

```
images/demo.gif
```

---

# ✨ Features

## 🎯 Goal Management

* High, Medium and Low priority goals
* Automatic deadline penalties
* Daily completion tracking
* Monthly reset system

---

## 🌙 Sleep Tracking

* Sleep & wake time logging
* Target sleep schedule
* Sleep score calculation
* Automatic rewards and penalties

---

## 🍽️ Macro Tracking

* Protein tracking
* Carbohydrate tracking
* Fat tracking
* Deviation-based scoring

---

## ✅ Habit Tracking

* Daily recurring habits
* Progress monitoring
* Completion statistics

---

## 🏆 Social Competition

* Friend system
* Live leaderboard
* Username search
* Competitive point rankings

---

## 🛒 Virtual Shop

* Spend earned points
* Freeze Cards
* Future reward expansion

---

# 💡 Why I Built This

Most productivity applications only record what users accomplish.

I wanted to build a platform that encourages consistency through meaningful consequences. By combining multiple aspects of self-improvement into one application and introducing a points economy, Daily You makes maintaining healthy habits more engaging while promoting accountability through friendly competition.

---

# 🏗️ System Architecture

**Image:** `images/architecture.png`

Create a simple diagram like:

```
                React + Vite

                      │

                      ▼

              Express REST API

                      │

        JWT Authentication Layer

                      │

                      ▼

              MongoDB Atlas

                      │

                      ▼

             Vercel Deployment
```

---

# ⚙️ Tech Stack

| Layer           | Technology      |
| --------------- | --------------- |
| Frontend        | React 19 + Vite |
| Backend         | Node.js         |
| Framework       | Express.js      |
| Database        | MongoDB Atlas   |
| Authentication  | JWT             |
| Deployment      | Vercel          |
| Styling         | Vanilla CSS     |
| Version Control | Git + GitHub    |

---

# 📂 Project Structure

```
daily-you
│
├── client
│   ├── src
│   ├── components
│   ├── pages
│   ├── context
│   └── api
│
├── server
│   ├── routes
│   ├── middleware
│   ├── models
│   └── index.js
│
├── vercel.json
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/daily-you.git
cd daily-you
```

## Install Dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd ../client
npm install
```

---

# 🔐 Environment Variables

Create `server/.env`

```env
MONGODB_URI=your_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
PORT=5000
```

---

# ▶️ Running the Project

Backend

```bash
cd server
npm run dev
```

Frontend

```bash
cd client
npm run dev
```

Visit:

```
http://localhost:5173
```

---

# 📈 Points System

| Activity              | Reward                       |
| --------------------- | ---------------------------- |
| High Priority Goal    | +4                           |
| Medium Priority Goal  | +2                           |
| Low Priority Goal     | +1                           |
| Sleep Target Achieved | +5                           |
| Macro Target Achieved | +5                           |
| Missed Goals          | Penalties Applied            |
| Freeze Card           | Prevents one day's penalties |

Monthly positive points carry forward, while negative balances reset to zero.

---

# 🧠 Technical Challenges

* Designing a fair and balanced scoring algorithm
* Building secure JWT authentication
* Structuring scalable REST APIs
* Managing multiple independent trackers within a single application
* Synchronizing daily penalties automatically
* Deploying both frontend and backend through a unified Vercel configuration

---

# 📌 Future Improvements

* Mobile application
* Push notifications
* AI-powered habit recommendations
* Google Calendar integration
* Smart reminders
* Weekly productivity analytics
* Apple Health & Google Fit integration
* Achievement badges
* Team challenges

---

# 📚 What I Learned

Through this project I gained practical experience in:

* Full-stack application architecture
* Authentication using JWT
* REST API development
* MongoDB data modelling
* React state management
* Frontend-backend integration
* Cloud deployment using Vercel
* Building scalable project structures

---

# 📄 License

This project is licensed under the MIT License.

---

# 👤 Author

**Chiranthan**

Computer Science Student | Full-Stack Developer

If you found this project interesting, feel free to star the repository.
