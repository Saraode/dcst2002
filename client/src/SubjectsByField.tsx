import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Subject = {
  id: string;
  name: string;
  levelId: number;
};

type Level = {
  id: number;
  name: string;
};

const SubjectsByField: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fieldName, setFieldName] = useState<string>('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectLevel, setNewSubjectLevel] = useState<number | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [subjectCounts, setSubjectCounts] = useState<{ levelId: number; count: number }[]>([]);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await fetch(`/api/levels`);
        if (!response.ok) throw new Error('Failed to fetch levels');
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error('Failed to fetch levels:', error);
      }
    };
    fetchLevels();
  }, []);

  const fetchSubjectCounts = async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/subject-counts`);
      if (!response.ok) throw new Error('Failed to fetch subject counts');
      const data = await response.json();
      setSubjectCounts(data);
    } catch (error) {
      console.error('Error fetching subject counts by level:', error);
    }
  };

  useEffect(() => {
    fetchSubjectCounts();
  }, [fieldId]);

  useEffect(() => {
    const fetchFieldName = async () => {
      try {
        const response = await fetch(`/api/fields/${fieldId}`);
        if (!response.ok) throw new Error('Failed to fetch field name');
        const field = await response.json();
        setFieldName(field.name);
      } catch (error) {
        console.error('Failed to fetch field name:', error);
      }
    };
    fetchFieldName();
  }, [fieldId]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const url = selectedLevel
          ? `/api/fields/${fieldId}/subjects?levelId=${selectedLevel}`
          : `/api/fields/${fieldId}/subjects`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, [fieldId, selectedLevel]);

  const handleAddSubject = async () => {
    if (!newSubjectId || !newSubjectName || !newSubjectLevel) {
      setErrorMessage('ID, navn eller nivå mangler');
      return;
    }

    try {
      const response = await fetch(`/api/fields/${fieldId}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newSubjectId,
          name: newSubjectName,
          level: newSubjectLevel,
        }),
      });

      if (response.ok) {
        const newSubject = await response.json();

        if (newSubjectLevel === selectedLevel || selectedLevel === null) {
          setSubjects([newSubject, ...subjects]);
        }

        setNewSubjectId('');
        setNewSubjectName('');
        setNewSubjectLevel(null);
        setErrorMessage('');
        fetchSubjectCounts();
      } else if (response.status === 409) {
        setErrorMessage('Emnet er allerede lagt til.');
      } else {
        const errorData = await response.json();
        console.error('Failed to add subject:', errorData.error);
        setErrorMessage('Kunne ikke legge til emne');
      }
    } catch (error) {
      console.error('Failed to add subject:', error);
      setErrorMessage('Kunne ikke legge til emne');
    }
  };

  const getCountForLevel = (levelId: number) => {
    const countObj = subjectCounts.find(count => count.levelId === levelId);
    return countObj ? countObj.count : 0;
  };

  const selectedLevelName = selectedLevel
    ? levels.find((level) => level.id === selectedLevel)?.name
    : 'Alle nivåer';

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div
        style={{
          flex: '1',
          border: '1px solid #ccc',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2>Legg til nytt emne</h2>
        <input
          type="text"
          placeholder="Fagkode (ID)"
          value={newSubjectId}
          onChange={(e) => setNewSubjectId(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="Emnenavn"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          style={{ marginBottom: '10px' }}
        />

        {/* Radio-knapper for studienivå */}
        <div style={{ marginBottom: '10px' }}>
          <label>Studienivå:</label>
          {levels.map((level) => (
            <div key={level.id}>
              <input
                type="radio"
                id={`level-${level.id}`}
                name="subject-level"
                value={level.id}
                checked={newSubjectLevel === level.id}
                onChange={() => setNewSubjectLevel(level.id)}
              />
              <label htmlFor={`level-${level.id}`}>{level.name}</label>
            </div>
          ))}
        </div>

        <button onClick={handleAddSubject}>Legg til</button>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>

      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Emner i {fieldName}</h2>
        <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>
          Valgt nivå: {selectedLevelName}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setSelectedLevel(null)}>Alle nivåer</button>
          {levels.map((level) => (
            <button key={level.id} onClick={() => setSelectedLevel(level.id)}>
              {level.name} ({getCountForLevel(level.id)})
            </button>
          ))}
        </div>

        <ul>
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Link to={`/subjects/${subject.id}`}>{`${subject.id} ${subject.name}`}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubjectsByField;

