# DataClock

DataClock is an ML-based personal data retention management prototype that predicts whether a personal-data record should be retained, reviewed, or expired. The framework combines personal-data classification, purpose mapping, machine-learning classification, retention-risk analysis, expiry monitoring, and an administrative privacy dashboard. The prototype uses synthetic data to demonstrate purpose-aware data lifecycle management without exposing real personal information.

## Project structure

- frontend/ - React + Vite + Tailwind dashboard
- backend/ - Express.js API and MongoDB integration
- ml-service/ - FastAPI + scikit-learn model service

## Features

- Real frontend, backend, and ML service working together
- MongoDB-backed record storage and audit logs
- Synthetic data generation and seeding for demo use
- Real machine learning workflow with Logistic Regression, Decision Tree, and Random Forest
- Best model selected using weighted F1-score
- Dashboard, analytics, expiry monitor, records management, and event demo page
- Demo login for college demonstration

## Demo login

- Email: admin@dataclock.demo
- Password: dataclock123

## Quick start

### 1. Install Node.js

- Download Node.js from https://nodejs.org/
- Verify with:
  npm --version
  node --version

### 2. Install Python

- Download Python 3.12+ from https://www.python.org/downloads/
- Verify with:
  python --version

### 3. Create MongoDB database

- Install MongoDB Community Edition or use a local MongoDB service
- Default connection used by the app:
  mongodb://localhost:27017/dataclock
- Create a database named dataclock

### 4. Configure environment variables

Backend:

- Copy backend/.env.example to backend/.env
- Example:
  MONGO_URI=mongodb://localhost:27017/dataclock
  PORT=5000
  ML_SERVICE_URL=http://localhost:8000

Frontend:

- Copy frontend/.env.example to frontend/.env
- Example:
  VITE_API_URL=http://localhost:5000/api

ML service:

- Copy ml-service/.env.example to ml-service/.env
- Example:
  MODEL_PATH=models/best_model.joblib

### 5. Seed the database

From the backend directory:

npm install
npm run dev

Then load demo data from the frontend Settings page or call:

POST /api/seed

### 6. Train the ML model

From the ml-service directory:

python -m pip install -r requirements.txt
python train_model.py

This generates the synthetic dataset, trains the three models, compares the scores, and saves the best pipeline to the ml-service/models folder.

### 7. Start the ML service

From the ml-service directory:

uvicorn app:app --reload --port 8000

### 8. Start the backend

From the backend directory:

npm install
npm run dev

### 9. Start the frontend

From the frontend directory:

npm install
npm run dev

Then open:

http://localhost:5173/login

## Demo workflow

1. Open the app at http://localhost:5173/login
2. Use demo login
3. View dashboard metrics
4. Load demo data
5. Add a data record
6. Submit and observe live ML prediction
7. Run expiry scan
8. Review audit logs and analytics
9. Open college event demo page

## Sample API endpoints

- GET /api/health
- GET /api/dashboard/stats
- GET /api/records
- POST /api/records
- DELETE /api/records/:id
- POST /api/records/:id/anonymise
- POST /api/expiry/scan
- GET /api/audit-logs
- GET /api/analytics
- GET /api/ml/evaluation
- POST /api/ml/predict
- POST /api/ml/retrain
- POST /api/seed

## Notes

- This is a privacy-oriented academic prototype using synthetic records only.
- No real personal information is stored or displayed.
- The application intentionally demonstrates purpose-aware retention decisions and ML-based review workflows.
