✅ PHASE 1 — Project Setup
1️⃣ Initialize Repositories

 Create GitHub repo

 Create two folders:

/frontend

/backend

 Initialize both with npm init

2️⃣ Backend Setup

 Install dependencies:

express

socket.io

cors

dotenv

uuid

prisma

@prisma/client

 Initialize Prisma

 Connect to PostgreSQL

 Create .env file

3️⃣ Frontend Setup

 Create app using Next.js

 Install:

axios

socket.io-client

 Configure environment variable:

NEXT_PUBLIC_API_URL

✅ PHASE 2 — Database Design
4️⃣ Create Prisma Schema

 Poll model

 Option model

 Vote model

 Add:

UNIQUE(pollId, ipAddress)

UNIQUE(pollId, voterHash)

 Run migration

 Seed test poll (optional)

✅ PHASE 3 — Backend Core APIs
5️⃣ Create Poll

 POST /api/polls

 Validate:

Question not empty

Minimum 2 options

 Generate UUID

 Save poll + options

 Return shareable URL

6️⃣ Get Poll

 GET /api/polls/:id

 Return poll + options

 Handle 404

7️⃣ Get Results

 GET /api/polls/:id/results

 Aggregate vote counts

 Return structured JSON

8️⃣ Vote Endpoint

 POST /api/polls/:id/vote

 Extract:

IP address

voterHash (from body)

 Validate:

Poll exists

Option belongs to poll

 Check duplicate vote

 Insert vote

 Return updated results

✅ PHASE 4 — Real-Time System
9️⃣ Setup Socket.IO Server

 Attach to HTTP server

 Enable CORS

 Handle:

join_poll

disconnect

🔟 Emit Updates

 After successful vote:

Aggregate results

io.to(pollId).emit("results_update", results)

✅ PHASE 5 — Frontend Features
1️⃣1️⃣ Poll Creation Page

 Form:

Question input

Dynamic options list

 Submit to backend

 Redirect to share link

1️⃣2️⃣ Poll View Page

 Fetch poll data

 Display options

 Single choice selection

 Disable vote button after submission

 Show error if already voted

1️⃣3️⃣ Real-Time Integration

 Connect to socket on page load

 Emit join_poll

 Listen for:

results_update

 Update UI instantly

1️⃣4️⃣ Browser Fingerprint

 Generate hash from:

userAgent

screen size

timezone

 SHA256 it

 Send with vote request

✅ PHASE 6 — Fairness Controls
1️⃣5️⃣ IP-based Protection

 Extract IP from request headers

 Store in Vote table

 Enforce UNIQUE constraint

1️⃣6️⃣ Fingerprint Protection

 Store voterHash

 Enforce UNIQUE constraint

1️⃣7️⃣ Optional (Bonus)

 Rate limit votes (express-rate-limit)

 Disable rapid multi-click voting

✅ PHASE 7 — Edge Case Handling

 Handle poll not found

 Handle duplicate vote attempt (return 409)

 Handle invalid option ID

 Handle empty question submission

 Handle server restart persistence

 Handle socket reconnect

✅ PHASE 8 — Deployment
Backend (Render)

 Create Web Service

 Add DATABASE_URL

 Deploy

 Confirm WebSocket works

Database

 Create managed PostgreSQL

 Run migrations

Frontend (Vercel)

 Add NEXT_PUBLIC_API_URL

 Deploy

 Test shareable link

✅ PHASE 9 — Final Testing Checklist

 Create poll

 Open link in 2 browsers

 Vote in browser A

 Verify browser B updates instantly

 Refresh page → data persists

 Try duplicate voting

 Try incognito

 Test mobile

✅ PHASE 10 — README (Submission Requirement)

Include:

 Architecture diagram

 Explanation of real-time approach

 Fairness mechanism 1 (IP)

 Fairness mechanism 2 (Fingerprint)

 Known limitations

 Deployment URLs