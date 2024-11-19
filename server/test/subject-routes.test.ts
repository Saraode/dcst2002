import express from 'express';
import request from 'supertest';
import { subjectRouter } from '../src/subjects/subject-router';
import subjectService from '../src/subjects/subject-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/subjects/subject-service');

jest.mock('../src/mysql-pool', () => {
  const queryMock = jest.fn();
  return {
    pool: {
      promise: jest.fn().mockReturnValue({
        query: queryMock,
      }),
    },
  };
});

const app = express();
app.use(express.json());
app.use('/api/v2', subjectRouter);

const queryMock = pool.promise().query as jest.Mock;

describe('Subject Router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /fields/:fieldId/subjects', () => {
    // Tester å hente alle emner basert på felt-ID
    it('should fetch all subjects by field ID', async () => {
      const mockSubjects = [
        { id: '1', name: 'Math', fieldId: 101, levelId: 1, description: 'Basic math course' },
        {
          id: '2',
          name: 'Science',
          fieldId: 101,
          levelId: 2,
          description: 'Advanced science course',
        },
      ];
      (subjectService.getSubjectsByField as jest.Mock).mockResolvedValue(mockSubjects);

      const response = await request(app).get('/api/v2/fields/101/subjects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSubjects);
      expect(subjectService.getSubjectsByField).toHaveBeenCalledWith(101);
    });

    // Tester feilhåndtering ved henting av emner
    it('should return error if fetching subjects fails', async () => {
      (subjectService.getSubjectsByField as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).get('/api/v2/fields/101/subjects');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch subjects' });
    });
  });

  describe('POST /fields/:fieldId/subjects', () => {
    // Tester å legge til et nytt emne
    it('should add a new subject', async () => {
      (subjectService.createSubject as jest.Mock).mockResolvedValue('3');

      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
        level: 2,
        description: 'Physics course description',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: '3',
        name: 'Physics',
        level: 2,
        description: 'Physics course description',
      });
      expect(subjectService.createSubject).toHaveBeenCalledWith(
        '3',
        'Physics',
        101,
        2,
        'Physics course description',
      );
    });

    // Tester feilmelding hvis obligatoriske felter mangler
    it('should handle missing fields in POST request', async () => {
      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'ID, navn, nivå og beskrivelse er påkrevd',
      });
      expect(subjectService.createSubject).not.toHaveBeenCalled();
    });
  });

  describe('PUT /subjects/:subjectId', () => {
    // Tester feilmelding hvis obligatoriske felter mangler i PUT-forespørsel
    it('should return 400 if the request body is missing required fields', async () => {
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'User ID and level ID are required',
      });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    // Tester feilhåndtering når tjenesten kaster en feil
    it('should return 500 if the service throws an error', async () => {
      (subjectService.updateSubjectLevel as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
        levelId: 2,
        description: 'Updated description',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Could not update subject' });
      expect(subjectService.updateSubjectLevel).toHaveBeenCalledWith('123', 2);
    });
  });

  describe('GET /levels', () => {
    // Tester å hente alle nivåer
    it('should fetch all levels successfully', async () => {
      const mockLevels = [
        { id: 1, name: 'Beginner' },
        { id: 2, name: 'Intermediate' },
        { id: 3, name: 'Advanced' },
      ];

      (subjectService.getAllLevels as jest.Mock).mockResolvedValue(mockLevels);

      const response = await request(app).get('/api/v2/levels');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLevels);
      expect(subjectService.getAllLevels).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /subjects/:subjectId', () => {
    // Tester å slette et emne hvis brukeren er autorisert
    it('should delete the subject if user is authorized', async () => {
      const mockSubjectId = '123';
      const mockUserId = '35';

      (subjectService.deleteSubject as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v2/subjects/${mockSubjectId}`)
        .send({ userId: mockUserId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Subject deleted successfully' });
      expect(subjectService.deleteSubject).toHaveBeenCalledWith(mockSubjectId);
    });

    // Tester feilhåndtering ved sletting av emne
    it('should return 500 if subject deletion fails', async () => {
      const mockSubjectId = '123';
      const mockUserId = '35';

      (subjectService.deleteSubject as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/v2/subjects/${mockSubjectId}`)
        .send({ userId: mockUserId });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Could not delete subject' });
      expect(subjectService.deleteSubject).toHaveBeenCalledWith(mockSubjectId);
    });
  });

  describe('GET /fields/:fieldId/subject-counts', () => {
    // Tester å hente antall emner for en gitt felt-ID
    it('should return subject counts for a given fieldId', async () => {
      const mockFieldId = 101;
      const mockCounts = { level1: 10, level2: 5 };

      (subjectService.getSubjectCountByLevel as jest.Mock).mockResolvedValue(mockCounts);

      const response = await request(app).get(`/api/v2/fields/${mockFieldId}/subject-counts`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCounts);
      expect(subjectService.getSubjectCountByLevel).toHaveBeenCalledWith(mockFieldId);
    });

    // Tester feilhåndtering ved henting av antall emner
    it('should return 500 if fetching subject counts fails', async () => {
      const mockFieldId = 101;

      (subjectService.getSubjectCountByLevel as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).get(`/api/v2/fields/${mockFieldId}/subject-counts`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch subject counts' });
    });
  });

  describe('GET /search', () => {
    // Tester å søke etter emner basert på gyldige søkespørsmål
    it('should return search results for valid queries', async () => {
      const mockResults = [
        { id: 'MATH101', name: 'Mathematics 101' },
        { id: 'PHYS101', name: 'Physics 101' },
      ];

      queryMock.mockResolvedValueOnce([mockResults, []]);

      const response = await request(app).get('/api/v2/search?query=math');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResults);
    });

    // Tester at søk uten parameter returnerer feil
    it('should return 400 if the query parameter is missing', async () => {
      const response = await request(app).get('/api/v2/search');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Query parameter is required' });
    });

    // Tester at søk med tom parameter returnerer feil
    it('should return 400 if the query parameter is empty', async () => {
      const response = await request(app).get('/api/v2/search?query=');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Query parameter is required' });
    });

    // Tester feilhåndtering ved feil under søk
    it('should return 500 if the query throws an error', async () => {
      queryMock.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/v2/search?query=math');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch search results' });
    });

    // Tester at tomt resultat returneres når ingen resultater matcher
    it('should return an empty array if no results match the query', async () => {
      queryMock.mockResolvedValueOnce([[], []]);

      const response = await request(app).get('/api/v2/search?query=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
