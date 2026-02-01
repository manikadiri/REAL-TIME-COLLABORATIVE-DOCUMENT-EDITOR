const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Debug: log requests for easier troubleshooting
app.use((req, res, next) => {
  console.log('REQ', req.method, req.path, 'from', req.ip);
  next();
});

// Create new document
app.post('/create', async (req, res) => {
  console.log('POST /create from', req.ip);
  const id = uuidv4();

  // Try to persist, but if persistence fails we still return an ID so the user
  // can continue working with a client-generated document id. We prefer
  // graceful fallback over blocking the UI with an error popup.
  try {
    // Use upsert so the operation is idempotent and less likely to fail
    if (db.upsertDocument) await db.upsertDocument(id, '');
    else await db.createDocument(id, '');
    console.log('Persisted document', id);
    return res.status(201).json({ id });
  } catch (err) {
    console.error('Error persisting document (falling back to generated id):', err && err.stack ? err.stack : err);
    // Return success response with a warning field so clients can continue
    // without showing a blocking error to the user.
    return res.status(200).json({ id, warning: 'persist_failed' });
  }
});

// Get document
app.get('/doc/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await db.getDocument(id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-doc', async (docId) => {
    try {
      socket.join(docId);
      const doc = await db.getDocument(docId);
      socket.emit('load-doc', doc ? doc.content : '');

      // Emit current active-users count to all in the room
      const clients = await io.in(docId).allSockets();
      io.to(docId).emit('active-users', clients.size);
    } catch (err) {
      console.error('join-doc error', err);
    }
  });

  socket.on('send-changes', ({ docId, content }) => {
    socket.to(docId).emit('receive-changes', content);
  });

  socket.on('save-doc', async ({ docId, content }) => {
    try {
      // Use upsert so first-time saves create the document record
      if (db.upsertDocument) await db.upsertDocument(docId, content);
      else await db.updateDocument(docId, content);
      const savedAt = new Date().toISOString();
      // Notify all clients in the room that the doc has been saved
      io.to(docId).emit('doc-saved', { savedAt });
    } catch (err) {
      console.error('save-doc error', err && err.stack ? err.stack : err);
    }
  });

  socket.on('disconnect', async () => {
    // Update active-users for rooms the socket was in
    for (const room of socket.rooms) {
      if (room === socket.id) continue;
      const clients = await io.in(room).allSockets();
      io.to(room).emit('active-users', clients.size);
    }
  });
});

const PORT = process.env.PORT || 5000;

// Better error handling and fallback
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});

server.on('error', (err) => {
  console.error('Server error', err);
});

// Try listening; if port is in use, try the next port
function tryListen(port) {
  server.listen(port, () => console.log(`Server listening on port ${port}`)).on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}`);
      tryListen(port + 1);
    } else {
      console.error('Listen error', e);
    }
  });
}

tryListen(PORT);