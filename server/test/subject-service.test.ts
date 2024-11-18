import subjectService from '../src/subjects/subject-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/mysql-pool', () => {
  const mockQuery = jest.fn();
  const mockPromiseQuery = jest.fn();

  return {
    pool: {
      query: mockQuery,
      promise: jest.fn().mockReturnValue({
        query: mockPromiseQuery,
      }),
    },
  };
});

describe('SubjectService', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Nullstiller mocks etter hver test
  });

  describe('getSubjectsByField', () => {
    it('should return a list of subjects by field ID', async () => {
      // Tester om listen av emner returneres ved felt-ID
      const mockSubjects = [
        { id: '1', name: 'Math', fieldId: 101, levelId: 1 },
        { id: '2', name: 'Science', fieldId: 101, levelId: 2 },
      ];

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, mockSubjects),
      );

      const result = await subjectService.getSubjectsByField(101);

      expect(result).toEqual(mockSubjects);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE fieldId = ? ORDER BY id ASC',
        [101],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      // Tester om det kastes feil ved feilet spørring
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectsByField(101)).rejects.toThrow('Database error');
    });
  });

  describe('createSubject', () => {
    it('should create a new subject and return its ID', async () => {
      // Tester om et nytt emne opprettes og ID returneres
      const mockSubjectId = '3';

      jest.spyOn(subjectService, 'getSubjectByIdCaseInsensitive').mockResolvedValueOnce(null);

      (pool.promise().query as jest.Mock).mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await subjectService.createSubject(mockSubjectId, 'Physics', 101, 2);

      expect(result).toBe(mockSubjectId);
      expect(subjectService.getSubjectByIdCaseInsensitive).toHaveBeenCalledWith(mockSubjectId);
      expect(pool.promise().query).toHaveBeenCalledWith(
        'INSERT INTO Subjects (id, name, fieldId, levelId) VALUES (?, ?, ?, ?)',
        [mockSubjectId, 'Physics', 101, 2],
      );
    });

    it('should throw an error if the subject already exists', async () => {
      // Tester om det kastes feil om emnet allerede finnes
      const mockSubjectId = '3';
      const mockExistingSubject = { id: '3', name: 'Physics', fieldId: 101, levelId: 2 };

      jest
        .spyOn(subjectService, 'getSubjectByIdCaseInsensitive')
        .mockResolvedValueOnce(mockExistingSubject);

      await expect(subjectService.createSubject(mockSubjectId, 'Physics', 101, 2)).rejects.toThrow(
        `Subject with ID '${mockSubjectId}' already exists`,
      );

      expect(subjectService.getSubjectByIdCaseInsensitive).toHaveBeenCalledWith(mockSubjectId);
      expect(pool.promise().query).not.toHaveBeenCalled(); // Ingen insert skal skje
    });
  });

  describe('deleteSubject', () => {
    it('should delete a subject and its reviews', async () => {
      // Tester om emnet og tilhørende vurderinger blir slettet
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) => callback(null));

      await subjectService.deleteSubject('3');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM Reviews WHERE subjectId = ?',
        ['3'],
        expect.any(Function),
      );
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM Subjects WHERE id = ?',
        ['3'],
        expect.any(Function),
      );
    });

    it('should throw an error if deleting reviews fails', async () => {
      // Tester om det kastes feil når sletting av vurderinger feiler
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Failed to delete reviews')),
      );

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete reviews');
    });

    it('should throw an error if deleting the subject fails', async () => {
      // Tester om det kastes feil når sletting av emnet feiler
      (pool.query as jest.Mock)
        .mockImplementationOnce((_query, _params, callback) => callback(null)) // Suksess med sletting av vurderinger
        .mockImplementationOnce((_query, _params, callback) =>
          callback(new Error('Failed to delete subject')),
        );

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete subject');
    });
  });

  describe('getSubject', () => {
    it('should return a subject with reviews if it exists', async () => {
      // Tester om et emne med vurderinger returneres når det eksisterer
      const mockSubject = {
        id: '1',
        name: 'Math',
        fieldId: 101,
        levelId: 1,
      };
      const mockReviews = [
        { id: 1, subjectId: '1', text: 'Great subject', stars: 5, submitterName: 'Alice' },
      ];

      (pool.query as jest.Mock)
        .mockImplementationOnce((_query, _params, callback) => callback(null, [mockSubject]))
        .mockImplementationOnce((_query, _params, callback) => callback(null, mockReviews));

      const result = await subjectService.getSubject('1');

      expect(result).toEqual({ ...mockSubject, reviews: mockReviews });
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE id = ?',
        ['1'],
        expect.any(Function),
      );
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC',
        ['1'],
        expect.any(Function),
      );
    });

    it('should return undefined if the subject does not exist', async () => {
      // Tester om undefined returneres hvis emnet ikke finnes
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, []),
      );

      const result = await subjectService.getSubject('nonexistent-id');

      expect(result).toBeUndefined();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE id = ?',
        ['nonexistent-id'],
        expect.any(Function),
      );
    });
  });

  describe('getSubjectCountByLevel', () => {
    it('should return the count of subjects grouped by level', async () => {
      // Tester om antall emner grupperes etter nivå
      const mockCounts = [
        { levelId: 1, count: 5 },
        { levelId: 2, count: 3 },
        { levelId: null, count: 8 }, // WITH ROLLUP result
      ];

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, mockCounts),
      );

      const result = await subjectService.getSubjectCountByLevel(101);

      expect(result).toEqual(mockCounts);
      expect(pool.query).toHaveBeenCalledWith(
        `
      SELECT levelId, COUNT(*) as count 
      FROM Subjects 
      WHERE fieldId = ? 
      GROUP BY levelId WITH ROLLUP
      `,
        [101],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      // Tester om det kastes feil når spørringen feiler
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectCountByLevel(101)).rejects.toThrow('Database error');
    });
  });

  describe('updateSubjectLevel', () => {
    it('should update the level of a subject successfully', async () => {
      // Tester om emne-nivå blir oppdatert
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) => callback(null));

      await subjectService.updateSubjectLevel('1', 2);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE Subjects SET levelId = ? WHERE id = ?',
        [2, '1'],
        expect.any(Function),
      );
    });

    it('should throw an error if updating the subject level fails', async () => {
      // Tester om det kastes feil ved oppdatering av nivå
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Update failed')),
      );

      await expect(subjectService.updateSubjectLevel('1', 2)).rejects.toThrow('Update failed');

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE Subjects SET levelId = ? WHERE id = ?',
        [2, '1'],
        expect.any(Function),
      );
    });
  });

  describe('getTotalSubjectsCount', () => {
    it('should return the total count of subjects for a given field ID', async () => {
      // Tester om totalt antall emner for et felt-ID returneres
      const mockCount = [{ total: 5 }];

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, mockCount),
      );

      const result = await subjectService.getTotalSubjectsCount(101);

      expect(result).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });

    it('should return 0 if no subjects exist for the given field ID', async () => {
      // Tester om 0 returneres når det ikke finnes emner for felt-ID
      const mockCount = [{ total: 0 }];

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, mockCount),
      );

      const result = await subjectService.getTotalSubjectsCount(101);

      expect(result).toBe(0);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });

    it('should throw an error if fetching the total count fails', async () => {
      // Tester om det kastes feil ved feilet spørring
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Query failed')),
      );

      await expect(subjectService.getTotalSubjectsCount(101)).rejects.toThrow('Query failed');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });
  });
});
