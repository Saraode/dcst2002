// client/StarRating.tsx

import React from 'react';

// Definerer typen for props som StarRating-komponenten tar
interface StarRatingProps {
  rating: number;  // Nåværende vurdering (antall stjerner)
  onRatingChange: (newRating: number) => void;  // Funksjon som kalles når vurderingen endres
  readOnly?: boolean;  // Om vurderingen er skrivebeskyttet eller ikke (valgfritt)
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false }) => {
  // Funksjon som håndterer klikk på stjernene for å oppdatere vurderingen
  const handleRatingClick = (index: number) => {
    if (!readOnly) {  // Hvis vurderingen ikke er skrivebeskyttet
      // Hvis stjernen som klikkes er den samme som nåværende vurdering, fjern vurderingen (sett til én mindre),
      // ellers sett vurderingen til `index + 1`
      const newRating = index + 1 === rating ? rating - 1 : index + 1;
      onRatingChange(newRating);  // Kall funksjonen som oppdaterer vurderingen
    }
  };

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {/* Lager fem stjerner for vurderingen */}
      {[...Array(5)].map((_, index) => (
        <span
          key={index}  // Hver stjerne får en unik nøkkel basert på index
          onClick={() => handleRatingClick(index)}  // Når stjernen klikkes, oppdater vurderingen
          style={{
            cursor: readOnly ? 'default' : 'pointer',  // Hvis vurderingen er skrivebeskyttet, vis en standard peker
            color: index < rating ? 'gold' : 'gray',  // Farg stjernene, gold for vurderte og gray for ikke-vurderte
            fontSize: '1.5em',  // Størrelsen på stjernene
          }}
        >
          ★  {/* Vis stjernesymbolet */}
        </span>
      ))}
    </div>
  );
};

export default StarRating;
