import express from 'express';
import fieldService from './field-service';
import { pool } from '../mysql-pool';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Henter alle fields
router.get('/', async (req, res) => {
  try {
    const fields = await fieldService.getFields();
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Henter alle campus
router.get('/campuses', async (req, res) => {
  try {
    const campuses = await fieldService.getAllCampuses();
    res.json(campuses);
  } catch (error) {
    console.error('Error fetching campuses:', error);
    res.status(500).json({ error: 'Failed to fetch campuses' });
  }
});

// Henter fields tilhørende spesifikt campus
router.get('/campus/:campus', async (req, res) => {
  const { campus } = req.params;
  try {
    const fields = await fieldService.getFieldsByCampus(campus);
    if (!fields.length) {
      return res.status(404).json({ error: 'Campus not found' });
    }
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields for campus:', error);
    res.status(500).json({ error: 'Failed to fetch fields for campus' });
  }
});

// Henter field basert på ID
router.get('/:fieldId', async (req, res) => {
  const { fieldId } = req.params;
  try {
    const field = await fieldService.getFieldById(Number(fieldId));
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(field);
  } catch (error) {
    console.error('Error fetching field by ID:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// Henter fields for spesifikt campus (en spesifikk rute for strukturert data)
router.get('/campus/:campus/fields', async (req, res) => {
  const { campus } = req.params;
  try {
    const fields = await fieldService.getFieldsByCampus(campus);
    res.json(fields || []); // Returnerer alltid en liste
  } catch (error) {
    console.error('Error fetching fields for campus:', error);
    res.status(500).json({ error: 'Failed to fetch fields for campus' });
  }
});

// Henter totalt antall subjects for en field
router.get('/fields/:fieldId/total-subjects-count', async (req, res) => {
  const { fieldId } = req.params;

  try {
    const totalSubjectsCount = await fieldService.getTotalSubjectsCount(Number(fieldId));
    if (!totalSubjectsCount) {
      return res.status(404).json({ error: 'No subjects found for this fieldId' });
    }

    res.status(200).json({ total: totalSubjectsCount });
  } catch (error) {
    console.error(`[ERROR] Failed to fetch total subjects count for fieldId ${fieldId}:`, error);
    res.status(500).json({ error: 'Failed to fetch total subjects count' });
  }
});

// Henter navnet til en field
router.get('/fields/:fieldId/name', async (req, res) => {
  const { fieldId } = req.params;

  try {
    const fieldName = await fieldService.getFieldNameById(Number(fieldId));
    if (!fieldName) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.status(200).json({ name: fieldName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch field name' });
  }
});

// Henter fields basert på campus ID
router.get('/fields/:campusId', async (req, res) => {
  try {
    const { campusId } = req.params;
    console.log(`[DEBUG] campusId: ${campusId}`);

    const [fields] = await pool
      .promise()
      .query<
        RowDataPacket[]
      >('SELECT id, name, campus_id AS campusId FROM Fields WHERE campus_id = ?', [campusId]);

    console.log(`[DEBUG] Fields fetched: ${JSON.stringify(fields)}`);

    if (!fields.length) {
      return res.status(200).json([]);
    }

    res.status(200).json(fields);
  } catch (error) {
    console.error(`[ERROR] Failed to fetch fields:`, error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export { router as fieldRouter };
