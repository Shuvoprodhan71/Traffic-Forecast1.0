# Traffic Forecast Web App — TODO

- [x] Export ML model data (predictions, metrics, hourly profile, scaler) to JSON files
- [x] Upload static JSON data assets to CDN
- [x] Build backend tRPC router: predict endpoint (hour + day_of_week)
- [x] Build backend tRPC router: hourlyProfile endpoint
- [x] Build backend tRPC router: testSeries endpoint (actual vs predicted, 200 steps)
- [x] Build backend tRPC router: modelMetrics endpoint
- [x] Set up dark theme in index.css and App.tsx
- [x] Build Dashboard page with gradient header
- [x] Build KPI metrics cards (dataset stats + model MAE/RMSE)
- [x] Build live prediction form with hour/day selectors and color-coded result badge
- [x] Build hourly speed profile Chart.js line chart
- [x] Build actual vs predicted time-series Chart.js dual-line chart
- [x] Build model performance comparison MAE/RMSE bar charts
- [x] Write vitest tests for all tRPC procedures (7/7 passing)
- [x] Final checkpoint and publish

## Bug Fixes
- [x] Diagnose why results/charts are not displaying correctly on live site
- [x] Fix all identified rendering/data issues
- [x] Verify all charts and prediction form work correctly

## UI & Production Fixes
- [x] Remove all "Master's Thesis Project" / thesis references from the UI
- [x] Fix live prediction to work in production (replace Python subprocess with Node.js)

## Railway Deployment Fix
- [x] Fix Railway build failure (pnpm install error, exit code 254)
- [x] Add railway.json with correct build and start commands
- [x] Update Dockerfile for Railway compatibility

## Railway Runtime Crash Fix
- [x] Fix vite ERR_MODULE_NOT_FOUND crash in production (vite imported at runtime in dist/index.js)
- [x] Update Dockerfile to install all dependencies (not just prod) so vite is available at runtime
