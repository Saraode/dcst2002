import request from 'supertest';
import app from '../src/app';
import { versionService } from '../src/version-service';

// Mock version
jest.mock('../src/version-service', () => ({
  versionService: {
    createPageVersion: jest.fn(),
    getSubjectsByVersion: jest.fn(),
    createSubjectVersion: jest.fn(),
  },
}));

// Mock pool.promise().query
jest.mock('../src/mysql-pool', () => {
  return {
    pool: {
      promise: jest.fn().mockReturnValue({
        query: jest.fn(),
      }),
    },
  };
});

describe('Versioning API (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPageVersion', () => {
    it('should create a new field version', async () => {
      // Tester om en ny versjon for feltet blir opprettet
      (versionService.createPageVersion as jest.Mock).mockResolvedValue(2);

      const response = await request(app).post('/api/fields/101/version').send({ userId: '1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ version: 2 });
      expect(versionService.createPageVersion).toHaveBeenCalledWith(101, '1');
    });
  });

  describe('createSubjectVersion', () => {
    it('should create a new subject version', async () => {
      // Tester om en ny versjon for et emne blir opprettet
      (versionService.createSubjectVersion as jest.Mock).mockResolvedValue(3);

      const response = await request(app).post('/api/subjects/1001/version').send({
        userId: '1',
        actionType: 'edit',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Version created successfully', version: 3 });
      expect(versionService.createSubjectVersion).toHaveBeenCalledWith('1001', '1', 'edit');
    });
  });

  describe('getSubjectsByVersion', () => {
    it('should fetch subjects by version', async () => {
      // Tester om emnene blir hentet riktig basert på versjon
      (versionService.getSubjectsByVersion as jest.Mock).mockResolvedValue(['Math', 'Physics']);

      const response = await request(app).get('/api/versions/1/subjects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(['Math', 'Physics']);
      expect(versionService.getSubjectsByVersion).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Tester feilhåndtering når oppretting av versjon mislykkes
      (versionService.createPageVersion as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).post('/api/fields/101/version').send({ userId: '1' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create field version' });
    });
  });
});
