# Realtime Doc Editor (Monorepo)

A minimal full-stack realtime collaborative document editor sample (similar to a basic Google Docs).

Folders:
- `server/` — Express + Socket.IO + SQLite backend (port 5000)
- `client/` — React frontend (port 3000)

Quick start:

1. Server
```
cd server
npm install
npm start
```

2. Client (in a new terminal)
```
cd client
npm install
npm start
```

3. Open your browser to `http://localhost:3000`.
- Click Create New Document to make a doc (you'll be redirected to `/doc/<id>`).
- To test collaboration, open the same document (same URL) in two different tabs or two browsers; edits sync in real time. The document auto-saves every 2 seconds.

Notes:
- The server stores documents in `server/documents.db` (SQLite).
- The server provides two REST endpoints: `POST /create` and `GET /doc/:id`.
- Real-time sync and auto-save are handled through Socket.IO events: `join-doc`, `load-doc`, `send-changes`, `receive-changes`, `save-doc`.
