# Touch-Live Frontend

Touch-Live is a modern, high-performance live-streaming web application built with React 18, Vite, Redux Toolkit, Ant Design, Firebase Auth, and WebRTC.

## 🚀 Key Features

- **Sub-Second WebRTC Live Streaming**: Low-latency P2P video/audio streaming with dynamic TURN/STUN credential fetching.
- **Pre-Stream Device Setup**: Camera and microphone selection & live preview modal before going live.
- **Interactive Live Chat**: Real-time Socket.io chat rooms with host tags, viewer counters, and timestamped messages.
- **Responsive Dark Design**: Unified Ant Design theme with glassmorphism, neon accents, and mobile navigation drawer.
- **Cloud Video & Stream Management**: User dashboard for bio management, video uploads, past stream archives, and Cloudinary media deletion.
- **Firebase Authentication**: Support for Email/Password, Google OAuth, and Guest logins with Bearer ID Token API protection.

---

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🧭 Application Routes

- `/` — Landing Page with Hero Banner, Live Mockup, and Features Showcase.
- `/login` — Login Page (Email, Google, Guest, Password Reset).
- `/signup` — Registration Page with Inline Validation and Password Strength Meter.
- `/livestreamingplatform` — Browse Live Channels & Uploaded Videos Grid.
- `/livestreamingplatform/stream/:id` — Streamer Studio (Device Setup, Screen Share, Controls, Live Chat).
- `/livestreamingplatform/watch/:id` — Viewer Watch Room (Theater Mode, Real-Time Video, Chat).
- `/livestreamingplatform/profile` — Streamer Dashboard (Bio Editor, Storage Meter, Video Management Grid, Past Streams).

---

## 📦 Project Architecture

```
src/
├── api/                   # Centralized Axios service layer with Firebase token interceptor
│   ├── client.js
│   ├── videos.js
│   ├── profile.js
│   ├── streams.js
│   ├── turn.js
│   └── users.js
├── utils/                 # ICE server helper utilities
│   └── iceServers.js
├── theme/                 # Ant Design dark theme configuration
│   └── themeConfig.js
└── Components/
    ├── Firebase/          # Firebase Auth configuration
    ├── LandingPage/       # Landing Page & AppHeader
    ├── Login/             # Login & Signup pages
    ├── Pages/             # Browse, StartStreaming, WatchStream, Profile, Main layout
    └── Redux/             # Redux Store, userSlice, streamSlice
```