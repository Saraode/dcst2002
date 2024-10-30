// client/components/FieldDropdown.tsx

// client/components/FieldDropdown.tsx

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

// Definer typen for Field
type Field = {
  id: number;
  name: string;
};

const FieldDropdown: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<number | ''>('');
  const history = useHistory();
  const { campus } = useParams<{ campus: string }>(); // Henter campus-navn fra URL

  useEffect(() => {
    const fetchFields = async () => {
      try {
        // Legger til campus-navnet i API-forespørselen for å filtrere på campus
        const response = await fetch(`/api/campus/${encodeURIComponent(campus)}/fields`);
        const data = await response.json();
        setFields(data); // Setter fagområder i dropdown-listen
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      }
    };

    fetchFields();
  }, [campus]);

  // Når et field velges, naviger til /fields/:fieldId/subjects
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = Number(event.target.value);
    setSelectedField(fieldId);
    history.push(`/fields/${fieldId}/subjects`);
  };

  return (
    <div>
      <label>Velg et fagområde:</label>
      <select value={selectedField} onChange={handleSelectChange}>
        <option value="">--Velg fagområde--</option>
        {fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FieldDropdown;
