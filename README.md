

---

# 📝 Collaborative Real-time Doc Editor

A lightweight, full-stack collaborative markdown editor built with **React**, **Node.js**, and **Socket.IO**. This application allows multiple users to edit the same document simultaneously with live synchronization and auto-save functionality.

## 🚀 Key Features

* **Real-time Synchronization:** Powered by Socket.IO for instant updates across all connected clients.
* **Markdown Support:** Write in Markdown and see a live-rendered preview instantly.
* **Auto-save & Persistence:** Documents are automatically persisted to a SQLite database every 2 seconds.
* **Rich Toolbar:** Quick-formatting for Bold, Italic, Headings, Code blocks, and more.
* **Collaboration Tools:** Active user tracking, word count, and unique Document ID sharing.
* **Dark Mode:** Toggle between light and dark themes for comfortable writing.

---

## 🛠️ Technical Stack

| Component | Technology |
| --- | --- |
| **Frontend** | React (Hooks), Axios, Marked (Markdown Parsing) |
| **Backend** | Node.js, Express |
| **Real-time** | Socket.IO |
| **Database** | SQLite3 |
| **Styling** | Custom CSS3 (Responsive Grid) |

---

## 📋 Getting Started

### Prerequisites

* Node.js (v16.x or higher)
* npm (v8.x or higher)

### Installation & Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-username/realtime-doc-editor.git
cd realtime-doc-editor

```

**2. Start the Backend Server**

```bash
cd server
npm install
npm start

```

The server will run on `http://localhost:5000`. It will automatically create a `documents.db` file on its first run.

**3. Start the Frontend Client**
Open a new terminal window:

```bash
cd client
npm install
npm start

```

The client will launch at `http://localhost:3000`.

---

## 📡 Real-time Architecture

The application uses a **pub-sub** model via Socket.IO:

1. **`join-doc`**: Users join a specific room based on the `docId`.
2. **`send-changes`**: Emitted by the client on every keystroke.
3. **`receive-changes`**: Broadcasted by the server to all other users in the room to update their state.
4. **`save-doc`**: A debounced event that triggers the server to commit the current state to the SQLite database.

---

## 📂 Project Structure

```text
├── client/          # React application
│   ├── src/
│   │   ├── App.js   # Routing and landing logic
│   │   ├── Editor.js# Core collaborative editor logic
│   │   └── style.css# Global styling and themes
├── server/          # Node.js backend
│   ├── server.js    # Express & Socket.IO configuration
│   └── documents.db # SQLite database (generated at runtime)

```

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

