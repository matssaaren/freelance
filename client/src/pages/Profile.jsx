import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }

    if (user) {
      fetchMyPosts();
    }
  }, [user, loading, navigate]);

  async function fetchMyPosts() {
    try {
      const username = user.name.split(' ').join('-');
      const res = await fetch(`http://localhost:5000/posts/user/${username}`);
      const data = await res.json();
      setMyPosts(data);
    } catch (error) {
      console.error('Error fetching my posts:', error);
    }
  }

  if (loading) return <p>Loading profile...</p>;
  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-grid">
        
        {/* Profile Section */}
        <div className="profile-section">
  <img
    src={
      user.avatar
        ? user.avatar.startsWith('http')
          ? user.avatar
          : `http://localhost:5000/${user.avatar}`
        : 'https://placehold.co/150/png'
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


        {/* Posts Section */}
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
