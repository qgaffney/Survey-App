import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SurveyResponsePage({ user, dbPromise }) {
  const [surveys, setSurveys] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [surveyRespondents, setSurveyRespondents] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [selectedRespondentId, setSelectedRespondentId] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [responseInputs, setResponseInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const db = await dbPromise;
        const tx = db.transaction(
          ['surveys', 'respondents', 'questions', 'surveyQuestions', 'surveyRespondents', 'responses'],
          'readonly'
        );
        const [surveysData, respondentsData, questionsData, surveyQuestionsData, surveyRespondentsData, responsesData] =
          await Promise.all([
            tx.objectStore('surveys').getAll(),
            tx.objectStore('respondents').getAll(),
            tx.objectStore('questions').getAll(),
            tx.objectStore('surveyQuestions').getAll(),
            tx.objectStore('surveyRespondents').getAll(),
            tx.objectStore('responses').getAll(),
          ]);
        setSurveys(surveysData);
        setRespondents(respondentsData);
        setQuestions(questionsData);
        setSurveyQuestions(surveyQuestionsData);
        setSurveyRespondents(surveyRespondentsData);
        setResponses(responsesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    loadData();
  }, [dbPromise]);

  // Get questions for the selected survey
  const getSurveyQuestions = () => {
    if (!selectedSurveyId) return [];
    return questions.filter(q =>
      surveyQuestions.some(sq => sq.surveyId === selectedSurveyId && sq.questionId === q.id)
    );
  };

  // Get respondents for the selected survey
  const getSurveyRespondents = () => {
    if (!selectedSurveyId) return [];
    return respondents.filter(r =>
      surveyRespondents.some(sr => sr.surveyId === selectedSurveyId && sr.respondentId === r.id)
    );
  };

  // Handle response input changes
  const handleResponseChange = (questionId, value) => {
    setResponseInputs(prev => ({ ...prev, [questionId]: value }));
  };

  // Submit responses for all questions in the selected survey
  const handleSubmitResponses = async (e) => {
    e.preventDefault();
    if (!selectedSurveyId || !selectedRespondentId) return;
    const db = await dbPromise;
    const tx = db.transaction('responses', 'readwrite');
    const store = tx.objectStore('responses');
    const surveyQuestions = getSurveyQuestions();
    try {
      for (const question of surveyQuestions) {
        const responseText = responseInputs[question.id] || '';
        if (responseText.trim()) {
          const existingResponse = responses.find(
            r =>
              r.surveyId === selectedSurveyId &&
              r.questionId === question.id &&
              r.respondentId === selectedRespondentId
          );
          if (existingResponse) {
            await store.put({
              ...existingResponse,
              response: responseText,
            });
          } else {
            const newResponse = {
              surveyId: selectedSurveyId,
              questionId: question.id,
              respondentId: selectedRespondentId,
              response: responseText,
            };
            const id = await store.add(newResponse);
            newResponse.id = id;
            setResponses(prev => [...prev, newResponse]);
          }
        }
      }
      await tx.done;
      setResponseInputs({});
      alert('Responses submitted successfully!');
    } catch (error) {
      console.error('Error submitting responses:', error);
      alert('Failed to submit responses.');
    }
  };

  // Get responses for the selected survey and question
  const getQuestionResponses = () => {
    if (!selectedSurveyId || !selectedQuestionId) return [];
    return responses.filter(
      r => r.surveyId === selectedSurveyId && r.questionId === selectedQuestionId
    );
  };

  if (loading) return <div>Loading data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="survey-response-page">
      <header className="survey-header">
        <h1>Survey Responses</h1>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button className="back-btn" onClick={() => navigate('/')}>
            Back to Surveys
          </button>
        </div>
      </header>

      <div className="side-by-side">
        {/* Submit Responses Section */}
        <section className="column">
          <h2>Submit Responses</h2>
          <div className="selector">
            <label>Select Survey:</label>
            <select
              value={selectedSurveyId || ''}
              onChange={e => {
                const value = e.target.value ? Number(e.target.value) : null;
                setSelectedSurveyId(value);
                setSelectedRespondentId(null);
                setResponseInputs({});
              }}
            >
              <option value="">-- Select Survey --</option>
              {surveys.map(survey => (
                <option key={survey.id} value={survey.id}>
                  {survey.name}
                </option>
              ))}
            </select>
          </div>
          {selectedSurveyId && (
            <div className="selector">
              <label>Select Respondent:</label>
              <select
                value={selectedRespondentId || ''}
                onChange={e => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setSelectedRespondentId(value);
                }}
              >
                <option value="">-- Select Respondent --</option>
                {getSurveyRespondents().map(respondent => (
                  <option key={respondent.id} value={respondent.id}>
                    {respondent.fullName} ({respondent.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedSurveyId && selectedRespondentId && (
            <form onSubmit={handleSubmitResponses}>
              {getSurveyQuestions().length === 0 ? (
                <p>No questions in this survey.</p>
              ) : (
                getSurveyQuestions().map(question => (
                  <div key={question.id} className="question-input">
                    <label>{question.text}</label>
                    <textarea
                      value={responseInputs[question.id] || ''}
                      onChange={e => handleResponseChange(question.id, e.target.value)}
                      placeholder="Enter your response"
                      rows="4"
                    />
                  </div>
                ))
              )}
              <button type="submit" disabled={!getSurveyQuestions().length}>
                Submit Responses
              </button>
            </form>
          )}
        </section>

        {/* View Responses Section */}
        <section className="column">
          <h2>View Responses</h2>
          <div className="selector">
            <label>Select Survey:</label>
            <select
              value={selectedSurveyId || ''}
              onChange={e => {
                const value = e.target.value ? Number(e.target.value) : null;
                setSelectedSurveyId(value);
                setSelectedQuestionId(null);
              }}
            >
              <option value="">-- Select Survey --</option>
              {surveys.map(survey => (
                <option key={survey.id} value={survey.id}>
                  {survey.name}
                </option>
              ))}
            </select>
          </div>
          {selectedSurveyId && (
            <div className="selector">
              <label>Select Question:</label>
              <select
                value={selectedQuestionId || ''}
                onChange={e => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setSelectedQuestionId(value);
                }}
              >
                <option value="">-- Select Question --</option>
                {getSurveyQuestions().map(question => (
                  <option key={question.id} value={question.id}>
                    {question.text}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedSurveyId && selectedQuestionId && (
            <div className="responses-view">
              <h3>
                Responses to: {questions.find(q => q.id === selectedQuestionId)?.text || 'Unknown Question'}
              </h3>
              {getQuestionResponses().length === 0 ? (
                <p>No responses for this question.</p>
              ) : (
                <ul>
                  {getQuestionResponses().map(response => {
                    const respondent = respondents.find(r => r.id === response.respondentId);
                    return (
                      <li key={response.id}>
                        <strong>
                          {respondent ? `${respondent.fullName} (${respondent.email})` : 'Unknown Respondent'}:
                        </strong>{' '}
                        {response.response}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SurveyResponsePage;
