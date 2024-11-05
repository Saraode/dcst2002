import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StarRating from './StarRating';

type Review = {
  id: number;
  text: string;
  stars: number;
  submitterName: string | null;
  userId: number; // Add userId to compare with logged-in user
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
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

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
          const transformedReviews = subjectData.reviews.map((review: any) => ({
            ...review,
            userId: review.user_id, // Create userId field for comparison
          }));
          setReviews(transformedReviews);
        }
      } catch (error) {
        console.error('Failed to fetch subject:', error);
      }
    };

    fetchSubject();
    fetchAverageStars();
  }, [subjectId]);

  const handleAddReview = async () => {
    if (!newReviewText || newRating === 0) {
      alert('Please add review text and rating');
      return;
    }

    try {
      const currentUserId = localStorage.getItem('userId');

      if (!currentUserId) {
        alert('You need to log in to submit a review.');
        return;
      }

      const response = await fetch(`/api/subjects/${subjectId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newReviewText, stars: newRating, userId: currentUserId }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setNewReviewText('');
        setNewRating(0);
        fetchAverageStars();
      } else {
        const errorData = await response.json();
        console.error('Failed to add review:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to add review:', error);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        setReviews(reviews.filter((review) => review.id !== reviewId));
        fetchAverageStars();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete review:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setNewReviewText(review.text);
    setNewRating(review.stars);
  };

  const handleSaveEdit = async () => {
    if (editingReviewId === null) return;

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    try {
      const response = await fetch(`/api/reviews/${editingReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newReviewText, stars: newRating, userId: currentUserId }),
      });

      if (response.ok) {
        setReviews(
          reviews.map((review) =>
            review.id === editingReviewId
              ? { ...review, text: newReviewText, stars: newRating }
              : review,
          ),
        );
        setNewReviewText('');
        setNewRating(0);
        setEditingReviewId(null);
        fetchAverageStars();
      } else {
        const errorData = await response.json();
        console.error('Failed to update review:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div
        style={{
          flex: '1',
          border: '1px solid #ccc',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2>Gjennomsnittlig vurdering</h2>
        <StarRating rating={averageStars} onRatingChange={() => {}} readOnly />
        <h2>Legg til anmeldelse</h2>
        <textarea
          value={newReviewText}
          onChange={(e) => setNewReviewText(e.target.value)}
          placeholder="Skriv din anmeldelse her"
          style={{ marginBottom: '10px', width: '100%', height: '100px' }}
        />
        <StarRating rating={newRating} onRatingChange={setNewRating} />
        <button
          onClick={editingReviewId ? handleSaveEdit : handleAddReview}
          style={{ marginTop: '10px' }}
        >
          {editingReviewId ? 'Lagre endring' : 'Legg til anmeldelse'}
        </button>
      </div>

      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Anmeldelser for {subject?.name}</h2>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {reviews.map((review) => (
            <li
              key={review.id}
              style={{
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ccc',
              }}
            >
              <p>
                <strong>{review.submitterName}</strong>
              </p>
              <p>{review.text}</p>
              <StarRating rating={review.stars} onRatingChange={() => {}} readOnly />
              {console.log(
                `Review userId: ${review.userId}, Logged-in userId: ${Number(localStorage.getItem('userId'))}`,
              )}
              {Number(localStorage.getItem('userId')) === review.userId && (
                <>
                  <button onClick={() => handleEditReview(review)} style={{ marginRight: '5px' }}>
                    Rediger
                  </button>
                  <button onClick={() => handleDeleteReview(review.id)}>Slett</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubjectDetails;
