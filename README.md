# FindIt Campus

A full-stack MERN application for reporting, browsing, and reclaiming lost or found items on campus — with real-time chat, automatic item matching, and JWT-based authentication.

**Live App:** https://findit-campus-azure.vercel.app
**Backend API:** https://findit-campus-ucfv.onrender.com

> Note: the backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after a period of inactivity may take 30–50 seconds to respond while the server wakes up.

---

## The Problem

Most campuses handle lost & found informally — scattered WhatsApp groups, physical notice boards, or word of mouth. Items get missed, posts get buried, and there's no reliable way to know if someone has already found what you lost.

**FindIt Campus** centralizes this into a single searchable platform where students can post lost/found items, get automatically notified of possible matches, and coordinate returns through built-in chat — all without exchanging personal contact details until they choose to.

---

## Features

- **Post lost or found items** — title, description, category, location, date, and an optional photo
- **Browse & search** — filter by lost/found, keyword search across title and description
- **JWT authentication** — signup/login, protected routes for posting and messaging
- **Ownership-secured actions** — only the original poster can edit, resolve, or remove their own post
- **Automatic item matching** — when you post a lost item, the app surfaces found items (posted by others) with overlapping keywords, and vice versa
- **One-click match confirmation** — confirming a match opens a shared chat between both people, linked to both posts
- **Real-time chat (Socket.io)** — instant messaging between the finder and the owner, including image sharing
- **Read/unread tracking** — unread message badge in the navbar, updates live
- **Resolved items stay visible** — once returned, a post is locked (can't be edited/deleted) and remains as a public record, building trust in the platform
- **Contact reveal** — contact info is hidden by default and only shown on request, requiring login first

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router — client-side routing
- Tailwind CSS — styling
- Axios — API requests
- Socket.io Client — real-time messaging

**Backend**
- Node.js + Express
- MongoDB + Mongoose — database and schema modeling
- Socket.io — real-time messaging server
- JWT (jsonwebtoken) — authentication
- bcryptjs — password hashing

**Infrastructure**
- MongoDB Atlas — database hosting
- Render — backend hosting
- Vercel — frontend hosting

---

## Architecture

```
┌─────────────┐         HTTPS / REST          ┌──────────────┐
│   React     │ ─────────────────────────────▶│   Express    │
│  (Vercel)   │◀───────────────────────────── │   (Render)   │
│             │                                │              │
│             │      WebSocket (Socket.io)     │              │
│             │◀──────────────────────────────▶│              │
└─────────────┘                                └──────┬───────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │   MongoDB    │
                                                │   (Atlas)    │
                                                └──────────────┘
```

- The frontend communicates with the backend over standard REST (`axios`) for CRUD operations, and over a persistent WebSocket connection (`Socket.io`) for real-time chat.
- The backend authenticates both HTTP requests (via middleware) and socket connections (via a handshake token check) using the same JWT.

---

## Database Schema (simplified)

**User**
| Field | Type |
|---|---|
| name | String |
| email | String (unique) |
| password | String (hashed) |

**Item**
| Field | Type |
|---|---|
| title, description, location | String |
| type | "lost" \| "found" |
| date | Date |
| imageUrl | String |
| contactInfo | String |
| resolved | Boolean |
| archived | Boolean |
| postedBy | ref → User |
| matchedWith | ref → Item |

**Conversation**
| Field | Type |
|---|---|
| participants | [ref → User] |
| item, relatedItem | ref → Item |
| reads | [{ user, lastReadAt }] |

**Message**
| Field | Type |
|---|---|
| conversation | ref → Conversation |
| sender | ref → User |
| text, imageUrl | String |

---

## Running Locally

### Prerequisites
- Node.js (v18+)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone the repo
```bash
git clone https://github.com/mr-vishalkpal/findit-campus.git
cd findit-campus
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example`):
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_string
PORT=5000
```

Run the backend:
```bash
npm run dev
```

### 3. Frontend setup
Open a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (see `.env.example`):
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Run the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
findit-campus/
├── backend/
│   ├── models/          # Mongoose schemas (User, Item, Conversation, Message)
│   ├── routes/          # Express route handlers
│   ├── middleware/      # JWT auth middleware
│   ├── socket.js         # Socket.io real-time chat logic
│   └── server.js         # App entry point
└── frontend/
    └── src/
        ├── api/          # Axios instance + Socket.io client setup
        ├── components/   # Reusable UI components (Navbar, ProtectedRoute)
        ├── context/      # AuthContext (global login state)
        └── pages/        # Route-level pages (Home, ItemDetail, Chat, etc.)
```

---

## Future Improvements

- Push notifications (browser/mobile) instead of in-app polling for unread messages
- Cloud image storage (e.g. Cloudinary) instead of base64-encoded images in MongoDB, for better scalability
- Admin moderation panel for reported/inappropriate posts
- Email notifications when a possible match is found

---

## Author

Built by [Vishal Pal](https://github.com/mr-vishalkpal) as a final-year college mini-project.
