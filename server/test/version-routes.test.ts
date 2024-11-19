import express from 'express';
import request from 'supertest';
import versionRouter from '../src/versions/version-routes';
import { versionService } from '../src/versions/version-service';

jest.mock('../src/mysql-pool', () => {
  const queryMock = jest.fn();
  return {
    queryMock,
    pool: {
      promise: jest.fn(() => ({
        query: queryMock,
      })),
    },
  };
});

jest.mock('../src/versions/version-service', () => ({
  versionService: {
    getSubjectsByVersion: jest.fn(),
    createPageVersion: jest.fn(),
    createSubjectVersion: jest.fn(),
  },
}));

const { queryMock } = jest.requireMock('../src/mysql-pool');

const app = express();
app.use(express.json());
app.use('/api/v2', versionRouter);

describe('Version Routes - POST /subjects/:subjectId/reviews/version', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skal opprette en ny anmeldelseversjon', async () => {
    // Tester at en ny anmeldelseversjon opprettes med gyldige data
    const mockSubjectId = '123';
    const mockReviews = [{ id: 1, comment: 'Great subject!' }];
    const mockUserId = 'user1';
    const mockActionType = 'edit';

    queryMock.mockResolvedValueOnce([{ insertId: 1 }]);

    const response = await request(app)
      .post(`/api/v2/subjects/${mockSubjectId}/reviews/version`)
      .send({
        reviews: mockReviews,
        userId: mockUserId,
        actionType: mockActionType,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Versjonering fullført' });

    expect(queryMock).toHaveBeenCalledWith(
      'INSERT INTO subject_review_versions (subject_Id, reviews, user_Id, action_type, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [mockSubjectId, JSON.stringify(mockReviews), mockUserId, mockActionType],
    );
  });

  it('skal returnere 500 ved databasefeil', async () => {
    // Tester at det returneres status 500 hvis en databasefeil oppstår
    const mockSubjectId = '123';
    const mockReviews = [{ id: 1, comment: 'Great subject!' }];
    const mockUserId = 'user1';
    const mockActionType = 'edit';

    queryMock.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post(`/api/v2/subjects/${mockSubjectId}/reviews/version`)
      .send({
        reviews: mockReviews,
        userId: mockUserId,
        actionType: mockActionType,
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Kunne ikke lagre versjonsdata' });

    expect(queryMock).toHaveBeenCalledWith(
      'INSERT INTO subject_review_versions (subject_Id, reviews, user_Id, action_type, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [mockSubjectId, JSON.stringify(mockReviews), mockUserId, mockActionType],
    );
  });

  it('skal returnere 400 hvis påkrevde felter mangler', async () => {
    // Tester at det returneres status 400 hvis påkrevde felter mangler i forespørselen
    const response = await request(app)
      .post('/api/v2/subjects/123/reviews/version')
      .send({
        reviews: [{ id: 1, comment: 'Great subject!' }],
        userId: null,
        actionType: 'edit',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required fields: userId or actionType' });
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('Version Router - Increment View', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skal øke antall visninger', async () => {
    // Tester at antall visninger for et emne økes korrekt
    queryMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(app).post('/api/v2/subjects/123/increment-view');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Antall visninger økt' });
    expect(queryMock).toHaveBeenCalledWith(
      'UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?',
      ['123'],
    );
  });

  it('skal returnere 404 hvis emne ikke finnes', async () => {
    // Tester at det returneres status 404 hvis emnet ikke eksisterer
    queryMock.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(app).post('/api/v2/subjects/123/increment-view');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Emne ikke funnet' });
    expect(queryMock).toHaveBeenCalledWith(
      'UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?',
      ['123'],
    );
  });

  it('skal returnere 500 ved databasefeil', async () => {
    // Tester at det returneres status 500 hvis en databasefeil oppstår
    queryMock.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).post('/api/v2/subjects/123/increment-view');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Kunne ikke øke antall visninger' });
    expect(queryMock).toHaveBeenCalledWith(
      'UPDATE Subjects SET view_count = view_count + 1 WHERE id = ?',
      ['123'],
    );
  });
});

describe('Version Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/history', () => {
    it('skal hente endringshistorikk', async () => {
      // Tester at endringshistorikk hentes korrekt fra databasen
      const mockHistory = [
        {
          version_number: 1,
          timestamp: '2024-01-01',
          user_name: 'Test User',
          action_type: 'added',
        },
      ];

      queryMock.mockResolvedValueOnce([mockHistory]);

      const response = await request(app).get('/api/v2/api/history');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockHistory);
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it('skal returnere 500 ved feil under henting av historikk', async () => {
      // Tester at det returneres status 500 ved en databasefeil under henting av historikk
      queryMock.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/v2/api/history');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke hente endringshistorikk' });
      expect(queryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /versions/:versionId/subjects', () => {
    it('skal hente emner for en gitt versjon', async () => {
      // Tester at emner for en gitt versjon hentes korrekt fra tjenesten
      const mockSubjects = ['subject1', 'subject2'];

      (versionService.getSubjectsByVersion as jest.Mock).mockResolvedValueOnce(mockSubjects);

      const response = await request(app).get('/api/v2/versions/1/subjects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSubjects);
      expect(versionService.getSubjectsByVersion).toHaveBeenCalledWith(1);
    });

    it('skal returnere 500 ved feil under tjenestekall', async () => {
      // Tester at det returneres status 500 hvis tjenesten feiler
      (versionService.getSubjectsByVersion as jest.Mock).mockRejectedValueOnce(
        new Error('Service error'),
      );

      const response = await request(app).get('/api/v2/versions/1/subjects');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke hente emner for versjon' });
      expect(versionService.getSubjectsByVersion).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /fields/:fieldId/version', () => {
    it('skal opprette en ny versjon av felt', async () => {
      // Tester at en ny versjon av et felt opprettes korrekt
      (versionService.createPageVersion as jest.Mock).mockResolvedValueOnce(2);

      const response = await request(app).post('/api/v2/fields/101/version').send({
        userId: 'testUser',
        description: 'New version',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ version: 2 });
      expect(versionService.createPageVersion).toHaveBeenCalledWith(101, 'testUser', 'New version');
    });

    it('skal returnere 400 hvis bruker-ID mangler', async () => {
      // Tester at det returneres status 400 hvis bruker-ID mangler i forespørselen
      const response = await request(app).post('/api/v2/fields/101/version').send({
        description: 'New version',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Bruker-ID er påkrevd for versjonering' });
      expect(versionService.createPageVersion).not.toHaveBeenCalled();
    });

    it('skal returnere 500 ved feil under oppretting av versjon', async () => {
      // Tester at det returneres status 500 ved en feil under oppretting av versjon
      (versionService.createPageVersion as jest.Mock).mockRejectedValueOnce(
        new Error('Service error'),
      );

      const response = await request(app).post('/api/v2/fields/101/version').send({
        userId: 'testUser',
        description: 'New version',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke opprette feltversjon' });
      expect(versionService.createPageVersion).toHaveBeenCalledWith(101, 'testUser', 'New version');
    });
  });

  describe('POST /subjects/:subjectId/version', () => {
    it('skal opprette en ny emneversjon', async () => {
      // Tester at en ny versjon av et emne opprettes korrekt
      (versionService.createSubjectVersion as jest.Mock).mockResolvedValueOnce(1);

      const response = await request(app).post('/api/v2/subjects/123/version').send({
        userId: 'user1',
        actionType: 'edit',
        description: 'Updated version',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Versjon opprettet', version: 1 });
      expect(versionService.createSubjectVersion).toHaveBeenCalledWith(
        '123',
        'user1',
        'edit',
        'Updated version',
      );
    });

    it('skal returnere 400 hvis bruker-ID eller handlingstype mangler', async () => {
      // Tester at det returneres status 400 hvis bruker-ID eller handlingstype mangler
      const response = await request(app).post('/api/v2/subjects/123/version').send({
        description: 'Updated version',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Bruker-ID og handlingstype er påkrevd' });
      expect(versionService.createSubjectVersion).not.toHaveBeenCalled();
    });

    it('skal returnere 500 ved feil under tjenestekall', async () => {
      // Tester at det returneres status 500 hvis tjenesten feiler under oppretting av emneversjon
      (versionService.createSubjectVersion as jest.Mock).mockRejectedValueOnce(
        new Error('Service error'),
      );

      const response = await request(app).post('/api/v2/subjects/123/version').send({
        userId: 'user1',
        actionType: 'edit',
        description: 'Updated version',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke opprette emneversjon' });
      expect(versionService.createSubjectVersion).toHaveBeenCalledWith(
        '123',
        'user1',
        'edit',
        'Updated version',
      );
    });
  });
});
