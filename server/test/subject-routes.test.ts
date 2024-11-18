import express from 'express';
import request from 'supertest';
import { subjectRouter } from '../src/subjects/subject-router';
import subjectService from '../src/subjects/subject-service';

jest.mock('../src/subjects/subject-service');

const app = express();
app.use(express.json());
app.use('/api/v2', subjectRouter);

describe('Subject Router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /fields/:fieldId/subjects', () => {
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
    it('should add a new subject', async () => {
      (subjectService.createSubject as jest.Mock).mockResolvedValue('3');

      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
        level: 2,
        description: 'Physics course description',
      });

      expect(response.status).toBe(201); // Status changed from 200 to 201
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

    it('should handle missing fields in POST request', async () => {
      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'ID, navn, nivå og beskrivelse er påkrevd',
      }); // Updated error message
      expect(subjectService.createSubject).not.toHaveBeenCalled();
    });
  });

  describe('PUT /subjects/:subjectId', () => {
    it('should return 400 if the request body is missing required fields', async () => {
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'User ID and level ID are required', // Updated error message
      });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

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
      expect(subjectService.updateSubjectLevel).toHaveBeenCalledWith('123', 2); // Only level is updated here
    });
  });

  describe('GET /levels', () => {
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
    it('should delete the subject if user is authorized', async () => {
      const mockSubjectId = '123';
      const mockUserId = '35';

      (subjectService.deleteSubject as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v2/subjects/${mockSubjectId}`) // Use proper backticks here
        .send({ userId: mockUserId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Subject deleted successfully' });
      expect(subjectService.deleteSubject).toHaveBeenCalledWith(mockSubjectId);
    });

    it('should return 500 if subject deletion fails', async () => {
      const mockSubjectId = '123';
      const mockUserId = '35';

      (subjectService.deleteSubject as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/v2/subjects/${mockSubjectId}`) // Use proper backticks here
        .send({ userId: mockUserId });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Could not delete subject' });
      expect(subjectService.deleteSubject).toHaveBeenCalledWith(mockSubjectId);
    });
  });
});
