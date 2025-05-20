// src/components/NotificationsBadge.jsx
import React, { useEffect, useState } from 'react';
import { socket }    from '../socket';
import { useAuth }   from '../context/AuthContext';

export default function NotificationsBadge() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    // bootstrap unread count
    fetch('/api/notifications/count', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch count');
        return res.json();
      })
      .then(data => setCount(data.count))
      .catch(err => console.error('Notif count error:', err));

    const onNotif = () => setCount(c => c + 1);
    socket.on('new_notification', onNotif);

    return () => {
      socket.off('new_notification', onNotif);
    };
  }, [token]);

  return <span className="notif-badge">{count}</span>;
}
