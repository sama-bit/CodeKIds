# 🎮 Coding Game Backend - Node.js + MongoDB

A complete backend for a kids coding game with 3 categories (Scratch, Python, HTML), each with 10 levels. Players can either start from Level 1 or take a placement test to find their level.

---

## 📁 Project Structure

```
coding-game-backend/
├── server.js                    # Entry point
├── .env.example                 # Environment variables template
├── package.json
│
├── config/
│   └── db.js                   # MongoDB connection
│
├── models/
│   ├── User.js                 # User schema (auth + stats)
│   ├── Level.js                # Level data schema
│   ├── UserProgress.js         # Per-user per-level progress
│   └── PlacementTest.js        # Placement test results
│
├── controllers/
│   ├── authController.js       # Register, Login, Profile
│   ├── levelController.js      # Get levels, hints, save code
│   ├── progressController.js   # Submit code, track progress
│   └── placementController.js  # Placement test flow
│
├── routes/
│   ├── authRoutes.js
│   ├── levelRoutes.js
│   ├── progressRoutes.js
│   └── placementRoutes.js
│
├── middleware/
│   ├── auth.js                 # JWT protection middleware
│   └── errorHandler.js         # Global error handler
│
├── utils/
│   ├── generateToken.js        # JWT token generator
│   └── codeValidator.js        # Validates user code submissions
│
└── data/
    ├── seed.js                 # Seeds all 30 levels into MongoDB
    └── placementQuestions.js   # 10 questions per category + scoring
```

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` file
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coding_game
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Seed the database (all 30 levels)
```bash
npm run seed
```

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

## 🎯 Game Flow

### Option A: Start from Level 1
```
Register → Choose Category → Play from Level 1 → Complete → Unlock Next Level
```

### Option B: Placement Test
```
Register → Choose Category → Take 10-question Test → Get Placed at right Level → Play
```

---

## 📡 API Endpoints

### 🔐 Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "ahmed123",
  "email": "ahmed@example.com",
  "password": "secret123",
  "age": 12,
  "avatar": "robot"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "id": "...", "username": "ahmed123", ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "secret123"
}
```

#### Get My Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 🎮 Levels

#### Get all levels for a category
```http
GET /api/levels/scratch
GET /api/levels/python
GET /api/levels/html
Authorization: Bearer <token>
```
**Response includes**: level info + user's status (locked/unlocked/completed) + stars earned

#### Get a single level (with code template)
```http
GET /api/levels/scratch/1
Authorization: Bearer <token>
```

#### Auto-save code while working
```http
PUT /api/levels/python/3/save
Authorization: Bearer <token>

{ "code": "for i in range(3):\n    move_right()" }
```

#### Get a hint
```http
GET /api/levels/html/1/hint
Authorization: Bearer <token>
```

---

### 📊 Progress

#### Submit code for a level
```http
POST /api/progress/scratch/1/submit
Authorization: Bearer <token>

{
  "code": "go_forward()\ngo_forward()\nmove_up()",
  "timeTaken": 45
}
```
**Response:**
```json
{
  "success": true,
  "result": {
    "allPassed": true,
    "completedMissions": ["reach_treasure"],
    "failedMissions": [],
    "completionPercentage": 100,
    "attempts": 1,
    "starsEarned": 3,
    "pointsEarned": 100,
    "unlockedNextLevel": true,
    "nextLevel": 2,
    "newBadges": [{ "name": "First SCRATCH Level!" }]
  }
}
```

#### Get full progress overview
```http
GET /api/progress/overview
Authorization: Bearer <token>
```

#### Get category-specific progress
```http
GET /api/progress/python
Authorization: Bearer <token>
```

---

### 📝 Placement Test

#### Get test questions
```http
GET /api/placement/python/questions
Authorization: Bearer <token>
```
Returns 10 questions (without answers).

#### Submit test answers & get placed
```http
POST /api/placement/python/submit
Authorization: Bearer <token>

{
  "answers": [
    { "questionId": "py_q1", "answer": 0 },
    { "questionId": "py_q2", "answer": 2 },
    ...
  ],
  "timeTaken": 180
}
```
**Response:**
```json
{
  "success": true,
  "result": {
    "score": 70,
    "totalPoints": 100,
    "correctAnswers": 7,
    "percentage": 70,
    "placedAtLevel": 6,
    "message": "🔥 Great job! You already know quite a bit! Starting from level 6."
  }
}
```

#### Placement scoring:
| Score % | Placed At Level |
|---------|----------------|
| 90-100% | Level 8        |
| 70-89%  | Level 6        |
| 50-69%  | Level 4        |
| 30-49%  | Level 2        |
| 0-29%   | Level 1        |

---

## ⭐ Stars System

Stars are earned based on number of attempts:
- **3 Stars** → Solved on 1st try
- **2 Stars** → Solved in 2-3 tries
- **1 Star** → Solved in 4+ tries

---

## 🏆 Badges

| Badge | How to Earn |
|-------|-------------|
| `First SCRATCH Level!` | Complete Scratch level 1 |
| `First PYTHON Level!` | Complete Python level 1 |
| `First HTML Level!` | Complete HTML level 1 |
| `SCRATCH Master!` | Complete all 10 Scratch levels |
| `PYTHON Master!` | Complete all 10 Python levels |
| `HTML Master!` | Complete all 10 HTML levels |
| `Grand Master Coder!` | Complete ALL 30 levels |

---

## 📦 MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts, stats, badges |
| `levels` | All 30 levels with templates & solutions |
| `userprogresses` | Per-user per-level progress tracking |
| `placementtests` | Placement test history |

---

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator
