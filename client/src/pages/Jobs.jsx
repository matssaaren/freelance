import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Jobs.css';

function Jobs() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(import.meta.env.VITE_SERVERIP + '/posts');
        const data = await res.json();
        setAllPosts(data);
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const handleFilter = (term, category) => {
    const filtered = allPosts.filter((post) => {
      const fullName = `${post.first_name} ${post.last_name}`.toLowerCase();
      return (
        (post.title.toLowerCase().includes(term) ||
          post.description.toLowerCase().includes(term) ||
          fullName.includes(term)) &&
        (category === '' || post.category?.toLowerCase() === category)
      );
    });

    setPosts(filtered);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    handleFilter(term, categoryFilter);
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value.toLowerCase();
    setCategoryFilter(cat);
    handleFilter(searchTerm, cat);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPosts(allPosts);
  };

  if (loading) {
    return <p>Loading posts...</p>;
  }

  return (
    <div className="jobs-container">
      {/* Bubbles */}
      <div className="bubble bubble1"></div>
      <div className="bubble bubble2"></div>
      <div className="bubble bubble3"></div>
      <div className="bubble bubble4"></div>

      <h2>Available Jobs</h2>

      {/* 🔍 Search + Category Filter */}
      <div className="job-filters">
        <div className="job-search-bar">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {(searchTerm || categoryFilter) && (
            <button className="clear-search-btn" onClick={handleClearFilters}>
              ✕
            </button>
          )}
        </div>

        <div className="category-filter">
          <select value={categoryFilter} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="writing">Writing</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      {/* Scrollable Jobs Section */}
      <div className="jobs-scroll-container">
        <div className="jobs-list">
          {posts.length > 0 ? (
            posts.map((post, index) => {
              const shortName = `${post.first_name.charAt(0)}. ${post.last_name}`;
              let usernameURL = `${post.username}`;
              if (user && post.user_id === user.id) usernameURL = '';

              return (
                <div
                  key={post.post_id}
                  className="job-card"
                  style={{ '--i': `${index * 0.1}s` }}
                >
                  <div className="job-user-info">
                    <img
                      src={
                        post.avatar
                          ? post.avatar.startsWith('http')
                            ? post.avatar
                            : import.meta.env.VITE_SERVERIP + `/${post.avatar}`
                          : 'https://placehold.co/50x50/png'
                      }
                      alt="User Avatar"
                      className="job-user-avatar"
                    />
                    <Link to={`/profile/${usernameURL}`} className="job-user-name">
                      {shortName}
                    </Link>
                  </div>

                  <h3>{post.title}</h3>
                  <p className="job-category">
                    <strong>Category:</strong> {post.category || 'Unspecified'}
                  </p>
                  <p>
                    {post.description.length > 100
                      ? post.description.slice(0, 100) + '...'
                      : post.description}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(post.upload_date).toLocaleDateString()}
                  </p>
                  <Link to={`/posts/${post.post_id}`} className="view-job-link">
                    View Details
                  </Link>
                </div>
              );
            })
          ) : (
            <p>No posts available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Jobs;
