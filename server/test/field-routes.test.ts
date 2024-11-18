import request from 'supertest';
import app from '../src/app';
import fieldService from '../src/fields/field-service';

jest.mock('../src/fields/field-service', () => ({
  getFields: jest.fn(),
  getFieldsByCampus: jest.fn(),
  getFieldById: jest.fn(),
  getAllCampuses: jest.fn(),
  getTotalSubjectsCount: jest.fn(),
  getFieldNameById: jest.fn(),
}));

describe('Field Router (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /fields', () => {
    it('should fetch all fields', async () => {
      const mockFields = [
        { id: 101, name: 'Field A', campusId: 1 },
        { id: 102, name: 'Field B', campusId: 1 },
      ];

      // Mock respons for hentede felt
      (fieldService.getFields as jest.Mock).mockResolvedValue(mockFields);

      const response = await request(app).get('/api/v2/fields');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFields);
      expect(fieldService.getFields).toHaveBeenCalledTimes(1); // Verifiser at funksjonen er kalt
    });

    it('should return 500 if fetching all fields fails', async () => {
      (fieldService.getFields as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v2/fields');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch fields' });
      expect(fieldService.getFields).toHaveBeenCalledTimes(1); // Verifiser at funksjonen er kalt
    });
  });

  describe('GET /fields/campuses', () => {
    it('should fetch all campuses', async () => {
      const mockCampuses = [
        { campusId: 1, name: 'Campus 1' },
        { campusId: 2, name: 'Campus 2' },
      ];

      (fieldService.getAllCampuses as jest.Mock).mockResolvedValue(mockCampuses);

      const response = await request(app).get('/api/v2/fields/campuses');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCampuses);
      expect(fieldService.getAllCampuses).toHaveBeenCalledTimes(1); // Verifiser at funksjonen er kalt
    });

    it('should return 500 if fetching campuses fails', async () => {
      (fieldService.getAllCampuses as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v2/fields/campuses');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch campuses' });
      expect(fieldService.getAllCampuses).toHaveBeenCalledTimes(1); // Verifiser at funksjonen er kalt
    });
  });

  describe('GET /fields/campus/:campus', () => {
    it('should fetch fields by campus name', async () => {
      const mockFields = [
        { id: 101, name: 'Field A', campusId: 1 },
        { id: 102, name: 'Field B', campusId: 1 },
      ];

      (fieldService.getFieldsByCampus as jest.Mock).mockResolvedValue(mockFields);

      const response = await request(app).get('/api/v2/fields/campus/TestCampus');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockFields);
      expect(fieldService.getFieldsByCampus).toHaveBeenCalledWith('TestCampus');
    });

    it('should return 404 if campus is not found', async () => {
      (fieldService.getFieldsByCampus as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/v2/fields/campus/UnknownCampus');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Campus not found' });
      expect(fieldService.getFieldsByCampus).toHaveBeenCalledWith('UnknownCampus');
    });

    it('should return 500 if fetching fields for a campus fails', async () => {
      (fieldService.getFieldsByCampus as jest.Mock).mockRejectedValue(
        new Error('Database query error'),
      );

      const response = await request(app).get('/api/v2/fields/campus/SomeCampus');
      expect(response.status).toBe(500); // Verifiser at statusen er 500
      expect(response.body).toEqual({ error: 'Failed to fetch fields for campus' }); // Feilmelding
    });
  });

  describe('GET /fields/:fieldId', () => {
    it('should fetch a field by ID', async () => {
      const mockField = { id: 101, name: 'Field A', campusId: 1 };
      (fieldService.getFieldById as jest.Mock).mockResolvedValue(mockField);

      const response = await request(app).get('/api/v2/fields/101');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockField);
      expect(fieldService.getFieldById).toHaveBeenCalledWith(101);
    });

    it('should return 404 if field by ID does not exist', async () => {
      (fieldService.getFieldById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v2/fields/999');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Field not found' });
      expect(fieldService.getFieldById).toHaveBeenCalledWith(999);
    });
  });
});
