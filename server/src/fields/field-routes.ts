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

// Henter fields fra spesifikt campus
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

// Henter field etter id
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

router.get('/campus/:campus/fields', async (req, res) => {
  const { campus } = req.params;
  try {
    const fields = await fieldService.getFieldsByCampus(campus);
    res.json(fields || []); // Always return an array
  } catch (error) {
    console.error('Error fetching fields for campus:', error);
    res.status(500).json({ error: 'Failed to fetch fields for campus' });
  }
});

//Henter antall subjects for fields
router.get('/fields/:fieldId/total-subjects-count', async (req, res) => {
  const { fieldId } = req.params;

  try {
    console.log(`[INFO] Fetching total subjects count for field ID: ${fieldId}`);
    const totalSubjectsCount = await fieldService.getTotalSubjectsCount(Number(fieldId));
    console.log(`[SUCCESS] Total subjects count for field ID ${fieldId}: ${totalSubjectsCount}`);
    res.status(200).json({ total: totalSubjectsCount });
  } catch (error) {
    console.error(`[ERROR] Failed to fetch total subjects count for field ID ${fieldId}:`, error);
    res.status(500).json({ error: 'Failed to fetch total subjects count' });
  }
});

//Henter field navn
router.get('/fields/:fieldId/name', async (req, res) => {
  const { fieldId } = req.params;

  try {
    console.log(`[INFO] Fetching field name for field ID: ${fieldId}`);
    const fieldName = await fieldService.getFieldNameById(Number(fieldId));

    if (fieldName) {
      console.log(`[SUCCESS] Field name fetched: ${fieldName}`);
      res.status(200).json({ name: fieldName });
    } else {
      console.error(`[ERROR] Field ID ${fieldId} not found.`);
      res.status(404).json({ error: 'Field not found' });
    }
  } catch (error) {
    console.error(`[ERROR] Failed to fetch field name for field ID ${fieldId}:`, error);
    res.status(500).json({ error: 'Failed to fetch field name' });
  }
});

router.get('/fields/:campusId', async (req, res) => {
  const { campusId } = req.params;

  try {
    // Execute the query to fetch fields for the given campus ID
    const [fields] = await pool
      .promise()
      .query<RowDataPacket[]>('SELECT id, name FROM Fields WHERE campus_id = ?', [campusId]);

    // Always return an array, even if no fields are found
    res.json(fields || []);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export { router as fieldRouter };
