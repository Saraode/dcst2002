import { pool } from './mysql-pool';
import { versionService } from './version-service';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';
import axios from 'axios';
const versionRouter = express.Router();

versionRouter.get('/api/history', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `
      SELECT 
    pv.version_number,
    pv.created_at AS timestamp,
    u.name AS user_name,
    'added' AS action_type
FROM 
    page_versions pv
JOIN 
    users u ON pv.user_id = u.id

UNION ALL

SELECT 
    sv.version_number,
    sv.created_at AS timestamp,
    u.name AS user_name,
    sv.action_type
FROM 
    subject_versions sv
JOIN 
    users u ON sv.user_id = u.id

UNION ALL

SELECT 
    srv.version AS version_number,
    srv.created_at AS timestamp,
    u.name AS user_name,
    srv.action_type
FROM 
    subject_review_versions srv
JOIN 
    users u ON srv.user_id = u.id

ORDER BY 
    timestamp DESC;

      `,
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching change history:', error);
    res.status(500).json({ error: 'Failed to fetch change history' });
  }
});

//liste over emner i en versjon
versionRouter.get('/versions/:versionId/subjects', async (req, res) => {
  const { versionId } = req.params;

  try {
    const subjects = await versionService.getSubjectsByVersion(Number(versionId));
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects by version:', error);
    res.status(500).json({ error: 'Failed to fetch subjects by version' });
  }
});
//Endpoint for versjonering med bruker-ID
versionRouter.post('/fields/:fieldId/version', async (req, res) => {
  const { fieldId } = req.params;
  const { userId, description } = req.body;

  console.log(`Incoming versioning request:`, { fieldId, userId, description });

  if (!userId) {
    console.error('User ID is missing for versioning');
    return res.status(400).json({ error: 'User ID is required for versioning' });
  }

  try {
    console.log(`Creating version for fieldId ${fieldId} with userId ${userId}`);
    const newVersionNumber = await versionService.createPageVersion(
      Number(fieldId),
      userId,
      description,
    );
    res.json({ version: newVersionNumber });
  } catch (error) {
    console.error('Error creating new field version:', error);
    res.status(500).json({ error: 'Failed to create field version' });
  }
});

//Endpoint for versjonering med bruker-ID for emner
versionRouter.post('/subjects/:subjectId/version', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, actionType, description } = req.body;

  if (!userId || !actionType) {
    console.error('Missing data for versioning:', { userId, actionType });
    return res.status(400).json({ error: 'User ID and action type are required' });
  }

  try {
    console.log(`Creating version for subject ${subjectId} by userId ${userId}`);
    const versionNumber = await versionService.createSubjectVersion(
      subjectId,
      userId,
      actionType,
      description,
    );
    res.status(200).json({ message: 'Version created successfully', version: versionNumber });
  } catch (error) {
    console.error('Error creating subject version:', error);
    res.status(500).json({ error: 'Failed to create subject version' });
  }
});
versionRouter.post('/subjects/:subjectId/reviews/version', async (req, res) => {
  const { subjectId } = req.params;
  const { reviews, userId, actionType } = req.body;

  try {
    const [result] = await pool
      .promise()
      .query(
        'INSERT INTO subject_review_versions (subject_Id, reviews, user_Id, action_type, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [subjectId, JSON.stringify(reviews), userId, actionType],
      );

    res.status(201).json({ message: 'Versioning successful' });
  } catch (error) {
    console.error('Error saving versioning data to database:', error);
    res.status(500).json({ error: 'Failed to save versioning data' });
  }
});

versionRouter.post('/subjects/:subjectId/increment-view', async (req, res) => {
  const { subjectId } = req.params;

  if (!subjectId) {
    console.error('Missing subjectId in request');
    return res.status(400).json({ error: 'Subject ID is required' });
  }

  try {
    console.log(`Incrementing view count for subjectId: ${subjectId}`);

    // Utfør spørringen og typecast resultatet
    const [result] = await pool.promise().query<ResultSetHeader>(
      'UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?',
      [subjectId]
    );

    // Sjekk affectedRows
    if (result.affectedRows === 0) {
      console.warn(`Subject not found for ID: ${subjectId}`);
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.status(200).send({ message: 'View count incremented successfully' });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).send({ error: 'Failed to increment view count' });
  }
});


export default versionRouter;
