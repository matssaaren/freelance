import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

function Login() {
  const { login } = useAuth();
  
  const location = useLocation();
  const registered = location.state?.registered || false;
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`http://localhost:5000/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });
  
      if (!res.ok) throw new Error("Google login failed");
  
      const data = await res.json();
  
      login(data); // Use your existing auth context to log in user
  
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed");
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
  <>
    <div className="bubble-background">
      {[...Array(8)].map((_, i) => (
        <div className="bubble" key={i}></div>
      ))}
    </div>

    <div className="login-container">
      <h2>Login</h2>

      {registered && (
        <p style={{ color: 'green', textAlign: 'center', marginBottom: '10px' }}>
          Account created successfully! Please log in.
        </p>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <label>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className={`toggle-password ${showPassword ? 'show' : 'hide'}`}
            aria-label="Toggle password visibility"
          />

        </div>

        <div className="login-options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <div className="forgot-container">
            <a href="/forgot-password" className="forgot-link">
              Forgot password?
            </a>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="login-btn">Login</button>
      </form>

      <div className="social-logins">
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => {
          console.log("Login Failed");
          setError("Google login failed");
        }}
        useOneTap={false}
        ux_mode="popup"
        prompt="select_account"
      />


        {/* <button className="github-login">Continue with GitHub</button> */}
      </div>

    </div>
  </>
);

}

export default Login;