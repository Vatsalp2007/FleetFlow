# FleetFlow - Intelligent Fleet Management System

FleetFlow is a modern, responsive web application designed for real-time fleet operations, trip dispatching, and executive analytics.

## Features

- **Command Center**: Real-time dashboard with KPIs and operational health.
- **Fleet Live Map**: Google Maps integration with status-based marker tracking.
- **Trip Dispatcher**: Intelligent trip planning with auto-calculated freight charges.
- **RBAC System**: Role-Based Access Control (Manager vs. Dispatcher).
- **Maintenance & Expense Logs**: Complete tracking of vehicle health and operational costs.
- **Executive Analytics**: Detailed financial and operational insights with Recharts.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend/DB**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Maps**: Google Maps JS API

## Getting Started

### Prerequisites

- Node.js installed
- Git installed (for version control)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Vatsal2007/FleetFlow.git
   cd FleetFlow
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the root directory.
   - Use `src/.env.example` as a template.
   - Add your Firebase and Google Maps API keys.

4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable                    | Description                  |
| --------------------------- | ---------------------------- |
| `VITE_GOOGLE_MAPS_API_KEY`  | Google Maps Platform API Key |
| `VITE_FIREBASE_API_KEY`     | Firebase Web API Key         |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain         |
| `VITE_FIREBASE_PROJECT_ID`  | Project ID                   |
| ...                         | Other Firebase config values |

## License

MIT
