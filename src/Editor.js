import React from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { marked } from 'marked';

export default function Editor({ docId }) {
  const [content, setContent] = React.useState('');
  const [connection, setConnection] = React.useState('connecting');
  const [activeUsers, setActiveUsers] = React.useState(1);
  const [savedAt, setSavedAt] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const [dark, setDark] = React.useState(false);

  const socketRef = React.useRef(null);
  const applyingRemoteRef = React.useRef(false);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => setConnection('connected'));
    socket.on('disconnect', () => setConnection('disconnected'));

    socket.emit('join-doc', docId);

    socket.on('load-doc', (data) => {
      setContent(data || '');
    });

    socket.on('receive-changes', (data) => {
      applyingRemoteRef.current = true;
      setContent(data);
      setTimeout(() => (applyingRemoteRef.current = false), 50);
    });

    socket.on('active-users', (count) => {
      setActiveUsers(count);
    });

    socket.on('doc-saved', ({ savedAt: ts }) => {
      setSaving(false);
      setSavedAt(ts);
    });

    (async () => {
      try {
        const res = await axios.get(`http://localhost:5000/doc/${docId}`);
        if (res.data && typeof res.data.content === 'string') setContent(res.data.content);
      } catch (err) {
        console.error('Failed to fetch doc', err);
      }
    })();

    return () => {
      socket.disconnect();
    };
  }, [docId]);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    if (!applyingRemoteRef.current && socketRef.current) {
      socketRef.current.emit('send-changes', { docId, content: val });
    }
  }

  React.useEffect(() => {
    const iv = setInterval(() => {
      if (socketRef.current) {
        setSaving(true);
        socketRef.current.emit('save-doc', { docId, content });
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [docId, content]);

  function copyId() {
    navigator.clipboard.writeText(docId).then(() => alert('Copied ID to clipboard'));
  }

  function manualSave() {
    if (socketRef.current) {
      setSaving(true);
      socketRef.current.emit('save-doc', { docId, content });
    }
  }

  function applyFormat(before = '', after = before) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newText = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newText);
    if (socketRef.current) socketRef.current.emit('send-changes', { docId, content: newText });
    setTimeout(() => {
      ta.focus();
      const pos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function downloadDoc() {
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${docId}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function wordCount() {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }

  function formatSavedAt(ts) {
    if (!ts) return 'Not saved yet';
    const d = new Date(ts);
    return d.toLocaleString();
  }

  const previewHtml = React.useMemo(() => {
    try {
      return marked.parse(content || '', { breaks: true });
    } catch (err) {
      return '<p>Error rendering preview</p>';
    }
  }, [content]);

  return (
    <div className={`editor-grid ${dark ? 'dark' : 'light'}`}>
      <div className="top-bar">
        <div className="left-top">
          <div className="doc-id">Document ID: <code>{docId}</code></div>
          <div className="toolbar">
            <button className="btn small" title="Bold" onClick={() => applyFormat('**', '**')}>B</button>
            <button className="btn small" title="Italic" onClick={() => applyFormat('*', '*')}>I</button>
            <button className="btn small" title="Heading" onClick={() => applyFormat('# ', '\n')}>H</button>
            <button className="btn small" title="Code" onClick={() => applyFormat('`', '`')}>{`{}`}</button>
            <button className="btn small" title="Quote" onClick={() => applyFormat('> ', '\n')}>“</button>
            <button className="btn small" title="Link" onClick={() => applyFormat('[', '](https://)')}>🔗</button>
          </div>
        </div>

        <div className="right-top">
          <div className="badge">
            <span className={`dot ${connection === 'connected' ? 'green' : 'red'}`}></span>
            {connection}
          </div>
          <div className="badge">Users: {activeUsers}</div>
          <div className="badge">Words: {wordCount()}</div>
          <div className="save-indicator">{saving ? 'Saving...' : `Saved: ${formatSavedAt(savedAt)}`}</div>
          <div className="top-actions">
            <button className="btn small" onClick={manualSave}>Save</button>
            <button className="btn small" onClick={copyId}>Copy ID</button>
            <button className="btn small" onClick={downloadDoc}>Download</button>
            <button className="btn small" onClick={() => setShowPreview((s) => !s)}>{showPreview ? 'Hide Preview' : 'Show Preview'}</button>
            <button className="btn small" onClick={() => setDark((d) => !d)}>{dark ? 'Light' : 'Dark'}</button>
          </div>
        </div>
      </div>

      <div className="editor-area">
        <textarea ref={textareaRef} className="editor" value={content} onChange={handleChange} placeholder="Start typing markdown..." />

        {showPreview && (
          <div className="preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>
    </div>
  );
}
