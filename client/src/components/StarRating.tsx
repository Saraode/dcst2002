import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (newRating: number) => void;
  readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false }) => {
  const handleRatingClick = (index: number) => {
    if (!readOnly) {
      // Hvis stjernen allerede er valgt, sett rating til én mindre, ellers sett den til `index + 1`.
      const newRating = index + 1 === rating ? rating - 1 : index + 1;
      onRatingChange(newRating);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          onClick={() => handleRatingClick(index)}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            color: index < rating ? 'gold' : 'gray',
            fontSize: '1.5em',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
