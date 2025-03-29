import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';
import './App.css';

const dbPromise = openDB('SurveyManagerDB', 1, {
  upgrade(db) {
    db.createObjectStore('surveys', { keyPath: 'id' });
    db.createObjectStore('respondents', { keyPath: 'id' });
    db.createObjectStore('questions', { keyPath: 'id' });
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

  useEffect(() => {
    const loadData = async () => {
      const db = await dbPromise;
      const tx = db.transaction(['surveys', 'respondents', 'questions'], 'readonly');
      const surveyStore = tx.objectStore('surveys');
      const respondentStore = tx.objectStore('respondents');
      const questionStore = tx.objectStore('questions');

      const allSurveys = await surveyStore.getAll();
      const allRespondents = await respondentStore.getAll();
      const allQuestions = await questionStore.getAll();

      setSurveys(allSurveys);
      setRespondents(allRespondents);
      setQuestions(allQuestions);
    };
    loadData();
  }, []);

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!surveyName.trim()) return;
    const newSurvey = { id: Date.now(), name: surveyName };
    const db = await dbPromise;
    const tx = db.transaction('surveys', 'readwrite');
    await tx.store.add(newSurvey);
    setSurveys([...surveys, newSurvey]);
    setSurveyName('');
  };

  const handleDeleteSurvey = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction('surveys', 'readwrite');
    await tx.store.delete(id);
    setSurveys(surveys.filter(survey => survey.id !== id));
  };

  const handleCreateRespondent = async (e) => {
    e.preventDefault();
    if (!respondentFullName.trim() || !respondentEmail.trim()) return;
    const newRespondent = { id: Date.now(), fullName: respondentFullName, email: respondentEmail };
    const db = await dbPromise;
    const tx = db.transaction('respondents', 'readwrite');
    await tx.store.add(newRespondent);
    setRespondents([...respondents, newRespondent]);
    setRespondentFullName('');
    setRespondentEmail('');
  };

  const handleDeleteRespondent = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction('respondents', 'readwrite');
    await tx.store.delete(id);
    setRespondents(respondents.filter(respondent => respondent.id !== id));
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    const newQuestion = { id: Date.now(), text: questionText };
    const db = await dbPromise;
    const tx = db.transaction('questions', 'readwrite');
    await tx.store.add(newQuestion);
    setQuestions([...questions, newQuestion]);
    setQuestionText('');
  };

  const handleDeleteQuestion = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction('questions', 'readwrite');
    await tx.store.delete(id);
    setQuestions(questions.filter(question => question.id !== id));
  };

  return (
    <div className="App">
      <h1>Survey Manager</h1>
      <section>
        <h2>Create Survey</h2>
        <form onSubmit={handleCreateSurvey}>
          <input
            type="text"
            value={surveyName}
            onChange={(e) => setSurveyName(e.target.value)}
            placeholder="Enter survey name"
          />
          <button type="submit">Create Survey</button>
        </form>
        <h3>Surveys</h3>
        {surveys.length === 0 ? (
          <p>No surveys yet.</p>
        ) : (
          <ul>
            {surveys.map(survey => (
              <li key={survey.id}>
                {survey.name}
                <button onClick={() => handleDeleteSurvey(survey.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Create Respondent</h2>
        <form onSubmit={handleCreateRespondent}>
          <input
            type="text"
            value={respondentFullName}
            onChange={(e) => setRespondentFullName(e.target.value)}
            placeholder="Enter full name"
          />
          <input
            type="email"
            value={respondentEmail}
            onChange={(e) => setRespondentEmail(e.target.value)}
            placeholder="Enter email"
          />
          <button type="submit">Create Respondent</button>
        </form>
        <h3>Respondents</h3>
        {respondents.length === 0 ? (
          <p>No respondents yet.</p>
        ) : (
          <ul>
            {respondents.map(respondent => (
              <li key={respondent.id}>
                {respondent.fullName} ({respondent.email})
                <button onClick={() => handleDeleteRespondent(respondent.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Create Question</h2>
        <form onSubmit={handleCreateQuestion}>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter question text"
          />
          <button type="submit">Create Question</button>
        </form>
        <h3>Questions</h3>
        {questions.length === 0 ? (
          <p>No questions yet.</p>
        ) : (
          <ul>
            {questions.map(question => (
              <li key={question.id}>
                {question.text}
                <button onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
