import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Field } from '../types/ServiceTypes'; // Importer typen for "Field" som vi bruker i komponenten

const FieldDropdown: React.FC = () => {
  // State for å lagre listen av fagområder (fields)
  const [fields, setFields] = useState<Field[]>([]);
  // State for å lagre valgt fagområde, starter med en tom verdi
  const [selectedField, setSelectedField] = useState<number | ''>('');
  
  const history = useHistory(); // Bruker `history` til å navigere til nye ruter
  const { campus } = useParams<{ campus: string }>(); // Henter campus fra URL-parameteren

  // useEffect som henter fagområder når campus-parameteren endres
  useEffect(() => {
    const fetchFields = async () => {
      if (campus) {
        try {
          // Hent fagområder for spesifisert campus fra API-et
          const response = await fetch(`/api/campus/${encodeURIComponent(campus)}/fields`);
          const data = await response.json();
          setFields(data); // Sett de hentede fagområdene i state
        } catch (error) {
          console.error('Failed to fetch fields:', error); // Logg feilen hvis API-kallet feiler
        }
      }
    };

    fetchFields(); // Kall funksjonen for å hente fagområder
  }, [campus]); // Bruk useEffect for å hente data på nytt hvis `campus` endres

  // Funksjon for å håndtere endringer i dropdownen
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = Number(event.target.value); // Hent valgt ID fra dropdown
    setSelectedField(fieldId); // Oppdater state med valgt fagområde
    history.push(`/fields/${fieldId}/subjects`); // Naviger til siden for de tilhørende fagene
  };

  return (
    <div style={{ margin: '20px' }}>
      {/* Etikettnavn for dropdown */}
      <label style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00509e' }}>
        Velg et fagområde på campus {campus}:
      </label>
      <div style={{ marginTop: '0.5rem' }}>
        {/* Dropdown for å velge fagområde */}
        <select
          value={selectedField}
          onChange={handleSelectChange} // Kall funksjonen ved endring
          style={{
            padding: '8px 12px',
            fontSize: '1rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
        >
          {/* Standard alternativ når ingen fagområde er valgt */}
          <option value="">--Velg fagområde--</option>
          {/* Iterer gjennom `fields` og legg til alternativene i dropdown */}
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FieldDropdown;
