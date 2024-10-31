// client/SubjectDetails.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StarRating from './StarRating';

type Review = {
  id: number;
  text: string;
  stars: number;
};

type Subject = {
  id: string;
  name: string;
};

const SubjectDetails: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [averageStars, setAverageStars] = useState(0);

  const fetchAverageStars = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/average-stars`);
      if (response.ok) {
        const data = await response.json();
        setAverageStars(data.averageStars);
      }
    } catch (error) {
      console.error('Failed to fetch average stars:', error);
    }
  };

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const response = await fetch(`/api/subjects/${subjectId}`);
        if (response.ok) {
          const subjectData = await response.json();
          setSubject(subjectData);
          setReviews(subjectData.reviews);
        }
      } catch (error) {
        console.error('Failed to fetch subject:', error);
      }
    };

    fetchSubject();
    fetchAverageStars(); // Fetch average stars on load
  }, [subjectId]);

  const handleAddReview = async () => {
    if (!newReviewText || newRating === 0) {
      alert('Please add review text and rating');
      return;
    }
  
    try {
      const response = await fetch(`/api/subjects/${subjectId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newReviewText, stars: newRating }),
      });
  
      if (response.ok) {
        const newReview = await response.json();
  
        // Oppdaterer reviews-tilstanden og legger til den nye anmeldelsen med både tekst og stjerner
        setReviews([{ id: newReview.id, text: newReviewText, stars: newRating }, ...reviews]);
  
        // Nullstiller inputfeltene
        setNewReviewText('');
        setNewRating(0);
  
        // Oppdaterer gjennomsnittlig stjernerating
        fetchAverageStars();
      } else {
        const errorData = await response.json();
        console.error('Failed to add review:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to add review:', error);
    }
  };
  

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: '1', border: '1px solid #ccc', padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <h2>Gjennomsnittlig vurdering</h2>
        <StarRating rating={averageStars} onRatingChange={() => {}} readOnly /> {/* Average stars */}

        <h2>Legg til anmeldelse</h2>
        <textarea
          value={newReviewText}
          onChange={(e) => setNewReviewText(e.target.value)}
          placeholder="Skriv din anmeldelse her"
          style={{ marginBottom: '10px', width: '100%', height: '100px' }}
        />
        <StarRating rating={newRating} onRatingChange={setNewRating} />
        <button onClick={handleAddReview} style={{ marginTop: '10px' }}>
          Legg til anmeldelse
        </button>
      </div>

      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Anmeldelser for {subject?.name}</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {reviews.map((review) => (
            <li key={review.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
              <p>{review.text}</p>
              <StarRating rating={review.stars} onRatingChange={() => {}} readOnly /> {/* Individual review stars */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubjectDetails;



