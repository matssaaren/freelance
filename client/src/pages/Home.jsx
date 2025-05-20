import './Home.css';
import { Link } from 'react-router-dom';
import freesvg from '../svg/Freelancer.svg'
function Home() {
  return (
    <section className="home-hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1>Level Up Your Freelance Game</h1>
          <p>
            FreelanceHub helps you connect, collaborate, and grow — whether you're building your career or building a team.
          </p>
          <div className="hero-buttons">
            <Link to="/jobs">
              <button className="primary-btn">Browse Jobs</button>
            </Link>
            <Link to="/register">
              <button className="secondary-btn">Join Now</button>
            </Link>
          </div>
        </div>
        <div className="hero-image">

          <img src={freesvg} alt="Freelancing illustration" />
        </div>
      </div>
    </section>
  );
}

export default Home;
