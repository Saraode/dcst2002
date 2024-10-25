import React, { useEffect, useState } from 'react';

type Field = {
  id: number;
  name: string;
};

const FieldDropdown: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<number | ''>('');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch('/api/fields'); // Kall til API-endepunktet
        if (!response.ok) throw new Error('Network response was not ok');
        const data: Field[] = await response.json(); // Konverterer responsen til Field[]
        setFields(data);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      }
    };

    fetchFields();
  }, []);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedField(Number(event.target.value));
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
      {selectedField && <p>Du har valgt: {fields.find(field => field.id === selectedField)?.name}</p>}
    </div>
  );
};

export default FieldDropdown;
