import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Subject, Level } from '../types/ServiceTypes';


// Funksjon for å validere input (kun tillate bokstaver, tall og mellomrom)
const isValidInput = (input: string) => /^[a-zA-Z0-9æøåÆØÅ\s]*$/.test(input);

const SubjectsByField: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>(); // Henter fieldId fra URL
  const [subjects, setSubjects] = useState<Subject[]>([]); // Tilstand for emner
  const [fieldName, setFieldName] = useState<string>(''); // Tilstand for å lagre navn på fagområde
  const [newSubjectId, setNewSubjectId] = useState(''); // Tilstand for ny fagkode
  const [newSubjectName, setNewSubjectName] = useState(''); // Tilstand for nytt emnenavn
  const [newSubjectLevel, setNewSubjectLevel] = useState<number | null>(null); // Tilstand for valgt nivå
  const [levels, setLevels] = useState<Level[]>([]); // Tilstand for nivåer
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null); // Tilstand for valgt nivå
  const [errorMessage, setErrorMessage] = useState(''); // Tilstand for feilmeldinger
  const [subjectCounts, setSubjectCounts] = useState<{ levelId: number; count: number }[]>([]); // Tilstand for emneteller
  const [totalSubjectsCount, setTotalSubjectsCount] = useState<number>(0); // Tilstand for totalt antall emner
  const [newSubjectDescription, setNewSubjectDescription] = useState(''); // Tilstand for emnebeskrivelse

  // Henter nivåer én gang når komponenten lastes
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await fetch(`/api/levels`); // Henter nivåer fra API
        if (!response.ok) throw new Error('Failed to fetch levels');
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error('Failed to fetch levels:', error); // Håndterer feil ved henting
      }
    };
    fetchLevels();
  }, []);

  // Henter emneteller etter nivå fra API
  const fetchSubjectCounts = useCallback(async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/subject-counts`);
      if (!response.ok) throw new Error('Failed to fetch subject counts');
      const data = await response.json();
      setSubjectCounts(data.filter((item: { levelId: number | null }) => item.levelId !== null));
    } catch (error) {
      console.error('Error fetching subject counts:', error); // Håndterer feil ved henting av teller
    }
  }, [fieldId]);

  // Henter totalt antall emner fra API
  const fetchTotalSubjectsCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/fields/${fieldId}/total-subjects-count`);
      if (!response.ok) throw new Error('Failed to fetch total subjects count');
      const data = await response.json();
      setTotalSubjectsCount(data.total);
    } catch (error) {
      console.error('Error fetching total subjects count:', error); // Håndterer feil ved henting av totalt antall
    }
  }, [fieldId]);

  // Kall funksjonene for å hente emneteller og totalt antall når fieldId endres
  useEffect(() => {
    fetchSubjectCounts();
    fetchTotalSubjectsCount();
  }, [fetchSubjectCounts, fetchTotalSubjectsCount]);

  // Henter navn på fagområde basert på fieldId
  useEffect(() => {
    const fetchFieldName = async () => {
      try {
        const response = await fetch(`/api/fields/${fieldId}/name`);
        if (!response.ok) throw new Error('Failed to fetch field name');
        const field = await response.json();
        setFieldName(field.name); // Setter fagområde-navn
      } catch (error) {
        console.error('Failed to fetch field name:', error); // Håndterer feil ved henting av fagområde
      }
    };
    fetchFieldName();
  }, [fieldId]);

  // Henter emner basert på valgt nivå eller alle emner hvis ingen nivå er valgt
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const url = selectedLevel
          ? `/api/fields/${fieldId}/subjects?levelId=${selectedLevel}` // Hvis nivå er valgt, hent nivå-spesifikke emner
          : `/api/fields/${fieldId}/subjects`; // Hvis ingen nivå er valgt, hent alle emner
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        setSubjects(data); // Setter emner i state
      } catch (error) {
        console.error('Failed to fetch subjects:', error); // Håndterer feil ved henting av emner
      }
    };
    fetchSubjects();
  }, [fieldId, selectedLevel]);

  // Håndterer oppretting av nytt emne
  const handleAddSubject = async () => {
    if (!newSubjectId || !newSubjectName || !newSubjectLevel || !newSubjectDescription) {
      setErrorMessage('ID, navn, nivå eller beskrivelse mangler'); // Sjekker at alle felt er utfylt
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("User ID is missing from local storage. Can't create version.");
      setErrorMessage('User ID is missing. Please log in again.');
      return; // Sjekker om bruker er logget inn
    }

    try {
      // Formaterer fagkode og emnenavn før innsending
      const formattedSubjectId = newSubjectId.toUpperCase();
      const formattedSubjectName =
        newSubjectName.charAt(0).toUpperCase() + newSubjectName.slice(1).toLowerCase();

      const response = await fetch(`/api/fields/${fieldId}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formattedSubjectId,
          name: formattedSubjectName,
          level: newSubjectLevel,
          description: newSubjectDescription, // Sender beskrivelse til backend
        }),
      });

      if (response.ok) {
        const newSubject = await response.json();
        const versionResponse = await fetch(`/api/fields/${fieldId}/version`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, description: newSubjectDescription }), // Oppretter versjon for emnet
        });

        if (!versionResponse.ok) {
          console.error('Failed to create version for the subject');
          setErrorMessage('Kunne ikke opprette versjon');
          return;
        }

        console.log('Version created successfully');

        // Oppdaterer emnelisten og teller etter emnet er lagt til
        if (newSubjectLevel === selectedLevel || selectedLevel === null) {
          setSubjects([{ ...newSubject, description: newSubjectDescription }, ...subjects]);
        }

        // Oppdaterer emneteller og totalt antall emner
        fetchSubjectCounts();
        fetchTotalSubjectsCount();

        // Tilbakestiller inputfeltene etter emnet er lagt til
        setNewSubjectId('');
        setNewSubjectName('');
        setNewSubjectLevel(null);
        setNewSubjectDescription('');
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

  // Henter antall emner for valgt nivå
  const getCountForLevel = (levelId: number) => {
    const countObj = subjectCounts.find((count) => count.levelId === levelId);
    return countObj ? countObj.count : 0;
  };

  const selectedLevelName = selectedLevel
    ? levels.find((level) => level.id === selectedLevel)?.name
    : 'Alle nivåer'; // Vist valgt nivå

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Første kolonne for å legge til nytt emne */}
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
          placeholder="Fagkode"
          value={newSubjectId}
          onChange={(e) => {
            const input = e.target.value;
            setNewSubjectId(input);
            if (!isValidInput(input)) {
              setErrorMessage('Fagkode kan kun inneholde bokstaver, tall og mellomrom.');
            } else {
              setErrorMessage('');
            }
          }}
          style={{ marginBottom: '10px' }}
        />

        <input
          type="text"
          placeholder="Emnenavn"
          value={newSubjectName}
          onChange={(e) => {
            const input = e.target.value;
            setNewSubjectName(input);
            if (!isValidInput(input)) {
              setErrorMessage('Emnenavn kan kun inneholde bokstaver, tall og mellomrom.');
            } else {
              setErrorMessage('');
            }
          }}
          style={{ marginBottom: '10px' }}
        />

        <textarea
          placeholder="Emnebeskrivelse"
          value={newSubjectDescription}
          onChange={(e) => setNewSubjectDescription(e.target.value)}
          style={{ marginBottom: '10px', minHeight: '60px' }}
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

      {/* Andre kolonne for å vise emner */}
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
