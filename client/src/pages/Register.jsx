import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('freelancer');

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');

  const [registerError, setRegisterError] = useState('');

  // Validation helpers
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isStrongPassword = (p) => p.length >= 8 && /\d/.test(p);
  const isValidPhone = (code, num) =>
    /^\+\d{1,4}$/.test(code.trim()) && /^\d{7,15}$/.test(num.trim());
  const isAdult = (d) => {
    const today = new Date();
    const birth = new Date(d);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  };

  // read role from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    if (r === 'client' || r === 'freelancer') setRole(r);
  }, [location.search]);

  // overall form validity
  const isFormValid =
    username.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    isValidEmail(email) &&
    isStrongPassword(password) &&
    password === confirmPassword &&
    isValidPhone(phoneCode, phoneNumber) &&
    dob &&
    isAdult(dob) &&
    (role !== 'client' || company.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    // final client-side checks
    if (!isFormValid) return;

    const payload = {
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: role === 'client' ? company.trim() : null,
      email: email.trim(),
      password,
      phone: `${phoneCode}${phoneNumber}`,
      dob,
      role,
    };

    try {
      const res = await fetch(import.meta.env.VITE_SERVERIP + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setRegisterError(err.message);
    }
  };

  return (
    <>
      <div className="bubble-background">
        {[...Array(8)].map((_, i) => (
          <div className="bubble" key={i}></div>
        ))}
      </div>

      <div className="register-container">
        <h1>Register</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <label>
            Username
            <input
              type="text"
              placeholder="your-username"
              value={username}
              required
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(
                  /^[a-zA-Z0-9-_]{3,20}$/.test(e.target.value)
                    ? ''
                    : 'Use 3–20 letters, numbers, hyphens or underscores'
                );
              }}
            />
          </label>
          {usernameError && <p className="form-warning">{usernameError}</p>}

          <label>
            First Name
            <input
              type="text"
              placeholder="Jane"
              value={firstName}
              required
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              placeholder="Doe"
              value={lastName}
              required
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>

          {role === 'client' && (
            <label>
              Company
              <input
                type="text"
                placeholder="Company Inc."
                value={company}
                required
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              required
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(
                  isValidEmail(e.target.value) ? '' : 'Invalid email'
                );
              }}
            />
          </label>
          {emailError && <p className="form-warning">{emailError}</p>}

          <label>
            Phone
            <div className="phone-input">
              <input
                type="text"
                placeholder="+372"
                value={phoneCode}
                required
                className="phone-code-input"
                onChange={(e) => {
                  setPhoneCode(e.target.value);
                  setPhoneError(
                    isValidPhone(e.target.value, phoneNumber)
                      ? ''
                      : 'Invalid phone'
                  );
                }}
              />
              <input
                type="tel"
                placeholder="555123456"
                value={phoneNumber}
                required
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError(
                    isValidPhone(phoneCode, e.target.value)
                      ? ''
                      : 'Invalid phone'
                  );
                }}
              />
            </div>
          </label>
          {phoneError && <p className="form-warning">{phoneError}</p>}

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(
                  isStrongPassword(e.target.value)
                    ? ''
                    : 'At least 8 chars & one number'
                );
              }}
            />
          </label>
          {passwordError && <p className="form-warning">{passwordError}</p>}

          <label>
            Confirm Password
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          {confirmPassword && confirmPassword !== password && (
            <p className="form-warning">Passwords do not match</p>
          )}

          <label>
            Date of Birth
            <input
              type="date"
              value={dob}
              required
              onChange={(e) => {
                setDob(e.target.value);
                setDobError(
                  isAdult(e.target.value)
                    ? ''
                    : 'You must be at least 18'
                );
              }}
            />
          </label>
          {dobError && <p className="form-warning">{dobError}</p>}

          <div className="role-selector">
            <p>I am a:</p>
            <div className="role-buttons">
              <button
                type="button"
                className={role === 'freelancer' ? 'selected' : ''}
                onClick={() => setRole('freelancer')}
              >
                Freelancer
              </button>
              <button
                type="button"
                className={role === 'client' ? 'selected' : ''}
                onClick={() => setRole('client')}
              >
                Client
              </button>
            </div>
          </div>

          {registerError && <p className="form-warning">{registerError}</p>}

          <button
            type="submit"
            className="submit-btn"
            disabled={!isFormValid}
          >
            Create Account
          </button>
        </form>
      </div>
    </>
  );
}

export default Register;
