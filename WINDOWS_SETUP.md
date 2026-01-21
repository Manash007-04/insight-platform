# 🪟 AMEP - Windows One-Click Setup Guide

This guide shows you how to run the entire AMEP platform on Windows with a **single command**.

---

## 🚀 Quick Start (TL;DR)

```cmd
# Just double-click this file:
start-amep.bat
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Install all dependencies
- ✅ Setup databases
- ✅ Start all services
- ✅ Open your browser

---

## 📋 Prerequisites

### Required Software

1. **Python 3.11+**
   - Download: https://www.python.org/downloads/
   - ⚠️ **Important:** Check "Add Python to PATH" during installation

2. **Node.js 18+**
   - Download: https://nodejs.org/
   - LTS version recommended

3. **MongoDB 7.0+**
   - **Option A (Recommended):** Docker Desktop
     - Download: https://www.docker.com/products/docker-desktop/
     - Script will use Docker for MongoDB

   - **Option B:** MongoDB Community
     - Download: https://www.mongodb.com/try/download/community
     - Install as Windows Service

4. **Redis (Optional but Recommended)**
   - **Option A:** Docker (included in Docker Desktop)
   - **Option B:** Redis for Windows
     - Download: https://github.com/microsoftarchive/redis/releases
     - Or use Memurai: https://www.memurai.com/

### Verify Installation

Open Command Prompt and run:

```cmd
python --version
# Should show: Python 3.11.x or higher

node --version
# Should show: v18.x.x or higher

npm --version
# Should show: 9.x.x or higher

mongod --version
# Should show MongoDB version (or skip if using Docker)
```

---

## 📦 Installation Methods

### Method 1: One-Click Startup (Recommended)

**Just double-click:** `start-amep.bat`

The script will guide you through:
1. Prerequisites check
2. Dependency installation
3. Database setup
4. Service startup
5. Browser launch

**First run takes 5-10 minutes** (installing dependencies)
**Subsequent runs take 10-30 seconds**

---

### Method 2: Manual Setup

If you prefer manual control:

#### Step 1: Setup Backend

```cmd
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Initialize database
python -c "from models.database import init_db; init_db()"
python -c "from models.database import seed_sample_data; seed_sample_data()"
```

#### Step 2: Setup Frontend

```cmd
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

#### Step 3: Start MongoDB

**Using Docker:**
```cmd
docker run -d --name amep-mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=amep_db mongo:7.0
```

**Using Windows Service:**
```cmd
net start MongoDB
```

**Manual Start:**
```cmd
mongod --dbpath=%USERPROFILE%\mongodb\data
```

#### Step 4: Start Redis (Optional)

**Using Docker:**
```cmd
docker run -d --name amep-redis -p 6379:6379 redis:7-alpine
```

**Manual Start:**
```cmd
redis-server
```

#### Step 5: Start Backend

```cmd
cd backend
venv\Scripts\activate
python app.py
```

Backend runs on: http://localhost:5000

#### Step 6: Start Frontend

