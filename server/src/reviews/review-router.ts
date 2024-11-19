import express from 'express';
import { reviewService } from './review-service';
import { userService } from '../users/user-service';

const router = express.Router();

// Henter anmeldelser for et spesifikt fag
router.get('/subjects/:id/reviews', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`[INFO] Henter anmeldelser for fag ID: ${id}`);
    const reviews = await reviewService.getReviewsBySubjectId(id);
    console.log(`[SUCCESS] Hentet ${reviews.length} anmeldelser for fag ID: ${id}`);
    res.status(200).json(reviews);
  } catch (error) {
    console.error(`[ERROR] Feil ved henting av anmeldelser for fag ID: ${id}`, error);
    res.status(500).json({ error: 'Kunne ikke hente anmeldelser' });
  }
});

// Legger til en ny anmeldelse for et fag
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  const { text, stars, userId } = req.body;

  console.log(`[INFO] Mottatt forespørsel om å legge til anmeldelse for fag ID: ${subjectId}`);
  console.log(`[INFO] Forespørselsdata:`, { text, stars, userId });

  if (!text || stars == null || !userId) {
    console.error(`[ERROR] Validering feilet: Manglende felt.`, { text, stars, userId });
    return res.status(400).json({ error: 'Mangler tekst, stjerner, eller bruker-ID' });
  }

  try {
    console.log(`[INFO] Validerer bruker-ID: ${userId}`);
    const submitter = await userService.findUserById(userId);
    if (!submitter) {
      console.error(`[ERROR] Bruker med ID ${userId} ble ikke funnet.`);
      return res.status(404).json({ error: 'Bruker ikke funnet' });
    }
    const submitterName = submitter.name;
    console.log(`[SUCCESS] Bruker validert: ${submitterName}`);

    console.log(`[INFO] Oppretter anmeldelse for fag ID: ${subjectId}`);
    const newReviewId = await reviewService.createReview(
      subjectId,
      text,
      stars,
      userId,
      submitterName,
    );
    console.log(`[SUCCESS] Anmeldelse opprettet med ID: ${newReviewId}`);

    const newReview = await reviewService.getReviewById(newReviewId);
    console.log(`[INFO] Hentet detaljer for ny anmeldelse:`, newReview);

    res.status(201).json(newReview);
  } catch (error) {
    console.error(`[ERROR] Kunne ikke legge til anmeldelse for fag ID: ${subjectId}`, error);
    res.status(500).json({ error: 'Kunne ikke legge til anmeldelse' });
  }
});

// Oppdaterer en anmeldelse
router.put('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { text, stars, userId } = req.body;

  console.log(`[INFO] Mottatt forespørsel om å oppdatere anmeldelse ID: ${reviewId}`);
  console.log(`[INFO] Forespørselsdata:`, { text, stars, userId });

  try {
    const review = await reviewService.getReviewById(Number(reviewId));
    if (!review) {
      console.error(`[ERROR] Anmeldelse med ID ${reviewId} ble ikke funnet.`);
      return res.status(404).json({ error: 'Anmeldelse ikke funnet' });
    }

    if (review.userId !== Number(userId)) {
      console.error(`[ERROR] Uautorisert forsøk på å oppdatere anmeldelse ID: ${reviewId}`);
      return res.status(403).json({ error: 'Ikke autorisert til å redigere denne anmeldelsen' });
    }

    await reviewService.updateReview(Number(reviewId), text, stars);
    console.log(`[SUCCESS] Anmeldelse ID: ${reviewId} oppdatert`);
    res.status(200).json({ message: 'Anmeldelse oppdatert' });
  } catch (error) {
    console.error(`[ERROR] Kunne ikke oppdatere anmeldelse ID: ${reviewId}`, error);
    res.status(500).json({ error: 'Kunne ikke oppdatere anmeldelse' });
  }
});

// Sletter en anmeldelse
router.delete('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body;

  console.log(`[INFO] Mottatt forespørsel om å slette anmeldelse ID: ${reviewId}`);
  console.log(`[INFO] Forespørselsdata:`, { userId });

  try {
    const review = await reviewService.getReviewById(Number(reviewId));
    if (!review) {
      console.error(`[ERROR] Anmeldelse med ID ${reviewId} ble ikke funnet.`);
      return res.status(404).json({ error: 'Anmeldelse ikke funnet' });
    }

    if (review.userId !== Number(userId) && Number(userId) !== 35) {
      console.error(`[ERROR] Uautorisert forsøk på å slette anmeldelse ID: ${reviewId}`);
      return res.status(403).json({ error: 'Ikke autorisert til å slette denne anmeldelsen' });
    }

    await reviewService.deleteReview(Number(reviewId));
    console.log(`[SUCCESS] Anmeldelse ID: ${reviewId} slettet`);
    res.status(200).json({ message: 'Anmeldelse slettet' });
  } catch (error) {
    console.error(`[ERROR] Kunne ikke slette anmeldelse ID: ${reviewId}`, error);
    res.status(500).json({ error: 'Kunne ikke slette anmeldelse' });
  }
});

// Henter gjennomsnittlig stjernerscore for et fag
router.get('/subjects/:id/average-stars', async (req, res) => {
  const subjectId = req.params.id;
  try {
    const averageStars = await reviewService.getAverageStarsForSubject(subjectId);
    res.json({ averageStars });
  } catch (error) {
    console.error('Feil ved henting av gjennomsnittlig stjernerscore:', error);
    res.status(500).json({ error: 'Kunne ikke hente gjennomsnittlig stjernerscore' });
  }
});

export { router as reviewRouter };
