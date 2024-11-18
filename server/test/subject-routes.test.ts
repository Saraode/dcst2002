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
      // Tester at alle emner hentes ved felt-ID
      const mockSubjects = [
        { id: '1', name: 'Math', fieldId: 101, levelId: 1 },
        { id: '2', name: 'Science', fieldId: 101, levelId: 2 },
      ];
      (subjectService.getSubjectsByField as jest.Mock).mockResolvedValue(mockSubjects);

      const response = await request(app).get('/api/v2/fields/101/subjects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSubjects);
      expect(subjectService.getSubjectsByField).toHaveBeenCalledWith(101);
    });

    it('should return error if fetching subjects fails', async () => {
      // Tester at feil returneres ved feilet henting av emner
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
      // Tester at nytt emne blir lagt til
      (subjectService.createSubject as jest.Mock).mockResolvedValue('3');

      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
        level: 2,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '3', name: 'Physics', level: 2 });
      expect(subjectService.createSubject).toHaveBeenCalledWith('3', 'Physics', 101, 2);
    });

    it('should handle missing fields in POST request', async () => {
      // Tester håndtering av manglende felt i POST-forespørsel
      const response = await request(app).post('/api/v2/fields/101/subjects').send({
        id: '3',
        name: 'Physics',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'ID, name, or level missing' });
      expect(subjectService.createSubject).not.toHaveBeenCalled();
    });
  });

  describe('PUT /subjects/:subjectId', () => {
    it('should update the subject level successfully', async () => {
      // Tester at emne-nivå blir oppdatert
      (subjectService.updateSubjectLevel as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
        levelId: 2,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Subject level updated successfully' });
      expect(subjectService.updateSubjectLevel).toHaveBeenCalledWith('123', 2);
    });

    it('should return 403 if the user is not authorized', async () => {
      // Tester om uautorisert bruker får 403
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 34,
        levelId: 2,
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Not authorized to edit this subject' });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    it('should return 500 if the service throws an error', async () => {
      // Tester om 500 returneres ved feil i tjenesten
      (subjectService.updateSubjectLevel as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
        levelId: 2,
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Could not update subject level' });
      expect(subjectService.updateSubjectLevel).toHaveBeenCalledWith('123', 2);
    });
  });

  describe('PUT /subjects/:subjectId - Additional Tests', () => {
    it('should return 400 if the request body is missing userId', async () => {
      // Tester om 400 returneres ved manglende userId
      const response = await request(app).put('/api/v2/subjects/123').send({
        levelId: 2,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User ID and level ID are required' });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    it('should return 400 if the request body is missing levelId', async () => {
      // Tester om 400 returneres ved manglende levelId
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User ID and level ID are required' });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    it('should return 400 if userId is not a number', async () => {
      // Tester om 400 returneres ved ugyldig userId
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 'not-a-number',
        levelId: 2,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User ID must be a number' });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    it('should return 400 if levelId is not a number', async () => {
      // Tester om 400 returneres ved ugyldig levelId
      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
        levelId: 'not-a-number',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Level ID must be a number' });
      expect(subjectService.updateSubjectLevel).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Tester om uventede feil håndteres korrekt
      (subjectService.updateSubjectLevel as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app).put('/api/v2/subjects/123').send({
        userId: 35,
        levelId: 2,
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Could not update subject level' });
      expect(subjectService.updateSubjectLevel).toHaveBeenCalledWith('123', 2);
    });
  });

  describe('GET /levels', () => {
    it('should fetch all levels successfully', async () => {
      // Tester at alle nivåer hentes riktig
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

    it('should return 500 if fetching levels fails', async () => {
      // Tester feil ved henting av nivåer
      (subjectService.getAllLevels as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v2/levels');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch levels' });
      expect(subjectService.getAllLevels).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /subjects/:subjectId', () => {
    it('should delete the subject if user is authorized', async () => {
      // Tester om emnet blir slettet dersom brukeren er autorisert
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

    it('should return 403 if user is not authorized', async () => {
      // Tester at 403 returneres hvis bruker ikke er autorisert
      const mockSubjectId = '123';
      const mockUserId = '34';

      const response = await request(app)
        .delete(`/api/v2/subjects/${mockSubjectId}`)
        .send({ userId: mockUserId });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Not authorized to delete this subject' });
      expect(subjectService.deleteSubject).not.toHaveBeenCalled();
    });

    it('should return 500 if subject deletion fails', async () => {
      // Tester at 500 returneres ved feil ved sletting av emne
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
});
