# 🗳️ Real-Time Polling Application

A premium, production-ready polling platform allowing users to create, share, and vote on polls in real-time. Built with **Next.js 15**, **Express**, **Socket.IO**, and **PostgreSQL**, designed with a focus on **stability**, **data integrity**, and **handling edge cases**.

---

## 🚀 Key Features

*   **⚡ Real-Time Synchronization**: Instant vote updates across all connected clients using optimized Socket.IO events.
*   **🎨 Premium UI/UX**: "Glassmorphism" design, smooth Framer Motion animations, and dynamic color themes based on poll ID.
*   **🛡️ Robust Fairness System**: Multi-layered duplicate vote prevention using IP tracking and browser fingerprinting.
*   **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop experiences.
*   **🔍 Dashboard**: User dashboard to track active and past polls.

---

## 🏗️ Architecture & Tech Stack

The application follows a decoupled client-server architecture to ensure scalability and separation of concerns.

### **Frontend (Client)**
*   **Framework**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS v4, Framer Motion
*   **State/Network**: Axios, Socket.IO Client
*   **Identification**: FingerprintJS (with fallbacks)

### **Backend (Server)**
*   **Runtime**: Node.js, Express
*   **Real-time**: Socket.IO Server
*   **Database**: PostgreSQL (via Aiven), Prisma ORM
*   **Security**: Rate Limiting, CORS, Helmet (implied), Input Validation

### **Infrastructure**
*   **Database**: PostgreSQL (Cloud-hosted)
*   **Deployment**: Vercel (Frontend), Railway/Render (Backend target)

```mermaid
graph TD
    Client[User Client]
    LB[Load Balancer / Rate Limiter]
    Server[Express API + Socket.IO]
    DB[(PostgreSQL)]
    
    Client -->|HTTP /api| LB
    Client <-->|WebSocket| LB
    LB --> Server
    Server -->|Queries/Transactions| DB
    
    subgraph "Stability Layer"
        LB
        Server
    end
```

---

## 🛡️ Stability & Edge Case Handling

This project is engineered to handle real-world scenarios, network instability, and potential abuse.

### **1. Backend Stability**
*   **Atomic Transactions**: Poll creation uses **SQL transactions** (`BEGIN`, `COMMIT`, `ROLLBACK`) to ensure that `polls` and `options` tables are always in sync. If any part of the creation fails, the entire operation is rolled back to prevent orphaned data.
*   **Graceful Database Failures**: The connection pool is configured to **fail-fast** on idle client errors, allowing the process manager (like PM2 or Docker/K8s) to restart the service immediately rather than hanging in an undefined state.
*   **Rate Limiting**: To prevent abuse and DDoS attacks, critical endpoints (like voting) are protected by `express-rate-limit` (e.g., max 20 votes/minute per IP).
*   **Strict Input Validation**: Every API endpoint validates incoming data types, lengths, and logical constraints (e.g., minimum 2 options) before processing, preventing unnecessary database load or potential crashes.

### **2. Frontend Resilience**
*   **Robust Fingerprinting Strategy**:
    1.  Tries **FingerprintJS** for high-accuracy device identification.
    2.  **Fallback Mechanism**: If the fingerprinting library is blocked (e.g., by privacy extensions), it gracefully falls back to a generated local UUID or cryptographically distinct random value, ensuring the user can still vote.
    3.  **Visual Feedback**: The interface disables interaction until fairness checks are ready, preventing race conditions.
*   **Socket Connection Management**:
    *   **Auto-reconnection**: Socket.IO client automatically attempts to reconnect with exponential backoff if the server goes down.
    *   **Room Management**: Disconnecting users are strictly cleaned up from rooms to prevent memory leaks on the server.
*   **Error Boundaries & User Feedback**:
    *   API failures (404, 500) trigger user-friendly error messages (Toasts) rather than crashing the UI.
    *   Duplicate vote attempts (403) are caught and clearly communicated to the user.
    *   **Accessible Feedback System**: Replaces native browser blocking alerts with non-intrusive, fully accessible **Toast Notifications** and **Modal Dialogs**. These components support keyboard navigation (Escape to close, Focus trapping), screen readers (ARIA roles), and do not freeze the main thread, ensuring a smooth experience even during error states.

### **3. Data Integrity & Fairness**
*   **Double-Check Locking**:
    *   **Layer 1 (Frontend)**: Checks `localStorage` and `hasVoted` state to prevent UI double-submission.
    *   **Layer 2 (Database)**: Uses **Unique Constraints** on composite keys (`poll_id` + `voter_hash`) to fundamentally prevent duplicate records at the database level.
    *   **Layer 3 (IP Hashing)**: IP addresses are salted and hashed (HMAC-SHA256) before storage to balance **privacy** (no raw IPs) with **security** (detecting IP-based vote spam).

---

## 🏁 Getting Started

### Prerequisites
*   Node.js v18+
*   PostgreSQL Database (Local or Cloud)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables (`.env`):
    ```env
    PORT=3001
    DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
    CORS_ORIGIN="http://localhost:3000"
    IP_HASH_SECRET="super-secret-key-for-hashing-ips"
    ```
4.  Run Migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Start Development Server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables (`.env.local`):
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:3001"
    ```
4.  Start Development Server:
    ```bash
    npm run dev
    ```

Visit `http://localhost:3000` to start creating polls!

---
*Built with ❤️ for stability and speed.*
