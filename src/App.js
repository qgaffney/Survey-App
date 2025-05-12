import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { openDB } from 'idb';
import AuthPage from './AuthPage';
import SurveyApp from './SurveyApp';
import SurveyResponsePage from './SurveyResponsePage';
import './App.css';

// Database setup with users, surveys, respondents, questions, surveyRespondents, surveyQuestions, and responses stores
const dbPromise = openDB('Survey-AppDB', 5, {
  upgrade(db, oldVersion, newVersion) {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'email' });
    }
    if (!db.objectStoreNames.contains('surveys')) {
      db.createObjectStore('surveys', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('respondents')) {
      db.createObjectStore('respondents', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('questions')) {
      db.createObjectStore('questions', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('surveyRespondents')) {
      db.createObjectStore('surveyRespondents', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('surveyQuestions')) {
      db.createObjectStore('surveyQuestions', { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('responses')) {
      const responsesStore = db.createObjectStore('responses', { keyPath: 'id', autoIncrement: true });
      // Create index on the responses store
      responsesStore.createIndex('bySurveyQuestionRespondent', ['surveyId', 'questionId', 'respondentId'], {
        unique: true,
      });
    }
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        const db = await dbPromise;
        console.log('Database initialized with stores:', Array.from(db.objectStoreNames));
        setDbReady(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          console.log('Restoring user from localStorage:', storedUser);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initializeDb();
  }, []);

  useEffect(() => {
    console.log('User state changed:', user);
  }, [user]);

  const handleSignIn = async (email) => {
    console.log('handleSignIn called with email:', email);
    try {
      setUser({ email });
      localStorage.setItem('user', JSON.stringify({ email }));
      console.log('User set and stored in localStorage:', email);
    } catch (error) {
      console.error('Error in handleSignIn:', error);
    }
  };

  const handleSignOut = () => {
    console.log('Signing out user');
    setUser(null);
    localStorage.removeItem('user');
  };

  console.log('Rendering App, user:', user, 'dbReady:', dbReady);

  if (!dbReady) return <div>Loading database...</div>;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/auth"
            element={<AuthPage onSignIn={handleSignIn} dbPromise={dbPromise} />}
          />
          <Route
            path="/"
            element={
              user ? (
                <SurveyApp user={user} onSignOut={handleSignOut} dbPromise={dbPromise} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/responses"
            element={
              user ? (
                <SurveyResponsePage user={user} dbPromise={dbPromise} />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route path="*" element={<Navigate to={user ? '/' : '/auth'} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
