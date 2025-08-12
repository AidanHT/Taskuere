## Taskuere

AI-powered scheduling and real-time collaboration platform. Create and manage appointments with natural language, resolve conflicts automatically, collaborate in live workspaces (whiteboard, shared docs, video), and stay on top of your schedule with a modern dashboard and notifications.

### Highlights

- **AI Assistant**: Parse natural language requests, suggest optimal time slots, detect conflicts, and generate meeting agendas (Groq LLaMA3-based, with deterministic fallbacks).
- **Smart Scheduling Wizard**: End-to-end guided flow from text input to conflict resolution and confirmation.
- **Real-time Collaboration**: Shared whiteboard, TipTap doc editing via Yjs, WebRTC video calls, in-room chat, and presence.
- **Calendar & Dashboard**: FullCalendar UI with CRUD, analytics, weekly activity, and trends.
- **Notifications**: In-app and optional email notifications using per-user SMTP app passwords.
- **Secure & Performant**: JWT auth, rate limiting, Helmet, CORS; Socket.IO + Yjs websockets.

---

## Features

- **Natural-language scheduling**

  - Parse: “Schedule a 30-minute call with Sarah next Tuesday afternoon.”
  - Deterministic date normalization and validation using `chrono-node` and server-side checks.
  - Time slot suggestions honoring working hours, timezone, buffers, and patterns.
  - Conflict detection with deterministic overlap logic and AI-backed suggestions.
  - Agenda generation for meetings.

- **Smart Scheduling Wizard** (`frontend/src/components/SmartSchedulingWizard.js`)

  - Steps: Input → Suggestions → Conflict Resolution → Confirmation.
  - Integrates AI parsing, suggestions, conflict checks, and appointment creation.

- **Real-time collaboration workspace** (`/collaboration/:appointmentId`)

  - Whiteboard with live drawing broadcast via Socket.IO.
  - Shared document editing powered by Yjs and `y-websocket` (TipTap editor).
  - Video conferencing using WebRTC (`simple-peer`) with screen sharing.
  - In-room chat, participant panel, presence, and room size limits.

- **Calendar & Scheduling**

  - FullCalendar views (month/week/day) with create/edit/delete dialogs.
  - Appointment types, locations, descriptions, recurrence flags.

- **Dashboard**

  - Totals, upcoming, completed, team members, weekly activity, and trends via `/api/stats/dashboard`.

- **Notifications**

  - In-app feed with unread counts; mark one/all as read.
  - Optional email notifications using user-configured Gmail App Passwords (stored hashed).

- **Admin panel**

  - View users, set roles (`user`/`admin`), and delete users with safety checks.

- **Profile management**
  - Update username/email, notification prefs, change password, delete account.
  - Configure email settings and send test emails.

---

## Tech Stack

### Frontend

- React 18, React Router v6
- MUI (Material UI)
- React Query (TanStack Query)
- FullCalendar (core/daygrid/timegrid/interaction)
- TipTap editor
- Socket.IO client, `simple-peer` (WebRTC)
- date-fns, framer-motion, react-hot-toast

### Backend

- Node.js, Express
- MongoDB with Mongoose
- Auth: JWT
- Security: Helmet, express-rate-limit, CORS
- Realtime: Socket.IO, `ws`, `y-websocket` (Yjs)
- AI: `groq-sdk` (LLaMA3-70B), `chrono-node` (date parsing)
- Validation/Logging: express-validator, zod (internal), winston
- Email: nodemailer (per-user SMTP via stored app passwords)

---

## Architecture

- REST API under `/api/*`:
  - `auth`, `appointments`, `users`, `ai`, `collaboration`, `notifications`, `search`, `stats`
- WebSockets:
  - Socket.IO namespace: `/collab` (whiteboard, chat, WebRTC signaling, presence)
  - Yjs websocket endpoint: `ws://<host>:<port>/collab-sync` (shared doc sync)
- Data models: `User`, `Appointment`, `AISettings`, `MeetingPatterns`, `ConflictResolutions`, `CollaborationRoom`, `SharedDocument`, `WhiteboardSnapshot`, `CollaborationMessage`, `Notification`

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn)
- MongoDB (local or Atlas URI)

### 1) Clone & install

```bash
git clone <repo-url>
cd Taskuere

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2) Configure environment

Backend (`backend/.env`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskuere
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:3000
GROQ_API_KEY= # optional, enables AI features
COLLAB_ROOM_LIMIT=12 # optional
```

