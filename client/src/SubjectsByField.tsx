import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SubjectNewWithRouter } from './subject-components';

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
  const [totalSubjectsCount, setTotalSubjectsCount] = useState<number>(0);

  // Hent nivåer én gang ved lasting av komponenten
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

  // Hent antall emner per nivå fra databasen
  const fetchSubjectCounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/subject-counts`);
      if (!response.ok) throw new Error('Failed to fetch subject counts');
      const data = await response.json();
      setSubjectCounts(data.filter((item: { levelId: number | null }) => item.levelId !== null));
    } catch (error) {
      console.error('Error fetching subject counts:', error);
    }
  }, [fieldId]);

  // Hent totalantall emner direkte fra databasen
  const fetchTotalSubjectsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/total-subjects-count`);
      if (!response.ok) throw new Error('Failed to fetch total subjects count');
      const data = await response.json();
      setTotalSubjectsCount(data.total);
    } catch (error) {
      console.error('Error fetching total subjects count:', error);
    }
  }, [fieldId]);

  // Kall `fetchSubjectCounts` og `fetchTotalSubjectsCount` kun når `fieldId` endres
  useEffect(() => {
    fetchSubjectCounts();
    fetchTotalSubjectsCount();
  }, [fetchSubjectCounts, fetchTotalSubjectsCount]);

  // Hent fagfeltets navn basert på `fieldId`
  useEffect(() => {
    const fetchFieldName = async () => {
      try {
        const response = await fetch(`/api/fields/${fieldId}/name`);
        if (!response.ok) throw new Error('Failed to fetch field name');
        const field = await response.json();
        setFieldName(field.name);
      } catch (error) {
        console.error('Failed to fetch field name:', error);
      }
    };
    fetchFieldName();
  }, [fieldId]);

  // Hent emnelisten basert på nivåvalg (`selectedLevel`) eller alle emner hvis ingen nivå er valgt
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

  // Legg til nytt emne og oppdater tellingene fra databasen
  const handleAddSubject = async () => {
    console.log('håper det funker');

    if (!newSubjectId || !newSubjectName || !newSubjectLevel) {
      setErrorMessage('ID, navn eller nivå mangler');
      return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("User ID is missing from local storage. Can't create version.");
      setErrorMessage('User ID is missing. Please log in again.');
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
        const versionResponse = await fetch(`/api/fields/${fieldId}/version`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }), // Pass userId for versioning
        });

        if (!versionResponse.ok) {
          console.error('Failed to create version for the subject');
          setErrorMessage('Kunne ikke opprette versjon');
          return;
        }

        console.log('Version created successfully');

        // Oppdater emnelisten hvis det nye emnet samsvarer med valgt nivå eller hvis alle nivåer vises
        if (newSubjectLevel === selectedLevel || selectedLevel === null) {
          setSubjects([newSubject, ...subjects]);
        }

        // Oppdater nivåbasert antall og totalantall fra databasen
        fetchSubjectCounts();
        fetchTotalSubjectsCount();

        setNewSubjectId('');
        setNewSubjectName('');
        setNewSubjectLevel(null);
        setErrorMessage('');
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

  // Få antall emner for et gitt nivå
  const getCountForLevel = (levelId: number) => {
    const countObj = subjectCounts.find((count) => count.levelId === levelId);
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
          <button onClick={() => setSelectedLevel(null)}>Alle emner ({totalSubjectsCount})</button>
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
