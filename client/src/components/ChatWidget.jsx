// src/components/ChatWidget.jsx
import React, { useState } from 'react'
import { FaComments, FaTimes, FaArrowLeft } from 'react-icons/fa'
import './ChatWidget.css'
import { useAuth } from '../context/AuthContext'
import ConversationsList from './ConversationsList'
import NewChatForm from './NewChatForm'
import ChatPage from './ChatPage'

export default function ChatWidget() {
  // 1) Always call useAuth first
  const { user, token } = useAuth()

  // 2) Now guard—if not logged in, bail out
  if (!user || !token) return null

  // 3) Now all your other hooks, in stable order:
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')          // 'list' | 'new' | 'chat'
  const [activeConvo, setActiveConvo] = useState(null)

  return (
    <>
      <div className={`chat-widget ${open ? 'open' : ''}`}>
        <div className="cw-header">
          {(view === 'chat' || view === 'new') && (
            <button
              className="cw-back"
              onClick={() => {
                setView('list')
                setActiveConvo(null)
              }}
            >
              <FaArrowLeft />
            </button>
          )}
          <h4>Chats</h4>
          <button className="cw-close" onClick={() => setOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="cw-body">
          {view === 'list' && (
            <ConversationsList
              onSelect={id => {
                setActiveConvo(id)
                setView('chat')
              }}
            />
          )}

          {view === 'new' && (
            <NewChatForm
              onDone={conversationId => {
                setActiveConvo(conversationId)
                setView('chat')
              }}
            />
          )}

          {view === 'chat' && activeConvo != null && (
            <ChatPage conversationId={activeConvo} />
          )}
        </div>

        <div className="cw-footer">
          {view === 'list' && (
            <button className="cw-btn" onClick={() => setView('new')}>
              + New Chat
            </button>
          )}
        </div>
      </div>

      <button
        className="chat-toggle-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle Chat"
      >
        <FaComments size={20} />
      </button>
    </>
  )
}
