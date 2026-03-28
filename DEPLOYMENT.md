# Traffic Forecasting System — Deployment Guide

This guide explains how to run the Traffic Forecasting System independently on your own server or hosting platform.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22+ | Required |
| pnpm | 10+ | `npm install -g pnpm` |
| Python | 3.11+ | Required for prediction API |
| MySQL | 8.0+ | Required for user auth (optional) |

---

## Option 1: Run Locally (Quickest)

```bash
# 1. Extract the ZIP and enter the web_app folder
unzip traffic_forecasting_project.zip
cd traffic_project_package/web_app

# 2. Install Node.js dependencies
pnpm install

# 3. Create your .env file (see ENV_SETUP.md)
cp ENV_SETUP.md .env   # then edit .env with your values

# 4. Build the app
pnpm build

# 5. Start the production server
pnpm start
```

Open http://localhost:3000 in your browser.

---

## Option 2: Docker (Recommended for Servers)

```bash
# 1. Build the Docker image
docker build -t traffic-forecast .

# 2. Run the container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://root:password@host:3306/traffic_forecast" \
  -e JWT_SECRET="your-random-secret-here" \
  -e NODE_ENV="production" \
  --name traffic-forecast \
  traffic-forecast
```

Open http://localhost:3000 in your browser.

---

## Option 3: Deploy to Railway (Free Tier)

1. Push the `web_app` folder to a GitHub repository.
2. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
3. Add a MySQL plugin from the Railway dashboard.
4. Set these environment variables in Railway's Settings → Variables:
   - `DATABASE_URL` — Railway provides this automatically when you add MySQL
   - `JWT_SECRET` — any random string (e.g., `openssl rand -hex 32`)
   - `NODE_ENV` — `production`
5. Railway will auto-detect Node.js and deploy automatically.

---

## Option 4: Deploy to Render (Free Tier)

1. Push the `web_app` folder to a GitHub repository.
2. Go to [render.com](https://render.com) and create a new **Web Service**.
3. Set the build command to: `pnpm install && pnpm build`
4. Set the start command to: `pnpm start`
5. Add environment variables in Render's dashboard (same as above).

---

## Important Notes

### Python Dependency
The prediction API spawns a Python 3.11 subprocess (`server/predict.py`).
Make sure Python 3.11+ is installed on your server:
```bash
python3 --version   # should be 3.11 or higher
```
On Ubuntu/Debian: `sudo apt install python3.11`
On Railway/Render: Add a `nixpacks.toml` file:
```toml
[phases.setup]
nixPkgs = ["python311"]
```

### Database (Optional)
The database is only used for user authentication. All traffic charts and predictions work without it. If you skip the database, remove the `DATABASE_URL` variable and the app will still run — users just cannot log in.

### Port Configuration
The server reads the `PORT` environment variable. Most cloud platforms set this automatically. Do not hardcode a port number.

---

## Project Structure

```
web_app/
├── client/              ← React 19 frontend (TypeScript + Tailwind CSS)
│   └── src/
│       ├── pages/
│       │   └── Dashboard.tsx   ← Main dashboard with all charts
│       └── App.tsx
├── server/              ← Express + tRPC backend
│   ├── routers.ts       ← All API endpoints
│   ├── predict.py       ← Python prediction script
│   └── data/            ← Pre-computed JSON data files
│       ├── hourly_profile.json
│       ├── test_series.json
│       ├── metrics.json
│       └── scaler.json
├── drizzle/             ← Database schema and migrations
├── Dockerfile           ← Docker build configuration
├── package.json
└── DEPLOYMENT.md        ← This file
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Python exited 1: SRE module mismatch` | Wrong Python version. Ensure Python 3.11+ is used. |
| `ENOENT: no such file or directory, data/metrics.json` | Run `pnpm build` first — it copies data files to `dist/`. |
| Charts show "Loading..." forever | Check browser console for API errors. Verify server is running. |
| Port already in use | Set `PORT=3001` (or any free port) in your `.env`. |
| Database connection failed | The app still works without DB — only login is affected. |