Frontend (`frontend/.env`):

```env
REACT_APP_API_URL=http://localhost:5000
```

Notes:

- AI features gracefully degrade if `GROQ_API_KEY` is not set (fallback parser still works).
- Email notifications use per-user Gmail App Password configured in Profile; no global SMTP env is required.

### 3) Run

In two terminals:

```bash
# Terminal A (backend)
cd backend
npm run dev

# Terminal B (frontend)
cd frontend
npm start
```

Smoke test:

```bash
curl http://localhost:5000/api/test
# -> { "message": "Backend is working!", ... }
```

---

## Usage Overview

1. Register or log in. JWT is stored in `localStorage` and used for all API calls.

2. Optional: In Profile → Email Settings, add your Gmail App Password. You can send a test email via the profile UI; backend endpoint `/api/test-email` is also available for debugging.

3. Calendar: Create, edit, and delete appointments. Click events to edit; drag-select to create.

4. AI Assistant: Describe what to schedule. The wizard guides you through suggestions → conflict checks → confirmation.

5. Collaboration: From Dashboard/Calendar, open a meeting’s workspace to access whiteboard, shared docs, video, chat, and presence.

6. Admin Panel: Manage users and roles (admin only).

---

## API Summary (selected)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users/me` (auth) – current profile
- `PUT /api/users/me` (auth) – update profile and notification settings
- `PUT /api/users/me/password` (auth)
- `DELETE /api/users/me` (auth)
- `GET /api/users` (admin)
- `PATCH /api/users/:id/role` (admin)
- `DELETE /api/users/:id` (admin)

### Appointments

- `GET /api/appointments` (auth)
- `POST /api/appointments` (auth)
- `GET /api/appointments/:id` (auth)
- `PUT /api/appointments/:id` (auth)
- `PATCH /api/appointments/:id/status` (auth)
- `PATCH /api/appointments/:id/response` (auth)
- `DELETE /api/appointments/:id` (auth)

### AI

- `POST /api/ai/parse-natural-language` (auth)
- `POST /api/ai/suggest-times` (auth)
- `POST /api/ai/detect-conflicts` (auth)
- `POST /api/ai/generate-agenda` (auth)
- `GET /api/ai/settings` | `PUT /api/ai/settings` (auth)
- `GET /api/ai/conflicts` | `POST /api/ai/resolve-conflict/:id` (auth)

### Collaboration

- `POST /api/collaboration/rooms` (auth) – ensure/get room
- `GET /api/collaboration/rooms/:appointmentId` (auth)
- `POST /api/collaboration/documents` (auth)
- `GET /api/collaboration/documents/:appointmentId` (auth)
- `POST /api/collaboration/whiteboard` (auth)
- `GET /api/collaboration/whiteboard/:appointmentId` (auth)
- `GET /api/collaboration/chat/:appointmentId` (auth)

### Notifications

- `GET /api/notifications` (auth)
- `GET /api/notifications/count` (auth)
- `POST /api/notifications/:id/read` (auth)
- `POST /api/notifications/read-all` (auth)

### Other

- `GET /api/search?q=...` (auth)
- `GET /api/stats/dashboard` (auth)
- `GET /api/test` – health check

WebSockets:

- Socket.IO namespace: `/collab` (JWT via `io(..., { auth: { token } })`)
- Yjs WS: `ws://localhost:5000/collab-sync`

---

## Production Notes

- Set `CLIENT_ORIGIN` to your frontend origin.
- Ensure websocket upgrades for both Socket.IO and `/collab-sync` through your reverse proxy.
- Build frontend with `npm run build` and serve behind your chosen web server.
- Securely provide `JWT_SECRET`, `MONGODB_URI`, and optional `GROQ_API_KEY`.

---

## Scripts

Backend (`backend/package.json`):

- `npm run dev` – start with nodemon
- `npm start` – start server
- `npm test` – run backend tests (if present)

Frontend (`frontend/package.json`):

- `npm start` – start React dev server
- `npm run build` – production build
- `npm test` – React tests

---

## Contributing

Pull requests and issues are welcome. For larger changes, please open an issue first to discuss what you’d like to change.

1. Fork and create a feature branch
2. Write clean, tested code
3. Open a PR with a clear description

---

## License

MIT. See `LICENSE`.
