import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    try {
      const res = await fetch(`http://localhost:5000/profile/${username}`);
      if (!res.ok) throw new Error('Profile not found');
      const data = await res.json();
      setUser(data);
      fetchMyPosts(data.name); // name = "First Last"
      fetchRatings(data.id);
    } catch (err) {
      navigate('/404');
    }
  }

  async function fetchMyPosts(displayName) {
    const res = await fetch(`http://localhost:5000/posts/user/${username}`);
    const data = await res.json();
    setPosts(data);
  }

  async function fetchRatings(userId) {
  try {
    const res = await fetch(`http://localhost:5000/reviews/ratings/${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch ratings');
    }
    const data = await res.json();
    setRatings(data);
  } catch (err) {
    console.error('Fetch ratings error:', err);
    setRatings([]);
  }
}

const handleRatingSubmit = async () => {
  if (!newRating || !loggedInUser || !user?.id) return;

  try {
    const res = await fetch(`http://localhost:5000/reviews/ratings/${user.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ rating: newRating, comment: newComment }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit rating');
    }

    setNewRating(0);
    setNewComment('');
    setSubmitted(true);
    fetchRatings(user.id); // Refresh ratings
  } catch (err) {
    console.error('Rating submission error:', err);
    alert('Could not submit rating: ' + err.message);
  }
};


  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <div className="profile-grid">
        {/* LEFT: Profile Info + Ratings */}
        <div className="left-column">
          {/* Profile Section */}
          <div className="profile-section">
            <img
              src={
                user.avatar?.startsWith('http')
                  ? user.avatar
                  : `http://localhost:5000/${user.avatar}`
              }
              alt="User Avatar"
              className="avatar"
            />
            <h2>{user.username}</h2>
            <p><strong>Name:</strong> {user.name}</p>
            {user.company && <p><strong>Company:</strong> {user.company}</p>}
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Date of Birth:</strong> {user.dob}</p>
            <p><strong>Bio:</strong> {user.bio}</p>
          </div>

          {/* Ratings */}
          <div className="ratings-box">
            <h3>⭐ Ratings</h3>
            {averageRating ? (
              <p>Average: <strong>{averageRating} / 5 ★</strong></p>
            ) : (
              <p>No ratings yet.</p>
            )}
            <ul className="rating-list">
              {ratings.map((r, idx) => (
                <li key={r.id || idx}>
                  <strong>{r.rating} / 5 ★</strong>{r.comment ? ` – ${r.comment}` : ''}
                </li>
              ))}
            </ul>

            {loggedInUser && user.id !== loggedInUser.id && (
              <div className="rating-form">
                <label>
                  Your Rating:
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                  >
                    <option value={0}>--</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <textarea
                  placeholder="Write a comment (optional)..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button onClick={handleRatingSubmit} disabled={!newRating || submitted}>
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Post List */}
        <div className="posts-section">
          <h3>My Posts</h3>
          {posts.length > 0 ? (
            <div className="post-list">
              {posts.map((post) => {
                const shortName = `${post.first_name[0]}. ${post.last_name}`;
                const usernameURL = `${post.first_name}-${post.last_name}`;
                return (
                  <div key={post.post_id} className="post-card">
                    <h4>{post.title}</h4>
                    <div className="job-user-info">
                      <img
                        src={
                          post.avatar?.startsWith('http')
                            ? post.avatar
                            : `http://localhost:5000/${post.avatar}`
                        }
                        alt="User Avatar"
                        className="job-user-avatar"
                      />
                      <Link to={`/profile/${usernameURL}`} className="job-user-name">
                        {shortName}
                      </Link>
                    </div>
                    <p>{post.description.slice(0, 100)}...</p>
                    <p><strong>Date:</strong> {new Date(post.upload_date).toLocaleDateString()}</p>
                    <Link to={`/posts/${post.post_id}`} className="view-job-link">
                      View Details
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No posts available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
