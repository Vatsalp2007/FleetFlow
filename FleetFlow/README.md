# 🚚 FleetFlow Logistics Management System

FleetFlow is a full-stack, real-time Fleet Management and Logistics Dashboard built to manage vehicles, drivers, trips, maintenance, fuel expenses, and operational analytics in a structured and scalable way.

Developed as part of Hackathon 2026 🚀

---

## 🔐 Role-Based Access Control (RBAC)

FleetFlow supports two secure user roles:

### 👑 Manager
- Full system access
- Add / Edit / Delete Vehicles
- Create Dispatchers
- Access Reports & Analytics
- Manage Settings
- Financial Monitoring (ROI, Revenue, Costs)

### 🚛 Dispatcher
- Create & Manage Trips
- Assign Vehicles & Drivers
- Update Trip Status
- Limited access (No Settings / Reports)

Authentication powered by Firebase Auth.

---

## 🚗 Core Modules

### 1️⃣ Dashboard (Command Center)
- Active Fleet Overview
- Pending Cargo
- Completed Trips
- Maintenance Alerts
- Revenue & Cost Summary
- Live Fleet Map (Google Maps Integration)
- Real-time Firestore updates

---

### 2️⃣ Vehicle Management
- Add / Manage Vehicles
- Capacity Tracking
- Region Assignment
- Status Control (Available / In Shop)

---

### 3️⃣ Driver Management
- Driver Profiles
- License Expiry Tracking
- Category-Based Assignment
- Status: On Duty / Off Duty / Suspended

---

### 4️⃣ Trip Dispatcher
- Create Trips
- Vehicle & Driver Selection
- Validation (No Overload Rule)
- Trip Lifecycle:
  Draft → Dispatched → Completed → Cancelled
- Freight Revenue Tracking

---

### 5️⃣ Maintenance & Service Logs
- Preventive Maintenance
- Auto Vehicle Status Update (In Shop)
- Service Cost Tracking

---

### 6️⃣ Fuel & Expense Logging
- Fuel Entry (Liters & Cost)
- Maintenance Cost Tracking
- Automatic Operational Cost Calculation

---

### 7️⃣ Analytics & Reports
- Revenue Tracking
- Vehicle ROI Calculation:
  
  ROI = (Revenue - (Fuel + Maintenance)) / Acquisition Cost

- Performance Charts
- Operational Metrics
- Export Ready Data Structure

---

## 🗺️ Live Fleet Map

- Google Maps Integration
- Rajkot-based dynamic vehicle positioning
- Status-based marker colors
- Fullscreen Support
- Real-time vehicle visualization

---

## 💰 Financial Intelligence

FleetFlow automatically calculates:

- Total Revenue (Completed Trips)
- Total Operational Cost
- Fuel Expenses
- Maintenance Costs
- Vehicle ROI
- Fleet Efficiency Metrics

---

## 🛠️ Tech Stack

Frontend:
- React (Vite)
- Tailwind CSS
- Recharts (Analytics)
- @react-google-maps/api

Backend / Database:
- Firebase Firestore
- Firebase Authentication

Deployment:
- GitHub
- Firebase Hosting / Vercel

---

## ⚙️ System Architecture

- Real-time Firestore listeners (onSnapshot)
- Role-based protected routes
- Secure access validation
- Modular component-based structure
- Scalable SaaS-ready layout

---

## 🔒 Security

- Firebase Authentication
- Role validation after login
- Protected routes
- Restricted UI rendering
- Firestore rule-based access

---

## 🚀 Future Enhancements

- Live GPS Tracking
- Route Optimization
- Multi-Branch Support
- Advanced Revenue Models
- Driver Scoring AI
- Fleet Performance AI Predictions

---

## 👨‍💻 Developer

Developed by:
Vatsal Panchasara

Hackathon Project – 2026

---

## 📌 Project Status

✔ Fully Functional  
✔ Real-Time Updates  
✔ Enterprise-Ready UI  
✔ Role-Based Access Control  
✔ Financial & Operational Tracking  

---

# ⭐ FleetFlow – Smart Logistics. Smarter Decisions.
