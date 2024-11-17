import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import StarRating from './StarRating';
import reviewService from './review-service';

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
  levelId: number;
  description: string;
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
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [updatedDescription, setUpdatedDescription] = useState<string>('');

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
          console.log('Fetched subject data:', subjectData);

          // Formater `id` til store bokstaver og `name` med stor forbokstav
          const formattedSubjectData = {
            ...subjectData,
            id: String(subjectData.id).toUpperCase(),

            name:
              subjectData.name.charAt(0).toUpperCase() + subjectData.name.slice(1).toLowerCase(),
            description: subjectData.description || 'Ingen beskrivelse tilgjengelig', // Default value for description
          };

          // Normaliser anmeldelser (reviews) hvis de finnes
          const transformedReviews = (formattedSubjectData.reviews || []).map((review: any) => ({
            ...review,
            userId: review.userId || review.user_id, // Ensure `userId` is consistent
          }));

          // Oppdater lokal state
          setSubject(formattedSubjectData); // Oppdater `subject`-objektet
          setUpdatedLevelId(formattedSubjectData.levelId); // Oppdater nivå hvis relevant
          setUpdatedDescription(formattedSubjectData.description); // Sett beskrivelsen i tekstfeltet
          setReviews(transformedReviews); // Oppdater anmeldelser
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

  const handleAddReview = async () => {
    if (!newReviewText || newRating === 0) {
      alert('Vennligst fyll inn anmeldelsen og gi en vurdering');
      return;
    }

    try {
      const currentUserId = Number(localStorage.getItem('userId'));
      const submitterName = localStorage.getItem('userName') || 'Anonym';

      const response = await fetch(`/api/subjects/${subjectId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newReviewText,
          stars: newRating,
          userId: currentUserId,
          submitterName,
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        console.log('New review:', newReview);

        // Add the new review to the state, ensuring userId is preserved
        setReviews([
          {
            ...newReview,
            userId: currentUserId, // Ensure the userId is included
          },
          ...reviews,
        ]);
        console.log('Attempting to create a new version with reviews:');

        setNewReviewText('');
        setNewRating(0);
        fetchAverageStars(); // Recalculate average stars
        await fetch(`/api/subjects/${subjectId}/reviews/version`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: [newReview, ...reviews],
            userId: currentUserId,
            actionType: 'commented on',
          }),
        });
      } else {
        console.error('Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
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
        await fetch(`/api/subjects/${subjectId}/reviews/version`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: reviews.filter((review) => review.id !== reviewId), // Include all remaining reviews
            userId: currentUserId,
            actionType: 'deleted a comment on',
          }),
        });
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
        await fetch(`/api/subjects/${subjectId}/reviews/version`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: reviews.map((review) =>
              review.id === editingReviewId
                ? { ...review, text: newReviewText, stars: newRating }
                : review,
            ),
            userId: currentUserId,
            actionType: 'edited a comment on',
          }),
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to update review:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleEditSubject = () => {
    setIsEditingLevel(true);
  };

  const handleSaveLevelEdit = async () => {
    if (!updatedLevelId || !subject) return;

    try {
      const userId = localStorage.getItem('userId') || '';
      console.log('Subject ID in handleSaveLevelEdit:', subjectId); // Log subjectId

      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 35, levelId: updatedLevelId }),
      });

      if (response.ok) {
        setSubject({ ...subject, levelId: updatedLevelId });
        setIsEditingLevel(false);
        await reviewService.createSubjectVersion(subjectId, userId, 'edited');
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
      setUpdatedLevelId(subject.levelId);
    }
  };

  const handleDeleteSubject = async () => {
    const currentUserId = Number(localStorage.getItem('userId'));
    if (!currentUserId) return;

    const isConfirmed = window.confirm('Er du sikker på at du vil slette dette faget?');
    if (!isConfirmed) return;

    try {
      const userId = localStorage.getItem('userId') || '';
      console.log('Subject ID in handleDeleteSubject:', subjectId); // Log subjectId

      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }), // Include the current userId
      });

      if (response.ok) {
        console.log('Subject deleted successfully');

        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('User ID is missing from local storage. Cannot create a version.');
          // Proceed with redirection if logging is not required
          history.push(`/fields/${fieldId}`);
          return;
        }
        try {
          // Attempt to create a version entry after deletion
          console.log(
            'Attempting to create subject version with subjectId:',
            subjectId,
            'and userId:',
            userId,
          );
          await reviewService.createSubjectVersion(subjectId, userId, 'deleted');
          console.log('Version created for deleted subject.');

          // Only redirect if both deletion and version creation succeed
          history.push(`/fields/${fieldId}`);
        } catch (versionError) {
          console.error('Failed to create version after deletion:', versionError);
          // Redirect even if version creation fails
          history.push(`/fields/${fieldId}`);
        }

        history.push(`/fields/${fieldId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete subject:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleSaveDescriptionEdit = async () => {
    if (!subject) return;

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 35, // Moderator ID
          description: updatedDescription,
        }),
      });

      if (response.ok) {
        setSubject({ ...subject, description: updatedDescription }); // Oppdater lokalt
        setIsEditingDescription(false);
        console.log('Description updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update subject description:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating subject description:', error);
    }
  };
  const handleCancelDescriptionEdit = () => {
    setIsEditingDescription(false);
    if (subject) {
      setUpdatedDescription(subject.description);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StarRating rating={averageStars} onRatingChange={() => {}} readOnly />

          <span>({reviews.length})</span>
        </div>

        <h2>Legg til anmeldelse</h2>
        <textarea
          value={newReviewText}
          onChange={(e) => setNewReviewText(e.target.value)}
          placeholder="Skriv din anmeldelse her"
          style={{ marginBottom: '10px', width: '100%', height: '100px' }}
        />
        <StarRating rating={newRating} onRatingChange={setNewRating} />
        <button
          style={{ marginTop: '10px' }}
          onClick={editingReviewId ? handleSaveEdit : handleAddReview}
        >
          {editingReviewId ? 'Lagre endring' : 'Legg til anmeldelse'}
        </button>

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
        <h2>
          Anmeldelser for {subject?.id} {subject?.name}
        </h2>

        <p>
          <strong>Emnebeskrivelse:</strong>{' '}
          {isEditingDescription ? (
            <textarea
              value={updatedDescription}
              onChange={(e) => setUpdatedDescription(e.target.value)}
              style={{ width: '100%', height: '100px', marginBottom: '10px' }}
            />
          ) : (
            subject.description
          )}
        </p>

        {isAuthorizedToEditSubject && (
          <div>
            {isEditingDescription ? (
              <>
                <button onClick={handleSaveDescriptionEdit} style={{ marginRight: '10px' }}>
                  Lagre
                </button>
                <button onClick={handleCancelDescriptionEdit}>Avbryt</button>
              </>
            ) : (
              <button onClick={() => setIsEditingDescription(true)} style={{ marginTop: '10px' }}>
                Rediger beskrivelse
              </button>
            )}
          </div>
        )}

        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {reviews.map((review) => {
            const currentUserId = Number(localStorage.getItem('userId'));
            const isModerator = currentUserId === 35;
            const isReviewOwner = currentUserId === review.userId;

            return (
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

                {isReviewOwner && (
                  <div>
                    <button
                      onClick={() => handleEditReview(review)}
                      style={{ marginRight: '10px' }}
                    >
                      Rediger
                    </button>
                    <button onClick={() => handleDeleteReview(review.id)}>Slett</button>
                  </div>
                )}

                {isModerator && !isReviewOwner && (
                  <div>
                    <button onClick={() => handleDeleteReview(review.id)}>Slett</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SubjectDetails;
