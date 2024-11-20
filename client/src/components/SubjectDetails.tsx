import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import StarRating from './StarRating';  // Importerer komponenten for stjernesystemet
import reviewService from '../services/review-service';  // Importerer reviewService for å håndtere anmeldelser
import { Review, Subject, Level } from '../types/ServiceTypes';  // Importerer relevante typer for anmeldelse, emne og nivå

// SubjectDetails-komponenten som viser detaljer om et emne
const SubjectDetails: React.FC = () => {
  const { subjectId, fieldId } = useParams<{ subjectId: string; fieldId: string }>();  // Henter subjectId og fieldId fra URL
  const history = useHistory();  // Brukes for navigering til andre sider
  const [subject, setSubject] = useState<Subject | null>(null);  // State for emneinformasjon
  const [reviews, setReviews] = useState<Review[]>([]);  // State for å lagre anmeldelser
  const [newReviewText, setNewReviewText] = useState('');  // State for tekstfeltet for ny anmeldelse
  const [newRating, setNewRating] = useState(0);  // State for å lagre stjernesystemet for ny anmeldelse
  const [averageStars, setAverageStars] = useState(0);  // State for gjennomsnittlige stjerner
  const [isAuthorizedToEditSubject, setIsAuthorizedToEditSubject] = useState(false);  // State for å kontrollere om bruker kan redigere emnet
  const [levels, setLevels] = useState<Level[]>([]);  // State for nivåer
  const [errorMessage, setErrorMessage] = useState('');  // Feilmelding state
  const [isEditingLevel, setIsEditingLevel] = useState(false);  // State for å kontrollere om nivå redigeres
  const [updatedLevelId, setUpdatedLevelId] = useState<number | null>(null);  // State for oppdatert nivå
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);  // State for hvilken anmeldelse som redigeres
  const [isEditingDescription, setIsEditingDescription] = useState(false);  // State for å kontrollere om beskrivelsen redigeres
  const [updatedDescription, setUpdatedDescription] = useState<string>('');  // State for oppdatert beskrivelse

  // Brukes til å sjekke om den påloggede brukeren er moderator (ID 35)
  useEffect(() => {
    const currentUserId = Number(localStorage.getItem('userId'));
    if (currentUserId === 35) {
      setIsAuthorizedToEditSubject(true);  // Sett autorisasjon for moderator
    }
  }, []);

  // Øker visningsantallet for emnet
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await fetch(`/api/subjects/${subjectId}/increment-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    incrementViewCount();
  }, [subjectId]);

  // Henter informasjon om emnet, nivåer og anmeldelser
  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const response = await fetch(`/api/subjects/${subjectId}`);
        if (response.ok) {
          const subjectData = await response.json();
          console.log('Fetched subject data:', subjectData);

          // Formaterer `id` til store bokstaver og `name` med stor forbokstav
          const formattedSubjectData = {
            ...subjectData,
            id: String(subjectData.id).toUpperCase(),
            name:
              subjectData.name.charAt(0).toUpperCase() + subjectData.name.slice(1).toLowerCase(),
            description: subjectData.description || 'Ingen beskrivelse tilgjengelig',  // Default value for description
          };

          // Normaliserer anmeldelser (reviews) hvis de finnes
          const transformedReviews = (formattedSubjectData.reviews || []).map((review: any) => ({
            ...review,
            userId: review.userId || review.user_id,  // Ensurerer at userId er konsekvent
          }));

          // Oppdaterer lokal state
          setSubject(formattedSubjectData);  // Setter emnet i state
          setUpdatedLevelId(formattedSubjectData.levelId);  // Setter oppdatert nivå
          setUpdatedDescription(formattedSubjectData.description);  // Setter beskrivelsen i tekstfeltet
          setReviews(transformedReviews);  // Setter anmeldelser i state
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
          setLevels(levelsData);  // Setter nivåer i state
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

  // Henter gjennomsnittlig vurdering for emnet
  const fetchAverageStars = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/average-stars`);
      if (response.ok) {
        const data = await response.json();
        setAverageStars(data.averageStars);  // Setter gjennomsnittsstjernescore
      }
    } catch (error) {
      console.error('Failed to fetch average stars:', error);
    }
  };

  // Håndterer tilføying av ny anmeldelse
  const handleAddReview = async () => {
    if (!newReviewText || newRating === 0) {
      setErrorMessage('Vennligst fyll inn anmeldelsen og gi en vurdering'); // Feilmelding for tomme felt
      return;
    }

    const currentUserId = Number(localStorage.getItem('userId'));

    // Sjekk om brukeren er logget inn
    if (!currentUserId) {
      setErrorMessage('Du må være logget inn for å legge til en anmeldelse'); // Feilmelding for ikke-pålogget bruker
      return;
    }

    const submitterName = localStorage.getItem('userName') || 'Anonym';

    try {
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

        // Legger til den nye anmeldelsen i state
        setReviews([
          {
            ...newReview,
            userId: currentUserId,
          },
          ...reviews,
        ]);
        console.log('Attempting to create a new version with reviews:');

        setNewReviewText('');
        setNewRating(0);
        setErrorMessage('');
        fetchAverageStars(); 
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

  // Håndterer sletting av anmeldelse
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
            reviews: reviews.filter((review) => review.id !== reviewId),
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

  // Håndterer redigering av anmeldelse
  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setNewReviewText(review.text);
    setNewRating(review.stars);
  };

  // Håndterer lagring av redigert anmeldelse
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

  // Håndterer redigering av emne
  const handleEditSubject = () => {
    setIsEditingLevel(true);
  };

  // Håndterer lagring av redigert nivå
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
        await reviewService.createSubjectVersion(subjectId as string, userId, 'edited');
      } else {
        console.error('Failed to update subject level');
      }
    } catch (error) {
      console.error('Error updating subject level:', error);
    }
  };

  // Håndterer avbrytelse av nivåredigering
  const handleCancelLevelEdit = () => {
    setIsEditingLevel(false);
    if (subject) {
      setUpdatedLevelId(subject.levelId);
    }
  };

  // Håndterer sletting av emne
  const handleDeleteSubject = async () => {
    const currentUserId = Number(localStorage.getItem('userId'));
    if (!currentUserId) {
      console.error('User ID is missing. Cannot delete subject.');
      return;
    }

    if (!subjectId) {
      console.error('Subject ID is missing. Cannot delete subject.');
      return;
    }

    const isConfirmed = window.confirm('Er du sikker på at du vil slette dette faget?');
    if (!isConfirmed) return;

    try {
      console.log('Deleting subject:', { subjectId, userId: currentUserId });

      const response = await fetch(`/api/subjects/${subjectId}?userId=${currentUserId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        console.log('Subject deleted successfully');
        history.push(`/fields/${fieldId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete subject:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  // Håndterer redigering av beskrivelse
  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  // Håndterer lagring av redigert beskrivelse
  const handleSaveDescriptionEdit = async () => {
    if (!subject) {
      console.error('Subject is missing. Cannot update description.');
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      console.error('User ID is missing. Cannot update description.');
      return;
    }

    if (!subject.levelId) {
      console.error('Level ID is missing in subject.');
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(currentUserId), // Bruk innlogget bruker-ID
          levelId: subject.levelId, // Sørg for at nivå-ID sendes
          description: updatedDescription, // Oppdatert beskrivelse
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

  // Håndterer avbrytelse av beskrivelsesredigering
  const handleCancelDescriptionEdit = () => {
    setIsEditingDescription(false);
    if (subject) {
      setUpdatedDescription(subject.description);
    }
  };

  if (!subject) return <p>Loading...</p>;  // Vist hvis emnet ikke er lastet ennå

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Første kolonne for emnet og anmeldelser */}
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
          <StarRating rating={averageStars} onRatingChange={() => {}} readOnly /> {/* Vist gjennomsnittlig vurdering */}
          <span>({reviews.length})</span>
        </div>

        <h2>Legg til anmeldelse</h2>
        <textarea
          value={newReviewText}
          onChange={(e) => setNewReviewText(e.target.value)}  // Håndterer endring i anmeldelse
          placeholder="Skriv din anmeldelse her"
          style={{ marginBottom: '10px', width: '100%', height: '100px' }}
        />
        <StarRating rating={newRating} onRatingChange={setNewRating} /> {/* Stjernesystem for anmeldelse */}
        
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

        <button
          style={{ marginTop: '10px' }}
          onClick={editingReviewId ? handleSaveEdit : handleAddReview}  // Håndterer lagring eller opprettelse av anmeldelse
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
            <button onClick={handleDeleteSubject}>Slett fag</button> {/* Knapp for å slette emnet */}
          </div>
        )}
      </div>

      {/* Andre kolonne for detaljer om anmeldelsene */}
      <div style={{ flex: '2', border: '1px solid #ccc', padding: '10px' }}>
        <h2>
          Anmeldelser for {subject?.id} {subject?.name}
        </h2>
        <p>
          <strong>Antall visninger:</strong> {subject?.view_count || 0}
        </p>
        <p>
          <strong>Emnebeskrivelse:</strong>{' '}
          {isEditingDescription ? (
            <textarea
              value={updatedDescription}
              onChange={(e) => setUpdatedDescription(e.target.value)}  // Håndterer endring i beskrivelse
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
                <StarRating rating={review.stars} onRatingChange={() => {}} readOnly /> {/* Vist stjerner for anmeldelsen */}

                {isReviewOwner && (
                  <div>
                    <button
                      onClick={() => handleEditReview(review)}
                      style={{ marginRight: '10px' }}
                    >
                      Rediger
                    </button>
                    <button onClick={() => handleDeleteReview(review.id)}>Slett</button> {/* Knapp for å redigere eller slette anmeldelse */}
                  </div>
                )}

                {isModerator && !isReviewOwner && (
                  <div>
                    <button onClick={() => handleDeleteReview(review.id)}>Slett</button> {/* Knapp for moderator for å slette andres anmeldelser */}
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
