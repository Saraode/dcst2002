import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Subject = {
  id: string;
  name: string;
};

type Field = {
  id: number;
  name: string;
};

const SubjectsByField: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fieldName, setFieldName] = useState<string>('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Feilmelding for brukeren

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
        const response = await fetch(`/api/fields/${fieldId}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        setSubjects(data); // Setter emner direkte
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, [fieldId]);

  const handleAddSubject = async () => {
    if (!newSubjectId || !newSubjectName) {
      console.error('ID or name missing.');
      return;
    }

    try {
      const response = await fetch(`/api/fields/${fieldId}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: newSubjectId, name: newSubjectName }),
      });

      if (response.ok) {
        const newSubject = await response.json();
        setSubjects([newSubject, ...subjects]); // Legger til nyeste emne øverst
        setNewSubjectId('');
        setNewSubjectName('');
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

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: '1', border: '1px solid #ccc', padding: '10px', display: 'flex', flexDirection: 'column' }}>
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
        <button onClick={handleAddSubject}>Legg til</button>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>

      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Emner i {fieldName}</h2>
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
