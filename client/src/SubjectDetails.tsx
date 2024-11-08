import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import StarRating from './StarRating';

type Review = {
  id: number;
  text: string;
  stars: number;
  submitterName: string | null;
  userId: number;
  created_date: string;
};

type Subject = {
  id: string;
  name: string;
  levelId: number; // Add levelId to manage subject's level
};

type Level = {
  id: number;
  name: string;
};

const SubjectDetails: React.FC = () => {
  const { subjectId, fieldId } = useParams<{ subjectId: string; fieldId: string }>();
  const history = useHistory();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [averageStars, setAverageStars] = useState(0);
  const [isAuthorizedToEditSubject, setIsAuthorizedToEditSubject] = useState(false);

  const [levels, setLevels] = useState<Level[]>([]);
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [updatedLevelId, setUpdatedLevelId] = useState<number | null>(null);

  useEffect(() => {
    const currentUserId = Number(localStorage.getItem('userId'));
    if (currentUserId === 35) {
      setIsAuthorizedToEditSubject(true);
    }
  }, []);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const response = await fetch(`/api/subjects/${subjectId}`);
        if (response.ok) {
          const subjectData = await response.json();
          setSubject(subjectData);
          setUpdatedLevelId(subjectData.levelId);
          setReviews(subjectData.reviews);
        } else {
          console.error('Failed to fetch subject');
        }
      } catch (error) {
        console.error('Error fetching subject:', error);
      }
    };

    const fetchLevels = async () => {
      try {
        const response = await fetch('/api/levels');
        if (response.ok) {
          const levelsData = await response.json();
          setLevels(levelsData);
        } else {
          console.error('Failed to fetch levels');
        }
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };

    fetchSubject();
    fetchLevels();
    fetchAverageStars();
  }, [subjectId]);

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

  const handleEditSubject = () => {
    setIsEditingLevel(true);
  };

  const handleSaveLevelEdit = async () => {
    if (!updatedLevelId || !subject) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 35, levelId: updatedLevelId }),
      });

      if (response.ok) {
        setSubject({ ...subject, levelId: updatedLevelId });
        setIsEditingLevel(false);
      } else {
        console.error('Failed to update subject level');
      }
    } catch (error) {
      console.error('Error updating subject level:', error);
    }
  };

  const handleCancelLevelEdit = () => {
    setIsEditingLevel(false);
    if (subject) {
      setUpdatedLevelId(subject.levelId); // Reset to original level
    }
  };

  const handleDeleteSubject = async () => {
    const isConfirmed = window.confirm('Er du sikker på at du vil slette dette faget?');
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 35 }),
      });

      if (response.ok) {
        history.push(`/fields/${fieldId}`);
      } else {
        console.error('Failed to delete subject');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  if (!subject) return <p>Loading...</p>;

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
        <button style={{ marginTop: '10px' }}>Legg til anmeldelse</button>

        {isAuthorizedToEditSubject && (
          <div style={{ marginTop: '20px' }}>
            {!isEditingLevel ? (
              <button onClick={handleEditSubject} style={{ marginRight: '10px' }}>
                Rediger fag
              </button>
            ) : (
              <>
                <div>
                  {levels.map((level) => (
                    <label key={level.id} style={{ display: 'block', margin: '5px 0' }}>
                      <input
                        type="radio"
                        name="level"
                        value={level.id}
                        checked={updatedLevelId === level.id}
                        onChange={() => setUpdatedLevelId(level.id)}
                      />
                      {level.name}
                    </label>
                  ))}
                </div>
                <button onClick={handleSaveLevelEdit} style={{ marginRight: '10px' }}>
                  Lagre
                </button>
                <button onClick={handleCancelLevelEdit}>Avbryt</button>
              </>
            )}
            <button onClick={handleDeleteSubject}>Slett fag</button>
          </div>
        )}
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
                <strong>{review.submitterName}</strong>{' '}
                <span>{new Date(review.created_date).toLocaleDateString()}</span>
              </p>
              <p>{review.text}</p>
              <StarRating rating={review.stars} onRatingChange={() => {}} readOnly />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubjectDetails;
