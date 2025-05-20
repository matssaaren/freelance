// src/components/ConversationsList.jsx
import React, { useEffect, useState } from 'react'
import { Link }                        from 'react-router-dom'
import { useAuth }                     from '../context/AuthContext'
import './ConversationsList.css'

export default function ConversationsList({ onSelect }) {
  const { token, user }    = useAuth()
  const [convos, setConvos] = useState([])
  const [error, setError]   = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setConvos)
      .catch(() => setError('Could not load conversations'))
  }, [token])

  const prepared = convos
    .map(c => {
      const others = c.participants.filter(p => p.id !== user.id)
      return {
        id: c.id,
        title: others.map(o => o.username).join(', '),
        last: c.last_activity
              ? new Date(c.last_activity).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})
              : 'No messages yet'
      }
    })
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  if (error) return <div className="empty-state error">{error}</div>
  if (!prepared.length) {
    return (
      <div className="empty-state">
        <p>No conversations yet.</p>
        {!onSelect && <Link to="/new-chat">Start a new chat →</Link>}
      </div>
    )
  }

  return (
    <div className="convos">
      <h2>Your Chats</h2>
      <input
        className="convo-search"
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <ul className="convos-list">
        {prepared.map(c => {
          // if onSelect exists, we render a DIV and call it;
          // otherwise we render a Link to the standalone route.
          const Container = onSelect ? 'div' : Link
          const toOrOnClick = onSelect
            ? { onClick: () => onSelect(c.id) }
            : { to: `/chat/${c.id}` }

          return (
            <li key={c.id} className="convo-item">
              <Container
                {...toOrOnClick}
                className="convo-link"
                style={ onSelect ? { cursor: 'pointer' } : {} }
              >
                <div className="convo-title">@{c.title}</div>
                <div className="convo-meta">Last: {c.last}</div>
              </Container>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
