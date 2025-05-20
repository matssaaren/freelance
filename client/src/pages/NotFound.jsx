import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you're looking for does not exist.</p>
      <Link to="/" style={{ marginTop: '20px', display: 'inline-block', color: '#007bff', textDecoration: 'underline' }}>
        Go back to Home
      </Link>
    </div>
  );
}

export default NotFound;
