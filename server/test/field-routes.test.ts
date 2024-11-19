import request from 'supertest';
import app from '../src/app';
import fieldService from '../src/fields/field-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/fields/field-service', () => ({
  getFields: jest.fn(),
  getAllCampuses: jest.fn(),
  getFieldsByCampus: jest.fn(),
  getFieldById: jest.fn(),
  getTotalSubjectsCount: jest.fn(),
  getFieldNameById: jest.fn(),
}));
jest.mock('../src/mysql-pool', () => ({
  pool: {
    promise: jest.fn().mockReturnValue({
      query: jest.fn(),
    }),
  },
}));

const mockQuery = pool.promise().query as jest.Mock;

describe('Field Router Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v2/fields', () => {
    // Tester at alle fields hentes korrekt
    it('should fetch all fields successfully', async () => {
      const mockFields = [
        { id: 1, name: 'Field A' },
        { id: 2, name: 'Field B' },
      ];
      (fieldService.getFields as jest.Mock).mockResolvedValue(mockFields);

      const response = await request(app).get('/api/v2/fields');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFields);
    });

    // Tester at feil ved henting av fields håndteres korrekt
    it('should handle errors when fetching fields', async () => {
      (fieldService.getFields as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v2/fields');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch fields' });
    });
  });

  describe('GET /api/v2/fields/campuses', () => {
    // Tester at alle campuser hentes korrekt
    it('should fetch all campuses successfully', async () => {
      const mockCampuses = [
        { id: 1, name: 'Campus A' },
        { id: 2, name: 'Campus B' },
      ];
      (fieldService.getAllCampuses as jest.Mock).mockResolvedValue(mockCampuses);

      const response = await request(app).get('/api/v2/fields/campuses');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCampuses);
    });

    // Tester at feil ved henting av campuser håndteres korrekt
    it('should handle errors when fetching campuses', async () => {
      (fieldService.getAllCampuses as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v2/fields/campuses');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch campuses' });
    });
  });

  describe('GET /api/v2/fields/campus/:campus', () => {
    // Tester at fields for en spesifikk campus hentes korrekt
    it('should fetch fields for a specific campus successfully', async () => {
      const mockFields = [{ id: 1, name: 'Field A' }];
      (fieldService.getFieldsByCampus as jest.Mock).mockResolvedValue(mockFields);

      const response = await request(app).get('/api/v2/fields/campus/TestCampus');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFields);
    });

    // Tester at 404 returneres hvis ingen fields finnes for en campus
    it('should return 404 if no fields are found for a campus', async () => {
      (fieldService.getFieldsByCampus as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/v2/fields/campus/UnknownCampus');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Campus not found' });
    });
  });

  describe('GET /api/v2/fields/:fieldId', () => {
    // Tester at en field hentes korrekt basert på ID
    it('should fetch a field by ID successfully', async () => {
      const mockField = { id: 1, name: 'Field A' };
      (fieldService.getFieldById as jest.Mock).mockResolvedValue(mockField);

      const response = await request(app).get('/api/v2/fields/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockField);
    });

    // Tester at 404 returneres hvis en field ikke finnes basert på ID
    it('should return 404 if a field is not found by ID', async () => {
      (fieldService.getFieldById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v2/fields/999');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Field not found' });
    });
  });

  describe('GET /api/v2/fields/campus/:campus/fields', () => {
    // Tester at fields for en spesifikk campus hentes korrekt med ekstra endepunkt
    it('should fetch fields for a specific campus successfully', async () => {
      const mockFields = [
        { id: 1, name: 'Field A', campusId: 1 },
        { id: 2, name: 'Field B', campusId: 1 },
      ];
      (fieldService.getFieldsByCampus as jest.Mock).mockResolvedValueOnce(mockFields);

      const response = await request(app).get('/api/v2/fields/campus/TestCampus/fields');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFields);
      expect(fieldService.getFieldsByCampus).toHaveBeenCalledWith('TestCampus');
    });
  });
});
