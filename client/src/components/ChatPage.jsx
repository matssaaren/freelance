// src/components/ChatPage.jsx
import React, { useEffect, useState } from 'react'
import { socket }                    from '../socket'
import { useAuth }                   from '../context/AuthContext'
import { useParams }                 from 'react-router-dom'
import './ChatPage.css'

export default function ChatPage({ conversationId: propId }) {
  const { token, user } = useAuth()
  const params          = useParams()
  // prefer the prop (widget), otherwise fall back to the URL
  const rawId           = propId ?? params.conversationId
  const convoId         = parseInt(rawId, 10)
  const [messages, setMessages] = useState([])
  const [draft,    setDraft]    = useState('')
  const [error,    setError]    = useState('')
  const [title,    setTitle]    = useState('Chat')

  useEffect(() => {
    if (!token || !user || Number.isNaN(convoId)) {
      // bail out early if we don't have a valid ID
      return
    }

    // load conversation meta (participants) so we can build a header
    fetch(`/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(list => {
        const convo = list.find(c => c.id === convoId)
        if (convo) {
          const other = convo.participants.find(p => p.id !== user.id)
          setTitle(other?.username || 'Unknown')
        }
      })
      .catch(console.error)

    // join the socket room and load the message history
    socket.emit('identify', { userId: user.id })
    socket.emit('join_convo', { conversationId: convoId })

    fetch(`/api/conversations/${convoId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`)
        return r.json()
      })
      .then(setMessages)
      .catch(() => setError('Could not load messages'))

    // live updates
    const handler = m => {
      if (m.conversation_id === convoId) {
        setMessages(ms => [...ms, m])
      }
    }
    socket.on('new_message', handler)

    return () => {
      socket.off('new_message', handler)
      socket.emit('leave_convo', { conversationId: convoId })
    }
  }, [convoId, token, user])

  const send = () => {
    if (!draft.trim()) return
    socket.emit('send_message', {
      conversationId: convoId,
      senderId:       user.id,
      content:        draft
    })
    setDraft('')
  }

  return (
    <div className="chat-window">
      {error && <p className="error-msg">{error}</p>}
      <header className="chat-header">
        Chat with <strong>{title}</strong>
      </header>
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.sender_id === user.id ? 'mine' : 'theirs'}`}>
            <div className="msg-content">
              <strong>{m.first_name}:</strong> {m.content}
            </div>
            <div className="msg-timestamp">
              {new Date(m.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </div>
          </div>
        ))}
      </div>
      <footer className="composer">
        <input
          placeholder="Type…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button onClick={send}>Send</button>
      </footer>
    </div>
  )
}
