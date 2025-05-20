import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css'; // using your Profile.css

function EditProfile() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [dob, setDob] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [previewImage, setPreviewImage] = useState(''); 

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts[1] || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setDob(user.dob ? user.dob.split('T')[0] : ''); // Fix: format date for input
      setPreviewImage(
        user.avatar
          ? user.avatar.startsWith('http')
            ? user.avatar
            : `http://localhost:5000/${user.avatar}`
          : 'https://placehold.co/150/png'
      );
    }
  }, [user]);  

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:5000/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setAvatar(data.avatarPath);
      setPreviewImage(`http://localhost:5000/${data.avatarPath}`);
    } catch (err) {
      setError(err.message);
      console.error(err.message);
    }
  };

  const handleAvatarURLChange = (e) => {
    setAvatar(e.target.value);
    setPreviewImage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!firstName || !lastName || !email) {
      setError('First name, last name, and email are required.');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
  
    if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
      setError('Phone number must be valid (7-15 digits, optional + sign).');
      return;
    }
  
    if (avatar && !(avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('uploads/'))) {
      setError('Avatar must be a valid URL or an uploaded file.');
      return;
    }
  
    if (newPassword && newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
  
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
  
    // if everything is good -> continue
    try {
      const token = localStorage.getItem('token');
  
      const res = await fetch('http://localhost:5000/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          firstName, lastName, email, phone, bio, avatar, dob, 
          currentPassword, newPassword 
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }
  
      await refreshUser(); 
  
      setSuccess('Profile updated successfully!');
      setError('');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };
  

  if (loading) return <p>Loading...</p>;

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-container">
      <h2>Edit Profile</h2>

      <div className="avatar-preview">
        <img
            src={previewImage || 'https://placehold.co/150/png'}
            alt="Avatar Preview"
            className="avatar-img"
        />
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="form-section">
          <label>Upload New Avatar:</label>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} />
        </div>

        <div className="form-section">
          <label>OR Avatar URL:</label>
          <input
            type="text"
            value={avatar}
            onChange={handleAvatarURLChange}
            placeholder="https://placehold.co/150/png"
          />
        </div>

        <div className="form-section">
          <label>First Name:</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div className="form-section">
          <label>Last Name:</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <div className="form-section">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-section">
          <label>Phone:</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="form-section">
          <label>Bio:</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" />
        </div>

        <div className="form-section">
          <label>Date of Birth:</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>

        <hr className="divider" />

        <h3>Change Password</h3>

        <div className="form-section">
          <label>Current Password:</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        <div className="form-section">
          <label>New Password:</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <div className="form-section">
          <label>Confirm New Password:</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button type="submit" className="submit-btn">Save Changes</button>
      </form>
    </div>
  );
}

export default EditProfile;
