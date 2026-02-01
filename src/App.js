import React from 'react';
import axios from 'axios';
import Editor from './Editor';
import './style.css';

export default function App() {
  const [idInput, setIdInput] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const path = window.location.pathname;
  if (path.startsWith('/doc/')) {
    const docId = path.split('/doc/')[1];
    return <Editor docId={docId} />;
  }

  async function createDoc() {
    setCreating(true);
    try {
      const res = await axios.post('http://localhost:5000/create');
      // if server returned an id (even with a warning), proceed
      if (res && res.data && res.data.id) {
        if (res.data.warning) console.warn('Server returned id but persistence failed:', res.data.warning);
        const id = res.data.id;
        window.location.href = `/doc/${id}`;
        return;
      }

      // If server didn't return an id for some reason, fall back
      console.warn('Create request did not return an id, falling back to client-generated ID');
      const fallbackId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      window.location.href = `/doc/${fallbackId}`;
    } catch (err) {
      console.error('Create request failed, falling back to client-generated ID', err);
      // Fallback: generate an ID client-side so user can continue
      const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      // Try background attempt to persist (non-blocking)
      axios.post('http://localhost:5000/create').catch((e) => console.warn('Background create failed', e));
      window.location.href = `/doc/${id}`;
    } finally {
      setCreating(false);
    }
  }

  function openDoc() {
    if (!idInput) return alert('Enter a document ID');
    window.location.href = `/doc/${idInput}`;
  }

  return (
    <div className="landing">
      <div className="card">
        <h1>Realtime Doc Editor</h1>
        <p>Create and collaborate on documents in real-time — Markdown support, live preview, and auto-save.</p>
        <div className="actions">
          <button className="btn" onClick={createDoc} disabled={creating}>{creating ? 'Creating...' : 'Create New Document'}</button>
        </div>
        <div className="open">
          <input value={idInput} onChange={(e) => setIdInput(e.target.value)} placeholder="Enter document ID" />
          <button className="btn" onClick={openDoc}>Open</button>
        </div>
        <p className="note">Tip: To test collaboration, open the same document in two different tabs.</p>
      </div>
    </div>
  );
}
