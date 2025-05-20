import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './SinglePost.css'; // optional new CSS
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SinglePost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
  
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/posts/${post.post_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }
  
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }
  
  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`http://localhost:5000/posts/${id}`);
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return <p>Loading post...</p>;
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <div className="single-post-container">{user && post && user.id === post.user_id && (
        <div className="post-actions">
            <button className="edit-btn" onClick={() => navigate(`/edit-post/${post.post_id}`)}>Edit Post</button>
            <button className="delete-btn" onClick={handleDelete}>Delete Post</button>
        </div>
        )}
      
      <h2>{post.title}</h2>
      <p><strong>Description:</strong></p>
      <p>{post.description}</p>
      <p><strong>Posted by:</strong> {post.first_name} {post.last_name}</p>
      <p><strong>Date:</strong> {new Date(post.upload_date).toLocaleDateString()}</p>
    </div>
  );
}

export default SinglePost;
