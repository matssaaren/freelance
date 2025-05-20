import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header-bar">
      <nav className="header-nav">
        <div className="header-left">
          <Link to="/" className="header-logo">FreelanceHub</Link>
          <Link to="/jobs" className="header-link">Jobs</Link>
          {user && <Link to="/profile" className="header-link">Profile</Link>}
        </div>

        <div className="header-right">
          {user ? (
            <>
              <span className="header-user">Hi, {user.name}</span>
              <button className="header-btn header-logout" onClick={logout}>
              Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-btn">Login</Link>
              <Link to="/register" className="header-btn header-primary">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
