import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import bcrypt from 'bcryptjs';

function AuthPage({ onSignIn, dbPromise }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log(`${isSignUp ? 'Sign-up' : 'Sign-in'} attempt with email:`, email);

    try {
      const db = await dbPromise;
      console.log('Database accessed, stores:', Array.from(db.objectStoreNames));

      if (isSignUp) {
        console.log('Checking for existing user');
        const existingUser = await db.transaction('users').objectStore('users').get(email);
        if (existingUser) {
          console.log('User already exists:', existingUser);
          setError('Email already registered.');
          setLoading(false);
          return;
        }
        console.log('Hashing password');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);
        console.log('Adding new user to database');
        const tx = db.transaction('users', 'readwrite');
        await tx.objectStore('users').add({ email, password: hashedPassword });
        await tx.done;
        console.log('User added, calling onSignIn');
        await onSignIn(email);
        setEmail('');
        setPassword('');
        navigate('/'); // Navigate to SurveyApp
      } else {
        console.log('Fetching user for sign-in');
        const user = await db.transaction('users').objectStore('users').get(email);
        console.log('Fetched user:', user);
        if (!user) {
          console.log('User not found:', email);
          setError('User not found.');
          setLoading(false);
          return;
        }
        console.log('Verifying password');
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid);
        if (!isValid) {
          console.log('Invalid password for:', email);
          setError('Invalid password.');
          setLoading(false);
          return;
        }
        console.log('Calling onSignIn');
        await onSignIn(email);
        setEmail('');
        setPassword('');
        navigate('/'); // Navigate to SurveyApp
      }
      setLoading(false);
    } catch (error) {
      console.error(`${isSignUp ? 'Sign-up' : 'Sign-in'} error:`, error.name, error.message);
      setError(`Failed to ${isSignUp ? 'sign up' : 'sign in'}. ${error.message}`);
      setLoading(false);
    }
  };

  // Rest of the component remains unchanged
  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <button
        className="toggle-btn"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError('');
          setEmail('');
          setPassword('');
        }}
        disabled={loading}
      >
        {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
      </button>
    </div>
  );
}

export default AuthPage;
