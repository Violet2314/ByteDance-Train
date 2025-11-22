# Logistics Platform Frontend

## Project Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root of `frontend` if needed, but defaults are set in code.
    You need to replace `YOUR_AMAP_KEY` in `src/components/business/TrackingMap.tsx` with a valid Amap Key.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Features

-   **Merchant Dashboard**: View and manage orders.
-   **Order Detail**: Ship orders and view details.
-   **Tracking Search**: Public page to search orders.
-   **Tracking Detail**: Real-time map tracking with WebSocket updates.

## Tech Stack

-   React + TypeScript + Vite
-   Redux Toolkit + RTK Query
-   Ant Design + Tailwind CSS
-   Framer Motion (Animations)
-   Socket.IO Client
-   AMap (Gaode Map)

## Backend Integration

Ensure the backend is running on `http://localhost:3001`.
The frontend proxies API requests to the backend or connects directly.
Current configuration assumes backend at `http://localhost:3001`.
