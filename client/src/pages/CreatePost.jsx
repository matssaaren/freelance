import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CreatePost.css';

function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const categories = ['Development', 'Design', 'Marketing', 'Writing', 'Support'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !category) {
      setError('All fields are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:5000/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, category }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Post creation failed.');

      navigate('/jobs');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <p>You must be logged in to create a post.</p>;

  return (
    <div className="create-post-container">
      <h2>Create New Job Post</h2>
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-section">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
          <span className="char-count">{title.length}/100</span>
        </div>

        <div className="form-section">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="6"
            maxLength={500}
            required
          />
          <span className="char-count">{description.length}/500</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="submit-btn">Create Post</button>
      </form>

      {/* Live preview */}
      {(title || description || category) && (
        <div className="post-preview">
          <h4>Live Preview</h4>
          <div className="post-card">
            <h3>{title || 'Your Title Here'}</h3>
            <p><strong>Category:</strong> {category || 'None selected'}</p>
            <p>{description || 'Your description will appear here...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatePost;
