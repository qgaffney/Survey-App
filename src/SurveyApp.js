import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SurveyApp({ user, onSignOut, dbPromise }) {
  const [surveys, setSurveys] = useState([]);
  const [surveyName, setSurveyName] = useState('');
  const [respondents, setRespondents] = useState([]);
  const [respondentFullName, setRespondentFullName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [surveyRespondents, setSurveyRespondents] = useState([]);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [responses, setResponses] = useState([]); // Add responses state
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [editSurvey, setEditSurvey] = useState(null);
  const [editRespondent, setEditRespondent] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const navigate = useNavigate();

  // Load data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await dbPromise;
        const tx = db.transaction(
          ['surveys', 'respondents', 'questions', 'surveyRespondents', 'surveyQuestions', 'responses'],
          'readonly'
        );
        const [
          surveysData,
          respondentsData,
          questionsData,
          surveyRespondentsData,
          surveyQuestionsData,
          responsesData,
        ] = await Promise.all([
          tx.objectStore('surveys').getAll(),
          tx.objectStore('respondents').getAll(),
          tx.objectStore('questions').getAll(),
          tx.objectStore('surveyRespondents').getAll(),
          tx.objectStore('surveyQuestions').getAll(),
          tx.objectStore('responses').getAll(),
        ]);
        setSurveys(surveysData);
        setRespondents(respondentsData);
        setQuestions(questionsData);
        setSurveyRespondents(surveyRespondentsData);
        setSurveyQuestions(surveyQuestionsData);
        setResponses(responsesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [dbPromise]);

  // Survey handlers
  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!surveyName.trim()) return;
    const newSurvey = { id: Date.now(), name: surveyName };
    const db = await dbPromise;
    const tx = db.transaction('surveys', 'readwrite');
    await tx.objectStore('surveys').add(newSurvey);
    setSurveyName('');
  };

  const handleEditSurvey = async (e) => {
    e.preventDefault();
    if (!editSurvey.name.trim()) return;
    const db = await dbPromise;
    const tx = db.transaction('surveys', 'readwrite');
    await tx.objectStore('surveys').put(editSurvey);
    setSurveys(surveys.map(s => (s.id === editSurvey.id ? editSurvey : s)));
    setEditSurvey(null);
  };

  const handleDeleteSurvey = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction(['surveys', 'surveyRespondents', 'surveyQuestions', 'responses'], 'readwrite');
    await tx.objectStore('surveys').delete(id);
    const surveyRespondentsStore = tx.objectStore('surveyRespondents');
    const surveyQuestionsStore = tx.objectStore('surveyQuestions');
    const responsesStore = tx.objectStore('responses');
    const srToDelete = surveyRespondents.filter(sr => sr.surveyId === id);
    const sqToDelete = surveyQuestions.filter(sq => sq.surveyId === id);
    const responsesToDelete = responses.filter(r => r.surveyId === id);
    await Promise.all(srToDelete.map(sr => surveyRespondentsStore.delete(sr.id)));
    await Promise.all(sqToDelete.map(sq => surveyQuestionsStore.delete(sq.id)));
    await Promise.all(responsesToDelete.map(r => responsesStore.delete(r.id)));
    setSurveys(surveys.filter(s => s.id !== id));
    setSurveyRespondents(surveyRespondents.filter(sr => sr.surveyId !== id));
    setSurveyQuestions(surveyQuestions.filter(sq => sq.surveyId !== id));
    setResponses(responses.filter(r => r.surveyId !== id));
    if (selectedSurveyId === id) setSelectedSurveyId(null);
  };

  // Respondent handlers
  const handleCreateRespondent = async (e) => {
    e.preventDefault();
    if (!respondentFullName.trim() || !respondentEmail.trim()) return;
    const newRespondent = { id: Date.now(), fullName: respondentFullName, email: respondentEmail };
    const db = await dbPromise;
    const tx = db.transaction('respondents', 'readwrite');
    await tx.objectStore('respondents').add(newRespondent);
    setRespondents([...respondents, newRespondent]);
    setRespondentFullName('');
    setRespondentEmail('');
  };

  const handleEditRespondent = async (e) => {
    e.preventDefault();
    if (!editRespondent.fullName.trim() || !editRespondent.email.trim()) return;
    const db = await dbPromise;
    const tx = db.transaction('respondents', 'readwrite');
    await tx.objectStore('respondents').put(editRespondent);
    setRespondents(respondents.map(r => (r.id === editRespondent.id ? editRespondent : r)));
    setEditRespondent(null);
  };

  const handleDeleteRespondent = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction(['respondents', 'surveyRespondents', 'responses'], 'readwrite');
    await tx.objectStore('respondents').delete(id);
    const surveyRespondentsStore = tx.objectStore('surveyRespondents');
    const responsesStore = tx.objectStore('responses');
    const srToDelete = surveyRespondents.filter(sr => sr.respondentId === id);
    const responsesToDelete = responses.filter(r => r.respondentId === id);
    await Promise.all(srToDelete.map(sr => surveyRespondentsStore.delete(sr.id)));
    await Promise.all(responsesToDelete.map(r => responsesStore.delete(r.id)));
    setRespondents(respondents.filter(r => r.id !== id));
    setSurveyRespondents(surveyRespondents.filter(sr => sr.respondentId !== id));
    setResponses(responses.filter(r => r.respondentId !== id));
  };

  // Question handlers
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    const newQuestion = { id: Date.now(), text: questionText };
    const db = await dbPromise;
    const tx = db.transaction('questions', 'readwrite');
    await tx.objectStore('questions').add(newQuestion);
    setQuestions([...questions, newQuestion]);
    setQuestionText('');
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    if (!editQuestion.text.trim()) return;
    const db = await dbPromise;
    const tx = db.transaction('questions', 'readwrite');
    await tx.objectStore('questions').put(editQuestion);
    setQuestions(questions.map(q => (q.id === editQuestion.id ? editQuestion : q)));
    setEditQuestion(null);
  };

  const handleDeleteQuestion = async (id) => {
    const db = await dbPromise;
    const tx = db.transaction(['questions', 'surveyQuestions', 'responses'], 'readwrite');
    await tx.objectStore('questions').delete(id);
    const surveyQuestionsStore = tx.objectStore('surveyQuestions');
    const responsesStore = tx.objectStore('responses');
    const sqToDelete = surveyQuestions.filter(sq => sq.questionId === id);
    const responsesToDelete = responses.filter(r => r.questionId === id);
    await Promise.all(sqToDelete.map(sq => surveyQuestionsStore.delete(sq.id)));
    await Promise.all(responsesToDelete.map(r => responsesStore.delete(r.id)));
    setQuestions(questions.filter(q => q.id !== id));
    setSurveyQuestions(surveyQuestions.filter(sq => sq.questionId !== id));
    setResponses(responses.filter(r => r.questionId !== id));
  };

  // Association handlers
  const handleAssociateRespondent = async (surveyId, respondentId) => {
    if (surveyRespondents.some(sr => sr.surveyId === surveyId && sr.respondentId === respondentId)) return;
    const db = await dbPromise;
    const newAssociation = { surveyId, respondentId };
    const tx = db.transaction('surveyRespondents', 'readwrite');
    const id = await tx.objectStore('surveyRespondents').add(newAssociation);
    setSurveyRespondents([...surveyRespondents, { id, surveyId, respondentId }]);
  };

  const handleAssociateQuestion = async (surveyId, questionId) => {
    if (surveyQuestions.some(sq => sq.surveyId === surveyId && sq.questionId === questionId)) return;
    const db = await dbPromise;
    const newAssociation = { surveyId, questionId };
    const tx = db.transaction('surveyQuestions', 'readwrite');
    const id = await tx.objectStore('surveyQuestions').add(newAssociation);
    setSurveyQuestions([...surveyQuestions, { id, surveyId, questionId }]);
  };

  // View helpers
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

  return (
    <div className="survey-app">
      <header className="survey-header">
        <h1>Survey Manager</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button className="signout-btn" onClick={() => {
            onSignOut();
            navigate('/auth');
          }}>
            Sign Out
          </button>
        </div>
      </header>
      <div className="side-by-side">
        {/* Survey Section */}
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
                  <button className="delete-btn" onClick={() => handleDeleteSurvey(survey.id)}>Delete</button>
                  <button className="edit-btn" onClick={() => setEditSurvey(survey)}>Edit</button>
                  <button className="view-btn" onClick={() => setSelectedSurveyId(survey.id)}>View</button>
                  <button className="responses-btn" onClick={() => navigate('/responses')}>
                    Manage Responses
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Respondent Section */}
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
                  <button className="delete-btn" onClick={() => handleDeleteRespondent(respondent.id)}>Delete</button>
                  <button className="edit-btn" onClick={() => setEditRespondent(respondent)}>Edit</button>
                  {selectedSurveyId && (
                    <button className="add-btn" onClick={() => handleAssociateRespondent(selectedSurveyId, respondent.id)}>Add</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Question Section */}
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
                  <button className="delete-btn" onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
                  <button className="edit-btn" onClick={() => setEditQuestion(question)}>Edit</button>
                  {selectedSurveyId && (
                    <button className="add-btn" onClick={() => handleAssociateQuestion(selectedSurveyId, question.id)}>Add</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Selected Survey Details */}
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
          <button className="close-btn" onClick={() => setSelectedSurveyId(null)}>Close</button>
        </section>
      )}

      {/* Edit Survey Modal */}
      {editSurvey && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Survey</h3>
            <form onSubmit={handleEditSurvey}>
              <input
                value={editSurvey.name}
                onChange={(e) => setEditSurvey({ ...editSurvey, name: e.target.value })}
                placeholder="Enter survey name"
              />
              <button type="submit">Save</button>
              <button type="button" className="cancel-btn" onClick={() => setEditSurvey(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Respondent Modal */}
      {editRespondent && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Respondent</h3>
            <form onSubmit={handleEditRespondent}>
              <input
                value={editRespondent.fullName}
                onChange={(e) => setEditRespondent({ ...editRespondent, fullName: e.target.value })}
                placeholder="Full name"
              />
              <input
                type="email"
                value={editRespondent.email}
                onChange={(e) => setEditRespondent({ ...editRespondent, email: e.target.value })}
                placeholder="Email"
              />
              <button type="submit">Save</button>
              <button type="button" className="cancel-btn" onClick={() => setEditRespondent(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editQuestion && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Question</h3>
            <form onSubmit={handleEditQuestion}>
              <input
                value={editQuestion.text}
                onChange={(e) => setEditQuestion({ ...editQuestion, text: e.target.value })}
                placeholder="Enter question text"
              />
              <button type="submit">Save</button>
              <button type="button" className="cancel-btn" onClick={() => setEditQuestion(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyApp;
