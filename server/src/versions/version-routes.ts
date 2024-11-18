import { pool } from '../mysql-pool';
import { versionService } from './version-service';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';
import axios from 'axios';

const versionRouter = express.Router();

// Henter endringshistorikk
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
    console.error('Feil ved henting av endringshistorikk:', error);
    res.status(500).json({ error: 'Kunne ikke hente endringshistorikk' });
  }
});

// Henter liste over emner i en gitt versjon
versionRouter.get('/versions/:versionId/subjects', async (req, res) => {
  const { versionId } = req.params;

  try {
    const subjects = await versionService.getSubjectsByVersion(Number(versionId));
    res.json(subjects);
  } catch (error) {
    console.error('Feil ved henting av emner for versjon:', error);
    res.status(500).json({ error: 'Kunne ikke hente emner for versjon' });
  }
});

// Oppretter en ny versjon for et felt med bruker-ID
versionRouter.post('/fields/:fieldId/version', async (req, res) => {
  const { fieldId } = req.params;
  const { userId, description } = req.body;

  console.log(`Inkommende forespørsel om versjonering:`, { fieldId, userId, description });

  if (!userId) {
    console.error('Bruker-ID mangler for versjonering');
    return res.status(400).json({ error: 'Bruker-ID er påkrevd for versjonering' });
  }

  try {
    console.log(`Oppretter versjon for felt-ID ${fieldId} med bruker-ID ${userId}`);
    const newVersionNumber = await versionService.createPageVersion(
      Number(fieldId),
      userId,
      description,
    );
    res.json({ version: newVersionNumber });
  } catch (error) {
    console.error('Feil ved opprettelse av ny feltversjon:', error);
    res.status(500).json({ error: 'Kunne ikke opprette feltversjon' });
  }
});

// Oppretter en ny versjon for et emne med bruker-ID
versionRouter.post('/subjects/:subjectId/version', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, actionType, description } = req.body;

  if (!userId || !actionType) {
    console.error('Mangler data for versjonering:', { userId, actionType });
    return res.status(400).json({ error: 'Bruker-ID og handlingstype er påkrevd' });
  }

  try {
    console.log(`Oppretter versjon for emne ${subjectId} med bruker-ID ${userId}`);
    const versionNumber = await versionService.createSubjectVersion(
      subjectId,
      userId,
      actionType,
      description,
    );
    res.status(200).json({ message: 'Versjon opprettet', version: versionNumber });
  } catch (error) {
    console.error('Feil ved opprettelse av emneversjon:', error);
    res.status(500).json({ error: 'Kunne ikke opprette emneversjon' });
  }
});

// Oppretter en ny versjon for anmeldelser knyttet til et emne
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

    res.status(201).json({ message: 'Versjonering fullført' });
  } catch (error) {
    console.error('Feil ved lagring av versjonsdata til databasen:', error);
    res.status(500).json({ error: 'Kunne ikke lagre versjonsdata' });
  }
});

// Øker antall visninger for et emne
versionRouter.post('/subjects/:subjectId/increment-view', async (req, res) => {
  const { subjectId } = req.params;

  if (!subjectId) {
    console.error('Emne-ID mangler i forespørselen');
    return res.status(400).json({ error: 'Emne-ID er påkrevd' });
  }

  try {
    await pool
      .promise()
      .query('UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?', [subjectId]);
    res.status(200).send({ message: 'View count incremented successfully' });
    console.log(`Øker antall visninger for emne-ID: ${subjectId}`);

    // Utfør spørringen og typecast resultatet
    const [result] = await pool
      .promise()
      .query<ResultSetHeader>('UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?', [
        subjectId,
      ]);

    // Sjekker om noen rader ble påvirket
    if (result.affectedRows === 0) {
      console.warn(`Emne ikke funnet for ID: ${subjectId}`);
      return res.status(404).json({ error: 'Emne ikke funnet' });
    }

    res.status(200).send({ message: 'Antall visninger økt' });
  } catch (error) {
    console.error('Feil ved økning av visninger:', error);
    res.status(500).send({ error: 'Kunne ikke øke antall visninger' });
  }
});

export default versionRouter;