```cmd
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 🎮 Control Scripts

### start-amep.bat
**One-click startup** - Installs everything and starts all services

```cmd
# Double-click or run from command prompt:
start-amep.bat
```

**What it does:**
1. ✅ Checks prerequisites (Python, Node, MongoDB)
2. ✅ Creates virtual environment (first run only)
3. ✅ Installs Python dependencies (first run only)
4. ✅ Installs Node dependencies (first run only)
5. ✅ Creates .env configuration files
6. ✅ Starts MongoDB (Docker or local)
7. ✅ Starts Redis (optional)
8. ✅ Initializes database
9. ✅ Loads sample data
10. ✅ Starts backend server (Flask)
11. ✅ Starts frontend server (Vite)
12. ✅ Opens browser

**Time:**
- First run: 5-10 minutes (installing dependencies)
- Subsequent runs: 10-30 seconds

---

### stop-amep.bat
**Stop all services**

```cmd
stop-amep.bat
```

**What it stops:**
- Frontend (Node/Vite)
- Backend (Python/Flask)
- MongoDB
- Redis
- Celery workers

---

### check-status.bat
**Check what's running**

```cmd
check-status.bat
```

**Shows:**
- ✅ Which services are running
- ✅ Which ports are in use
- ✅ Database connection status
- ✅ Number of records in database
- ✅ Running processes

---

### troubleshoot.bat
**Interactive troubleshooting**

```cmd
troubleshoot.bat
```

**Options:**
1. Check services status
2. Check port conflicts
3. Test database connection
4. Reinstall dependencies
5. Reset everything (clean install)
6. View logs

---

## 🌐 Accessing the Application

After starting, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost:5000 | REST API |
| **API Health** | http://localhost:5000/api/health | Health check |
| **MongoDB** | mongodb://localhost:27017 | Database |
| **Redis** | redis://localhost:6379 | Cache (optional) |

---

## 🔑 Demo Credentials

After loading sample data:

**Teacher Account:**
- Email: `teacher@amep.edu`
- Password: `demo123`

**Student Account:**
- Email: `student1@amep.edu`
- Password: `demo123`

---

## 📊 What's Included in Sample Data

The startup script loads:

- ✅ **5 Students** (Alice, Bob, Carol, David, Emma)
- ✅ **1 Teacher** (Jane Smith)
- ✅ **4 Concepts** (Linear Equations, Quadratic Equations, Pythagorean Theorem, Statistics)
- ✅ **2 Templates** (Ecosystem Investigation, Sports Statistics)
- ✅ **1 Project** (Sustainable Energy Solutions)
- ✅ **1 Team** (Team Alpha with 4 members)
- ✅ **Mastery Data** (20 mastery records across students and concepts)

---

## 🛠️ Troubleshooting

### Issue: "Python is not installed or not in PATH"

**Solution:**
1. Install Python from https://www.python.org/downloads/
2. ⚠️ **Important:** Check "Add Python to PATH" during installation
3. Restart Command Prompt
4. Verify: `python --version`

---

### Issue: "Node.js is not installed or not in PATH"

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart Command Prompt
3. Verify: `node --version`

---

### Issue: "MongoDB not found"

**Solution 1 (Docker - Recommended):**
1. Install Docker Desktop
2. Run `start-amep.bat` again
3. Choose option "Use Docker for MongoDB"

**Solution 2 (Manual):**
1. Install MongoDB Community Server
2. Add MongoDB to PATH
3. Start MongoDB service: `net start MongoDB`

---

### Issue: "Port 5000 is already in use"

**Solution:**
1. Find process using port: `netstat -ano | findstr :5000`
2. Kill process: `taskkill /F /PID [PID_NUMBER]`
3. Or run: `troubleshoot.bat` → Option 2 (Port conflicts)

---

### Issue: "Port 5173 is already in use"

**Solution:**
1. Find process using port: `netstat -ano | findstr :5173`
2. Kill process: `taskkill /F /PID [PID_NUMBER]`
3. Or change port in `frontend/.env`: `VITE_PORT=5174`

---

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Check MongoDB is running: `tasklist | findstr mongod`
2. Try: `net start MongoDB`
3. Or run: `troubleshoot.bat` → Option 3 (Database)

---

### Issue: "Dependencies won't install"

**Solution:**
1. Run: `troubleshoot.bat`
2. Choose option 4 (Missing dependencies)
3. Script will reinstall everything

---

### Issue: "Everything is broken"

**Nuclear option:**
1. Run: `troubleshoot.bat`
2. Choose option 5 (Reset everything)
3. This deletes all installed dependencies
4. Run `start-amep.bat` again for fresh install

---

## 📁 Project Structure

```
insight-platform/
│
├── start-amep.bat          ⭐ One-click startup
├── stop-amep.bat           🛑 Stop all services
├── check-status.bat        📊 Check status
├── troubleshoot.bat        🔧 Fix issues
│
├── backend/                 🐍 Python/Flask backend
│   ├── venv/               (created on first run)
│   ├── app.py              Main Flask app
│   ├── config.py           Configuration
│   ├── requirements.txt    Python dependencies
│   ├── .env                Config (created from .env.example)
│   ├── api/                API routes
│   ├── ai_engine/          ML models
│   └── models/             Database models
│
├── frontend/               ⚛️ React/Vite frontend
│   ├── node_modules/       (created on first run)
│   ├── src/                Source code
│   ├── package.json        Node dependencies
│   └── .env                Config (created from .env.example)
│
├── database/               🗄️ Database files
│   ├── mongodb_schema.md   Schema documentation
│   ├── mongo-init.js       Initialization script
│   └── seed_data.js        Sample data
│
└── docs/                   📚 Documentation
```

---

## 🔄 Daily Workflow

### Starting Your Day

```cmd
# Start everything
start-amep.bat

