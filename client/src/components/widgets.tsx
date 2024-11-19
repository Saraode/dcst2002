import * as React from 'react';

// Card Component: En card-komponent for å vise innhold med tittel og ramme
export const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: '12px', // Runde hjørner for kortet
      margin: '16px',
      padding: '16px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Lett skygge for dybde
      backgroundColor: '#fff', // Hvit bakgrunn
    }}
  >
    {title && (
      <h2
        style={{
          borderBottom: '1px solid #ddd',
          paddingBottom: '8px',
          marginBottom: '16px', // Avstand mellom tittel og innhold
          fontSize: '1.5rem', // Større font for tittel
          color: '#333', // Mørk grå farge for tittelen
        }}
      >
        {title}
      </h2>
    )}
    <div>{children}</div>
  </div>
);

// Row Component: En row for å plassere elementer horisontalt
export const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
    {children}
  </div>
);

// Column Component: En kolonne for å justere bredde og innhold
export const Column: React.FC<{ width?: number; children: React.ReactNode }> = ({ width, children }) => (
  <div
    style={{
      flex: width ? `0 0 ${width * 10}%` : '1', // Fleksibel bredde basert på prop
      padding: '8px',
      boxSizing: 'border-box', // For å inkludere padding i bredde
    }}
  >
    {children}
  </div>
);

// Form Components: Et sett med form-elementer som Label, Input, Textarea og Checkbox
export const Form = {
  // Label: En label for form-felter
  Label: ({ children }: { children: React.ReactNode }) => (
    <label
      style={{
        display: 'block',
        fontWeight: 'bold',
        marginBottom: '8px',
        fontSize: '1rem',
        color: '#555',
      }}
    >
      {children}
    </label>
  ),
  // Input: Et input for tekst og andre input-typer
  Input: ({ type, value, onChange }: { type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '10px',
        marginBottom: '16px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '1rem',
      }}
    />
  ),
  // Textarea: Et større tekstfelt for lengre input
  Textarea: ({ value, onChange, rows }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows: number }) => (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      style={{
        width: '100%',
        padding: '10px',
        marginBottom: '16px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '1rem',
      }}
    />
  ),
  // Checkbox: En avkrysningsboks med etikett
  Checkbox: ({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) => (
    <label
      style={{
        display: 'block',
        marginBottom: '16px',
        cursor: 'pointer',
        fontSize: '1rem',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          marginRight: '8px',
          accentColor: '#007bff', // Farge for avkrysningsboksen
        }}
      />
      {label}
    </label>
  ),
};

// Button Components: Knapp-komponenter for ulike handlinger
export const Button = {
  // Success: En grønn knapp for suksess-handlinger
  Success: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
    >
      {children}
    </button>
  ),
  // Danger: En rød knapp for advarsler og feil
  Danger: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
    >
      {children}
    </button>
  ),
};

// Alert Component: Funksjoner for å vise suksess- og feilmeldinger
export const Alert = {
  success: (message: string) => alert(`✅ Suksess: ${message}`), // Viser en suksessmelding
  danger: (message: string) => alert(`❌ Feil: ${message}`), // Viser en feilmelding
};
