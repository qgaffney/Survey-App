import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import './App.css';

const dbPromise = openDB('Survey-AppDB', 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

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
  },
});

function App() {
  const [surveys, setSurveys] = useState([]);
  const [surveyName, setSurveyName] = useState('');
  const [respondents, setRespondents] = useState([]);
  const [respondentFullName, setRespondentFullName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [surveyRespondents, setSurveyRespondents] = useState([]);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        const db = await dbPromise;
        console.log('Database initialized:', db.objectStoreNames);
        setDbReady(true);
        const tx = db.transaction(['surveys', 'respondents', 'questions', 'surveyRespondents', 'surveyQuestions'], 'readonly');
        setSurveys(await tx.objectStore('surveys').getAll());
        setRespondents(await tx.objectStore('respondents').getAll());
        setQuestions(await tx.objectStore('questions').getAll());
        setSurveyRespondents(await tx.objectStore('surveyRespondents').getAll());
        setSurveyQuestions(await tx.objectStore('surveyQuestions').getAll());
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initializeDb();
  }, []);

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!surveyName.trim() || !dbReady) return;
    const newSurvey = { id: Date.now(), name: surveyName };
    const db = await dbPromise;
    const tx = db.transaction('surveys', 'readwrite');
    await tx.objectStore('surveys').add(newSurvey);
    setSurveys([...surveys, newSurvey]);
    setSurveyName('');
  };

  const handleDeleteSurvey = async (id) => {
    if (!dbReady) return;
    const db = await dbPromise;
    const tx = db.transaction(['surveys', 'surveyRespondents', 'surveyQuestions'], 'readwrite');
    await tx.objectStore('surveys').delete(id);
    const surveyRespondentsStore = tx.objectStore('surveyRespondents');
    const surveyQuestionsStore = tx.objectStore('surveyQuestions');
    const srToDelete = surveyRespondents.filter(sr => sr.surveyId === id);
    const sqToDelete = surveyQuestions.filter(sq => sq.surveyId === id);
    await Promise.all(srToDelete.map(sr => surveyRespondentsStore.delete(sr.id)));
    await Promise.all(sqToDelete.map(sq => surveyQuestionsStore.delete(sq.id)));
    setSurveys(surveys.filter(s => s.id !== id));
    setSurveyRespondents(surveyRespondents.filter(sr => sr.surveyId !== id));
    setSurveyQuestions(surveyQuestions.filter(sq => sq.surveyId !== id));
    if (selectedSurveyId === id) setSelectedSurveyId(null);
  };

  const handleCreateRespondent = async (e) => {
    e.preventDefault();
    if (!respondentFullName.trim() || !respondentEmail.trim() || !dbReady) return;
    const newRespondent = { id: Date.now(), fullName: respondentFullName, email: respondentEmail };
    const db = await dbPromise;
    const tx = db.transaction('respondents', 'readwrite');
    await tx.objectStore('respondents').add(newRespondent);
    setRespondents([...respondents, newRespondent]);
    setRespondentFullName('');
    setRespondentEmail('');
  };

  const handleDeleteRespondent = async (id) => {
    if (!dbReady) return;
    const db = await dbPromise;
    const tx = db.transaction(['respondents', 'surveyRespondents'], 'readwrite');
    await tx.objectStore('respondents').delete(id);
    const surveyRespondentsStore = tx.objectStore('surveyRespondents');
    const srToDelete = surveyRespondents.filter(sr => sr.respondentId === id);
    await Promise.all(srToDelete.map(sr => surveyRespondentsStore.delete(sr.id)));
    setRespondents(respondents.filter(r => r.id !== id));
    setSurveyRespondents(surveyRespondents.filter(sr => sr.respondentId !== id));
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !dbReady) return;
    const newQuestion = { id: Date.now(), text: questionText };
    const db = await dbPromise;
    const tx = db.transaction('questions', 'readwrite');
    await tx.objectStore('questions').add(newQuestion);
    setQuestions([...questions, newQuestion]);
    setQuestionText('');
  };

  const handleDeleteQuestion = async (id) => {
    if (!dbReady) return;
    const db = await dbPromise;
    const tx = db.transaction(['questions', 'surveyQuestions'], 'readwrite');
    await tx.objectStore('questions').delete(id);
    const surveyQuestionsStore = tx.objectStore('surveyQuestions');
    const sqToDelete = surveyQuestions.filter(sq => sq.questionId === id);
    await Promise.all(sqToDelete.map(sq => surveyQuestionsStore.delete(sq.id)));
    setQuestions(questions.filter(q => q.id !== id));
    setSurveyQuestions(surveyQuestions.filter(sq => sq.questionId !== id));
  };

  const handleAssociateRespondent = async (surveyId, respondentId) => {
    if (!dbReady || surveyRespondents.some(sr => sr.surveyId === surveyId && sr.respondentId === respondentId)) return;
    const db = await dbPromise;
    const newAssociation = { surveyId, respondentId };
    const tx = db.transaction('surveyRespondents', 'readwrite');
    const id = await tx.objectStore('surveyRespondents').add(newAssociation);
    setSurveyRespondents([...surveyRespondents, { id, surveyId, respondentId }]);
  };

  const handleAssociateQuestion = async (surveyId, questionId) => {
    if (!dbReady || surveyQuestions.some(sq => sq.surveyId === surveyId && sq.questionId === questionId)) return;
    const db = await dbPromise;
    const newAssociation = { surveyId, questionId };
    const tx = db.transaction('surveyQuestions', 'readwrite');
    const id = await tx.objectStore('surveyQuestions').add(newAssociation);
    setSurveyQuestions([...surveyQuestions, { id, surveyId, questionId }]);
  };

  const getSurveyRespondents = () => {
    if (!selectedSurveyId) return [];
    return respondents.filter(r => 
      surveyRespondents.some(sr => sr.surveyId === selectedSurveyId && sr.respondentId === r.id)
    );
  };

  const getSurveyQuestions = () => {
    if (!selectedSurveyId) return [];
    return questions.filter(q => 
      surveyQuestions.some(sq => sq.surveyId === selectedSurveyId && sq.questionId === q.id)
    );
  };

  if (!dbReady) return <div>Loading database...</div>;

  return (
    <div className="App">
      <h1>Survey Manager</h1>
      <div className="side-by-side">
        <section className="column">
          <h2>Surveys</h2>
          <form onSubmit={handleCreateSurvey}>
            <input value={surveyName} onChange={(e) => setSurveyName(e.target.value)} placeholder="Enter survey name" />
            <button type="submit">Create</button>
          </form>
          {surveys.length === 0 ? (
            <p>No surveys yet.</p>
          ) : (
            <ul>
              {surveys.map(survey => (
                <li key={survey.id}>
                  {survey.name}
                  <button onClick={() => handleDeleteSurvey(survey.id)}>Delete</button>
                  <button onClick={() => setSelectedSurveyId(survey.id)}>View</button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="column">
          <h2>Respondents</h2>
          <form onSubmit={handleCreateRespondent}>
            <input value={respondentFullName} onChange={(e) => setRespondentFullName(e.target.value)} placeholder="Full name" />
            <input type="email" value={respondentEmail} onChange={(e) => setRespondentEmail(e.target.value)} placeholder="Email" />
            <button type="submit">Create</button>
          </form>
          {respondents.length === 0 ? (
            <p>No respondents yet.</p>
          ) : (
            <ul>
              {respondents.map(respondent => (
                <li key={respondent.id}>
                  {respondent.fullName} ({respondent.email})
                  <button onClick={() => handleDeleteRespondent(respondent.id)}>Delete</button>
                  {selectedSurveyId && (
                    <button onClick={() => handleAssociateRespondent(selectedSurveyId, respondent.id)}>Add</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="column">
          <h2>Questions</h2>
          <form onSubmit={handleCreateQuestion}>
            <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Enter question text" />
            <button type="submit">Create</button>
          </form>
          {questions.length === 0 ? (
            <p>No questions yet.</p>
          ) : (
            <ul>
              {questions.map(question => (
                <li key={question.id}>
                  {question.text}
                  <button onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
                  {selectedSurveyId && (
                    <button onClick={() => handleAssociateQuestion(selectedSurveyId, question.id)}>Add</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      
      {selectedSurveyId && (
        <section className="details">
          <h2>Selected Survey: {surveys.find(s => s.id === selectedSurveyId)?.name}</h2>
          <div className="side-by-side">
            <div className="column">
              <h3>Respondents</h3>
              {getSurveyRespondents().length === 0 ? (
                <p>No respondents assigned.</p>
              ) : (
                <ul>
                  {getSurveyRespondents().map(r => (
                    <li key={r.id}>{r.fullName} ({r.email})</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="column">
              <h3>Questions</h3>
              {getSurveyQuestions().length === 0 ? (
                <p>No questions assigned.</p>
              ) : (
                <ul>
                  {getSurveyQuestions().map(q => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button onClick={() => setSelectedSurveyId(null)}>Close</button>
        </section>
      )}
    </div>
  );
}

export default App;