# Wait for browser to open
# Login with: teacher@amep.edu / demo123
```

### During Development

**Backend changes:**
- Backend auto-reloads (Flask debug mode)
- Just save your Python files

**Frontend changes:**
- Frontend auto-reloads (Vite HMR)
- Just save your React files

**Check if everything is running:**
```cmd
check-status.bat
```

### Ending Your Day

```cmd
# Stop everything
stop-amep.bat
```

---

## 🐳 Using Docker (Alternative)

If you prefer Docker for everything:

```cmd
# Start full stack with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker logs amep-backend
docker logs amep-frontend

# Stop everything
docker-compose down
```

---

## 💡 Tips & Tricks

### Speed up subsequent startups

After first run, the script is fast because:
- ✅ Virtual environment already exists
- ✅ Dependencies already installed
- ✅ Database already initialized
- ✅ Sample data already loaded

### Keep multiple terminal windows open

The script opens separate windows for:
- 🟢 Backend (green title bar)
- 🟡 Frontend (yellow title bar)
- 🔵 Launcher (blue title bar)

**Don't close these windows** while using AMEP!

### View real-time logs

Backend logs: `backend\logs\amep.log`

```cmd
# Watch logs in real-time (PowerShell)
Get-Content backend\logs\amep.log -Wait -Tail 20
```

### Run in background

To run without terminal windows:

```cmd
# Start MongoDB in background
start /B mongod --dbpath=%USERPROFILE%\mongodb\data

# Start backend in background
cd backend
start /B python app.py

# Start frontend in background
cd frontend
start /B npm run dev
```

---

## 🆘 Getting Help

1. **Run diagnostics:**
   ```cmd
   check-status.bat
   ```

2. **Interactive troubleshooting:**
   ```cmd
   troubleshoot.bat
   ```

3. **Check logs:**
   - Backend: `backend\logs\amep.log`
   - MongoDB: `troubleshoot.bat` → Option 6

4. **Reset everything:**
   ```cmd
   troubleshoot.bat
   # Choose option 5 (Clean install)
   ```

5. **Read documentation:**
   - [MONGODB_MIGRATION.md](MONGODB_MIGRATION.md) - Database setup
   - [database/mongodb_schema.md](database/mongodb_schema.md) - Schema reference
   - [README.md](README.md) - Project overview

---

## 📝 Notes

- **First run takes longer** (5-10 min) due to dependency installation
- **Keep terminal windows open** while using the app
- **Sample data includes** 5 students, 4 concepts, 2 templates, 1 project
- **Demo credentials** work immediately after startup
- **Auto-reload enabled** for both frontend and backend during development

---

## ✅ Checklist

Before reporting issues, verify:

- [ ] Python 3.11+ installed and in PATH
- [ ] Node.js 18+ installed and in PATH
- [ ] MongoDB installed or Docker running
- [ ] Ports 5000 and 5173 are available
- [ ] Ran `start-amep.bat` successfully
- [ ] Can access http://localhost:5173
- [ ] Can login with demo credentials

---

## 🎉 You're Ready!

Just run `start-amep.bat` and start using AMEP!

The script handles everything automatically. Sit back and wait for your browser to open. 🚀
