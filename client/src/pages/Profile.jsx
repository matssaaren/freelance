import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }

    if (user) {
      fetchMyPosts();
      fetchMyRatings(user.id);
    }
  }, [user, loading, navigate]);

  async function fetchMyPosts() {
    try {
      const username = user.username
      const res = await fetch(`http://localhost:5000/posts/user/${username}`);
      const data = await res.json();
      setMyPosts(data);
    } catch (error) {
      console.error('Error fetching my posts:', error);
    }
  }

  async function fetchMyRatings(userId) {
    try {
      const res = await fetch(`http://localhost:5000/reviews/ratings/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      const data = await res.json();
      setRatings(data);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setRatings([]);
    }
  }

  if (loading) return <p>Loading profile...</p>;
  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-grid">

        {/* Left Column: Profile + Ratings */}
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
            <h2>{user.name}</h2>
            {user.company && <p><strong>Company:</strong> {user.company}</p>}
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not set'}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set'}</p>
            <p><strong>Bio:</strong> {user.bio || 'No bio yet'}</p>

            <div className="profile-actions">
              <Link to="/edit-profile" className="profile-action-btn edit-btn">Edit Profile</Link>
              <Link to="/create-post" className="profile-action-btn create-btn">Create Post</Link>
            </div>
          </div>

          {/* Ratings Section */}
          <div className="ratings-box">
            <h3>Ratings</h3>
            {ratings.length > 0 ? (
              <ul className="rating-list">
                {ratings.map((r) => (
                  <li key={r.id}>
                    <strong>{r.rating} ★</strong> – {r.comment || 'No comment'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No ratings yet.</p>
            )}
          </div>

        </div>

        {/* Right Column: Posts */}
        <div className="posts-section">
          <h3>My Posts</h3>
          {myPosts.length > 0 ? (
            <div className="post-scroll-wrapper">
              <div className="post-list">
                {myPosts.map((post) => (
                  <div key={post.post_id} className="post-card">
                    <h4>{post.title}</h4>
                    <p>{post.description.length > 100 ? post.description.slice(0, 100) + '...' : post.description}</p>
                    <p><strong>Posted:</strong> {new Date(post.upload_date).toLocaleDateString()}</p>
                    <Link to={`/posts/${post.post_id}`} className="view-job-link">
                      View Post
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>You haven't created any posts yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;
