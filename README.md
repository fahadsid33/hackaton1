# ⚡ GeoFace Attendance: AI Camera & Geofencing System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-Streamlit-FF4B4B.svg)](https://streamlit.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-grade, full-stack attendance system combining **Biometric Face Verification**, **Liveness Blink Analysis**, and **Authoritative Server-Side GPS Geofencing**.

Includes:
- **`frontend/`**: Complete Web Application (React 18, Vite, Tailwind CSS, Face-API)
- **`backend/`**: Express API Engine with Haversine distance calculations and strict rule validation
- **`mobile/`**: React Native / Expo Mobile App with `expo-camera` and `expo-location`
- **`streamlit_app.py`**: Streamlit Cloud deployment app with Admin Login (`admi` / `1234`) and Approve/Reject workflow

---

## 📁 Clean Repository Structure

```
.
├── frontend/                   # Web Application (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # BoundingBoxOverlay, GpsStatusBadge, GeofenceSimulator, etc.
│   │   ├── pages/              # AttendanceCheckInPage, EmployeeEnrollPage, AdminSettingsPage, etc.
│   │   ├── services/           # api.js, faceDetection.js, geolocation.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Core API Engine (Node.js + Express + geolib)
│   ├── src/
│   │   ├── controllers/        # attendance, office, employee, correction controllers
│   │   ├── models/store.js     # In-memory + JSON persistence database store
│   │   ├── routes/             # REST routes (/api/attendance, /api/office, etc.)
│   │   ├── services/           # attendanceService.js
│   │   ├── utils/              # haversine.js, faceMatcher.js
│   │   ├── app.js
│   │   └── index.js
│   ├── tests/                  # Automated unit and integration tests (100% passing)
│   └── package.json
│
├── mobile/                     # Mobile App (React Native / Expo)
│   ├── src/
│   │   ├── screens/            # CameraAttendanceScreen, FaceEnrollScreen, HistoryScreen, etc.
│   │   └── services/           # api.js, location.js
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── streamlit_app.py            # Streamlit Cloud Deployment with Admin Login & Approvals
├── requirements.txt            # Streamlit Cloud Python dependencies
├── package.json                # Root orchestration workspace
└── .gitignore                  # Production gitignore
```

---

## 🎯 Verification Rules & Decisions

| Rule | Requirement | On Failure |
| :--- | :--- | :--- |
| **Face Detection** | Exactly **1 face** in camera frame | **REJECTED**: *"No face detected"* or *"Multiple faces detected"* |
| **Geofence Boundary** | Distance $\le$ Office Radius (e.g. 150m) via Haversine formula | **REJECTED**: *"Outside company perimeter"* |
| **GPS Accuracy** | Accuracy must be $\le 100\text{ m}$ | **REJECTED**: *"GPS accuracy too low (X m > 100m limit)"* |
| **Authoritative Time** | Timestamped strictly by server clock | Device clock is never trusted |
| **Data Privacy** | Stores verification metrics, distance & status | Raw photos are not retained on server |
| **HR Fallback** | Employees submit manual requests if GPS/camera fails | Admin reviews & approves in Admin Portal |

---

## 🔑 Admin Credentials (Streamlit App)
- **Username:** `admi` (or `admin`)
- **Password:** `1234`
- **Capabilities:** Review pending employee correction requests, **Approve** (auto-logs official attendance) or **Reject**, and customize office geofence coordinates and radius.

---

## 🚀 Quick Deployment Guide

### Option 1: Streamlit Community Cloud (One-Click)
1. Push this repository to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io/) and select your repository.
3. Set **Main file path** to: `streamlit_app.py`.
4. Click **Deploy**!

### Option 2: Full-Stack Web App (Vercel & Render)
- **Frontend (`frontend/`)**: Deploy on [Vercel](https://vercel.com) with Root Directory set to `frontend`.
- **Backend (`backend/`)**: Deploy on [Render](https://render.com) Web Service with Root Directory set to `backend`, Build Command: `npm install`, Start Command: `npm start`.

---

## 🧪 Local Running

```bash
# 1. Run Backend
npm run backend

# 2. Run Frontend
npm run frontend

# 3. Run Backend Tests
npm test

# 4. Run Streamlit App
streamlit run streamlit_app.py
```
