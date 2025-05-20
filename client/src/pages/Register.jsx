import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [role, setRole] = useState('freelancer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [registerError, setRegisterError] = useState('');

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (password) => password.length >= 8 && /\d/.test(password);
  const isValidPhoneNumber = (code, number) =>
    /^\+\d{1,4}$/.test(code.trim()) && /^\d{7,15}$/.test(number.trim());

  const isAtLeast18YearsOld = (dateString) => {
    const today = new Date();
    const dob = new Date(dateString);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRole = params.get('role');
    if (urlRole === 'client' || urlRole === 'freelancer') {
      setRole(urlRole);
    }
  }, [location.search]);

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    isValidEmail(email) &&
    isStrongPassword(password) &&
    confirmPassword === password &&
    isValidPhoneNumber(phoneCode, phoneNumber) &&
    dob &&
    isAtLeast18YearsOld(dob) &&
    (role !== 'client' || company.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone: `${phoneCode}${phoneNumber}`,
      dob,
      role,
      company: role === 'client' ? company : null
    };

    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
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
            First Name
            <input
              type="text"
              placeholder="Jane"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>

          <label>
            Last Name
            <input
              type="text"
              placeholder="Doe"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>

          {role === 'client' && (
            <label>
              Company Name
              <input
                type="text"
                placeholder="Company Inc."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
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
                setEmailError(isValidEmail(e.target.value) ? '' : 'Invalid email address');
              }}
            />
          </label>
          {emailError && <p className="form-warning">{emailError}</p>}

          <label>
            Phone Number
            <div className="phone-input">
              <input
                type="text"
                placeholder="+372"
                value={phoneCode}
                onChange={(e) => {
                  setPhoneCode(e.target.value);
                  setPhoneError(
                    isValidPhoneNumber(e.target.value, phoneNumber)
                      ? ''
                      : 'Invalid phone code or number'
                  );
                }}
                required
                className="phone-code-input"
              />
              <input
                type="tel"
                placeholder="555123456"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError(
                    isValidPhoneNumber(phoneCode, e.target.value)
                      ? ''
                      : 'Invalid phone code or number'
                  );
                }}
                required
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
                const pwd = e.target.value;
                setPassword(pwd);
                setPasswordError(
                  isStrongPassword(pwd)
                    ? ''
                    : 'Password must be at least 8 characters and include a number'
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
                const selectedDate = e.target.value;
                setDob(selectedDate);
                setDobError(
                  isAtLeast18YearsOld(selectedDate)
                    ? ''
                    : 'You must be at least 18 years old to register'
                );
              }}
            />
          </label>
          {dobError && <p className="form-warning">{dobError}</p>}

          <div className="role-selector">
            <p>Are you hiring or looking for a job?</p>
            <div className="role-buttons">
              <button
                type="button"
                className={role === 'freelancer' ? 'selected' : ''}
                onClick={() => setRole('freelancer')}
              >
                I'm looking for a job
              </button>
              <button
                type="button"
                className={role === 'client' ? 'selected' : ''}
                onClick={() => setRole('client')}
              >
                I'm hiring
              </button>
            </div>
          </div>

          {registerError && <p className="form-warning">{registerError}</p>}

          <button type="submit" className="submit-btn" disabled={!isFormValid}>
            Create Account
          </button>
        </form>
      </div>
    </>
  );
}

export default Register;
