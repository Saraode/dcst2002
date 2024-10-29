// client/SubjectsByField.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Definer typer for Subject og Field
type Subject = {
  id: number;
  name: string;
};

type Field = {
  id: number;
  name: string;
};

const SubjectsByField: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>(); // Henter fieldId fra URL
  const [subjects, setSubjects] = useState<Subject[]>([]); // Lagrer subjects
  const [fieldName, setFieldName] = useState<string>(''); // Lagrer navnet på field
  const [newSubjectName, setNewSubjectName] = useState(''); // Navn på nytt subject

  // Henter field-navnet fra backend
  useEffect(() => {
    const fetchFieldName = async () => {
      try {
        const response = await fetch(`/api/fields/${fieldId}`);
        if (!response.ok) throw new Error('Failed to fetch field name');
        
        const field = await response.json();
        setFieldName(field.name); // Oppdaterer field-navnet
      } catch (error) {
        console.error('Failed to fetch field name:', error);
      }
    };
    fetchFieldName();
  }, [fieldId]);

  // Henter subjects fra backend når fieldId endres
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`/api/fields/${fieldId}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        
        const data = await response.json();
        setSubjects(data); // Oppdaterer subjects-listen med data fra databasen
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, [fieldId]);

  // Funksjon for å legge til nytt subject
  // Funksjon for å legge til nytt subject
const handleAddSubject = async () => {
  if (!newSubjectName) {
    console.error('Subject name is missing.');
    return;
  }

  try {
    const response = await fetch(`/api/fields/${fieldId}/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newSubjectName }), // Sender inn navn på nytt emne
    });

    if (response.ok) {
      const newSubject = await response.json();
      setSubjects([...subjects, newSubject]); // Legger til det nye subjectet i listen
      setNewSubjectName(''); // Tømmer inputfeltet
      console.log('Subject added successfully:', newSubject);
    } else {
      console.error('Failed to add subject:', await response.json());
    }
  } catch (error) {
    console.error('Failed to add subject:', error);
  }
};

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Boks for å legge til nytt subject */}
      <div style={{ flex: '1', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Legg til nytt emne</h2>
        <input
          type="text"
          placeholder="Emnekode"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        <button onClick={handleAddSubject}>Legg til</button>
      </div>

      {/* Liste over subjects */}
      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Emner i {fieldName}</h2> {/* Viser navnet på fagområdet */}
        <ul>
          {subjects.map((subject) => (
            <li key={subject.id}>{subject.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubjectsByField;



