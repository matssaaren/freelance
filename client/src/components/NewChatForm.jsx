// src/components/NewChatForm.jsx
import React, { useEffect, useState } from 'react';
import { useAuth }                    from '../context/AuthContext';
import './NewChatForm.css';

export default function NewChatForm({ onDone }) {
  const { token, user } = useAuth();
  const [users, setUsers]           = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setUsers(data.filter(u => u.id !== user.id)))
      .catch(() => setError('Could not load users'));
  }, [token, user.id]);

  const suggestions = users
    .filter(u => !selectedId &&
                 u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 6);

  const pickUser = u => {
    setSelectedId(u.id);
    setSearchTerm(u.username);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedId) return alert('Pick someone to chat with.');
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': `application/json`,
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ participantIds: [selectedId] })
      });
      if (!res.ok) throw new Error(res.status);
      const { conversationId } = await res.json();
      onDone(conversationId);
    } catch {
      setError('Could not start chat.');
    }
  };

  return (
    <form className="new-chat-form" onSubmit={handleSubmit}>
      <h2>Start a New Chat</h2>
      {error && <div className="error">{error}</div>}

      <div className="search-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="Search by username…"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setSelectedId(null); }}
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map(u => (
              <li key={u.id} onClick={() => pickUser(u)}>
                <strong>@{u.username}</strong> — {u.first_name} {u.last_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && (
        <div className="picked">
          @{users.find(u => u.id === selectedId).username}
          <button
            type="button"
            onClick={() => { setSelectedId(null); setSearchTerm(''); }}
            aria-label="Remove selection"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="submit"
        className="create-btn"
        disabled={!selectedId}
      >
        Start Chat
      </button>
    </form>
  );
}
