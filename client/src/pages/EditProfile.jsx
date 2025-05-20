import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';

export default function EditProfile() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  // editable fields
  const [fields, setFields] = useState({
    username: '',
    avatarUrl: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    bio: '',
  });
  const [editingKey, setEditingKey] = useState(null);
  const [tempValue, setTempValue] = useState('');
  // password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!loading && !user) return navigate('/login');
    if (user) {
      setFields({
        username:   user.username || '',
        avatarUrl:  user.avatar   || '',
        firstName:  user.name.split(' ')[0] || '',
        lastName:   user.name.split(' ')[1] || '',
        email:      user.email    || '',
        phone:      user.phone    || '',
        dob:        user.dob ? user.dob.slice(0,10) : '',
        bio:        user.bio      || '',
      });
    }
  }, [user, loading, navigate]);

  const startEdit = key => {
    setEditingKey(key);
    setTempValue(fields[key]);
    setPwError('');
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setPwError('');
  };

  const saveField = async key => {
    try {
      const token = localStorage.getItem('token');
      const body = { [key]: tempValue };
      const res = await fetch(import.meta.env.VITE_SERVERIP + '/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setFields(f => ({ ...f, [key]: tempValue }));
      setEditingKey(null);
      await refreshUser();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAvatarFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_SERVERIP + '/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFields(f => ({ ...f, avatarUrl: data.avatarPath }));
      await refreshUser();
    } catch (err) {
      alert(err.message);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPwError('Fill both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(import.meta.env.VITE_SERVERIP + '/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');
      setPwError('');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      alert('Password updated!');
    } catch (err) {
      setPwError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="edit-profile-page">
      <div className="profile-card">
        {/* header */}
        <div className="card-header">
          <div className="avatar-circle">
            {user.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <h2 className="user-name">{user.name}</h2>
        </div>

        {/* each row */}
        {[
          ['Username','username','text'],
          ['Avatar URL','avatarUrl','text'],
          ['First Name','firstName','text'],
          ['Last Name','lastName','text'],
          ['Email','email','email'],
          ['Phone','phone','text'],
          ['Date of Birth','dob','date'],
        ].map(([label,key,type])=>(
          <div className="profile-row" key={key}>
            <span className="field-label">{label}</span>
            {editingKey===key
              ? <input
                  className="field-input"
                  type={type}
                  value={tempValue}
                  onChange={e=>setTempValue(e.target.value)}
                />
              : <span className="field-value">{fields[key]}</span>}
            {editingKey===key
              ? <>
                  <button className="edit-btn save" onClick={()=>saveField(key)}>Save</button>
                  <button className="edit-btn cancel" onClick={cancelEdit}>Cancel</button>
                </>
              : <button className="edit-btn" onClick={()=>startEdit(key)}>Edit</button>}
            {key==='avatarUrl' && (
              <label className="upload-btn">
                Upload<input type="file" accept="image/*" onChange={handleAvatarFile}/>
              </label>
            )}
          </div>
        ))}

        {/* bio */}
        <div className="profile-row">
          <span className="field-label">Bio</span>
          {editingKey==='bio'
            ? <textarea
                className="field-input"
                value={tempValue}
                onChange={e=>setTempValue(e.target.value)}
              />
            : <span className="field-value">{fields.bio||'—'}</span>}
          {editingKey==='bio'
            ? <>
                <button className="edit-btn save" onClick={()=>saveField('bio')}>Save</button>
                <button className="edit-btn cancel" onClick={cancelEdit}>Cancel</button>
              </>
            : <button className="edit-btn" onClick={()=>startEdit('bio')}>Edit</button>}
        </div>

        {/* password section */}
        <div className="pw-header">Change Password</div>
        <div className="profile-row pw-row">
          <span className="field-label">Current</span>
          <input
            type="password"
            className="field-input"
            value={currentPassword}
            onChange={e=>setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="profile-row pw-row">
          <span className="field-label">New</span>
          <input
            type="password"
            className="field-input"
            value={newPassword}
            onChange={e=>setNewPassword(e.target.value)}
          />
        </div>
        <div className="profile-row pw-row">
          <span className="field-label">Confirm</span>
          <input
            type="password"
            className="field-input"
            value={confirmPassword}
            onChange={e=>setConfirmPassword(e.target.value)}
          />
          <button className="edit-btn save" onClick={savePassword}>Save</button>
        </div>
        {pwError && <div className="pw-error">{pwError}</div>}
      </div>
    </div>
  );
}
