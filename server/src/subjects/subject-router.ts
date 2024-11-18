import express from 'express';
import subjectService from './subject-service';
import { pool } from '../mysql-pool';
import type { RowDataPacket } from 'mysql2';

const router = express.Router();

// Henter fag for et spesifikt felt, med eller uten nivåfilter
router.get('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const levelId = req.query.levelId;

  try {
    let subjects;
    if (levelId) {
      subjects = await subjectService.getSubjectsByFieldAndLevel(Number(fieldId), Number(levelId));
    } else {
      subjects = await subjectService.getSubjectsByField(Number(fieldId));
    }
    console.log('Subjects fetched:', subjects);
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Legger til nytt fag
router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name, level, description } = req.body;

  // Validerer at alle nødvendige felter er til stede
  if (!id || !name || !level || !description) {
    return res.status(400).json({ error: 'ID, navn, nivå og beskrivelse er påkrevd' });
  }

  try {
    const newSubjectId = await subjectService.createSubject(
      id,
      name,
      Number(fieldId),
      level,
      description,
    );
    res.status(201).json({ id: newSubjectId, name, level, description });
  } catch (error) {
    console.error('Feil ved oppretting av emne:', error);
    res.status(500).json({ error: 'Kunne ikke opprette emne' });
  }
});

// Henter antall fag per nivå for et felt
router.get('/fields/:fieldId/subject-counts', async (req, res) => {
  const { fieldId } = req.params;
  try {
    const counts = await subjectService.getSubjectCountByLevel(Number(fieldId));
    res.json(counts);
  } catch (error) {
    console.error('Error fetching subject counts:', error);
    res.status(500).json({ error: 'Failed to fetch subject counts' });
  }
});

// Henter alle nivåer
router.get('/levels', async (req, res) => {
  try {
    const levels = await subjectService.getAllLevels();
    res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// Henter detaljer for et spesifikt fag
router.get('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  try {
    const subject = await subjectService.getSubject(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Sletter et fag (krever autorisering)
router.delete('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId } = req.body;

  console.log(`Delete request received for subjectId: ${subjectId} by userId: ${userId}`);

  // Autorisering for sletting
  if (!userId || Number(userId) !== 35) {
    console.error(`Unauthorized attempt to delete subject: ${subjectId} by user: ${userId}`);
    return res.status(403).json({ error: 'Not authorized to delete this subject' });
  }

  try {
    console.log(`Attempting to delete subject with ID: ${subjectId}`);
    await subjectService.deleteSubject(subjectId);
    console.log(`Subject with ID ${subjectId} deleted successfully`);
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Could not delete subject' });
  }
});

// Redigerer et fag
router.put('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, levelId, description } = req.body;

  // Validerer inngangsdata
  if (!userId || !levelId) {
    return res.status(400).json({ error: 'User ID and level ID are required' });
  }

  if (typeof userId !== 'number' || Number.isNaN(userId)) {
    return res.status(400).json({ error: 'User ID must be a number' });
  }

  if (typeof levelId !== 'number' || Number.isNaN(levelId)) {
    return res.status(400).json({ error: 'Level ID must be a number' });
  }

  // Sjekker autorisering
  if (Number(userId) !== 35) {
    return res.status(403).json({ error: 'Not authorized to edit this subject' });
  }

  // Validerer oppdateringer
  if (!description && !levelId) {
    return res.status(400).json({ error: 'No updates provided (description or levelId missing)' });
  }

  try {
    if (levelId) {
      await subjectService.updateSubjectLevel(subjectId, levelId);
    }

    if (description) {
      await pool
        .promise()
        .query('UPDATE Subjects SET description = ? WHERE id = ?', [description, subjectId]);
    }

    res.status(200).json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Could not update subject' });
  }
});

// Søker etter fag basert på ID eller navn
router.get('/search', async (req, res) => {
  const query = req.query.query as string;

  // Validerer søkeparameter
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const [results] = await pool.promise().query<RowDataPacket[]>(
      `
      SELECT id, name
      FROM Subjects
      WHERE LOWER(id) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)
      ORDER BY 
        CASE
          WHEN LOWER(id) LIKE LOWER(?) THEN 1
          WHEN LOWER(name) LIKE LOWER(?) THEN 1
          ELSE 2
        END,
        id ASC
      LIMIT 10
      `,
      [`${query}%`, `%${query}%`, `${query}%`, `${query}%`],
    );

    res.json(results);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

export { router as subjectRouter };
