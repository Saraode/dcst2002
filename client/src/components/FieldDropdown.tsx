// client/components/FieldDropdown.tsx

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Field } from '../types/ServiceTypes'


const FieldDropdown: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<number | ''>('');
  const history = useHistory();
  const { campus } = useParams<{ campus: string }>();

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch(`/api/campus/${encodeURIComponent(campus)}/fields`);
        const data = await response.json();
        setFields(data);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      }
    };

    fetchFields();
  }, [campus]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fieldId = Number(event.target.value);
    setSelectedField(fieldId);
    history.push(`/fields/${fieldId}/subjects`);
  };

  return (
    <div style={{ margin: '20px' }}>
      <label style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00509e' }}>
        Velg et fagområde på campus {campus}:
      </label>
      <div style={{ marginTop: '0.5rem' }}>
        <select
          value={selectedField}
          onChange={handleSelectChange}
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
          <option value="">--Velg fagområde--</option>
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
