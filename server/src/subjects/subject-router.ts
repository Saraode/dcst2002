import express from 'express';
import subjectService from './subject-service';
import { pool } from '../mysql-pool';
import type { RowDataPacket } from 'mysql2';

const router = express.Router();

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

// Legg til nytt fag
router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name, level } = req.body;

  console.log('POST /fields/:fieldId/subjects route hit');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);

  if (!id || !name || !level) {
    console.error('Validation failed:', { id, name, level });
    return res.status(400).json({ error: 'ID, name, or level missing' });
  }

  try {
    console.log('Creating subject with values:', { id, name, fieldId, level });
    const newSubjectId = await subjectService.createSubject(id, name, Number(fieldId), level);
    res.json({ id: newSubjectId, name, level });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ error: 'Failed to add subject' });
  }
});

// Antall fag per level
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

router.get('/levels', async (req, res) => {
  try {
    const levels = await subjectService.getAllLevels();
    res.json(levels);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

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

//Slett fag
router.delete('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId } = req.body;

  console.log(`Delete request received for subjectId: ${subjectId} by userId: ${userId}`);

  // Autorisering
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

// Rediger fag
router.put('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, levelId } = req.body;

  if (!userId || !levelId) {
    return res.status(400).json({ error: 'User ID and level ID are required' });
  }

  if (typeof userId !== 'number' || Number.isNaN(userId)) {
    return res.status(400).json({ error: 'User ID must be a number' });
  }

  if (typeof levelId !== 'number' || Number.isNaN(levelId)) {
    return res.status(400).json({ error: 'Level ID must be a number' });
  }

  if (userId !== 35) {
    return res.status(403).json({ error: 'Not authorized to edit this subject' });
  }

  try {
    await subjectService.updateSubjectLevel(subjectId, levelId);
    res.status(200).json({ message: 'Subject level updated successfully' });
  } catch (error) {
    console.error('Error updating subject level:', error);
    res.status(500).json({ error: 'Could not update subject level' });
  }
});

export { router as subjectRouter };
