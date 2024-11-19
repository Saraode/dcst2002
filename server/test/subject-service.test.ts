import subjectService from '../src/subjects/subject-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/mysql-pool', () => {
  const mockQuery = jest.fn();
  const mockGetConnection = jest.fn().mockResolvedValue({
    query: mockQuery,
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  });

  return {
    pool: {
      query: mockQuery,
      promise: jest.fn().mockReturnValue({
        query: mockQuery,
        getConnection: mockGetConnection,
      }),
    },
  };
});

describe('SubjectService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteSubject', () => {
    it('should throw an error if deleting reviews fails', async () => {
      const mockConnection = await pool.promise().getConnection();

      (mockConnection.query as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to delete reviews');
      });

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete reviews');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should throw an error if deleting the subject fails', async () => {
      const mockConnection = await pool.promise().getConnection();

      (mockConnection.query as jest.Mock).mockResolvedValueOnce(null);

      (mockConnection.query as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to delete subject');
      });

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete subject');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getSubjectsByField', () => {
    it('should return a list of subjects by field ID', async () => {
      const mockSubjects = [
        { id: '1', name: 'Math', fieldId: 101, levelId: 1 },
        { id: '2', name: 'Science', fieldId: 101, levelId: 2 },
      ];

      const mockQuery = pool.promise().query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockSubjects));

      const result = await subjectService.getSubjectsByField(101);

      expect(result).toEqual(mockSubjects);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE fieldId = ? ORDER BY id ASC',
        [101],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectsByField(101)).rejects.toThrow('Database error');
    });
  });

  describe('getSubjectsByFieldAndLevel', () => {
    it('should return subjects for a given field and level', async () => {
      const mockSubjects = [
        { id: '1', name: 'Math', fieldId: 101, levelId: 1 },
        { id: '2', name: 'Science', fieldId: 101, levelId: 1 },
      ];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockSubjects));

      const result = await subjectService.getSubjectsByFieldAndLevel(101, 1);

      expect(result).toEqual(mockSubjects);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE fieldId = ? AND levelId = ? ORDER BY id ASC',
        [101, 1],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectsByFieldAndLevel(101, 1)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getSubject', () => {
    it('should return a subject with reviews if it exists', async () => {
      const mockSubject = {
        id: '1',
        name: 'Math',
        fieldId: 101,
        levelId: 1,
      };
      const mockReviews = [
        { id: 1, subjectId: '1', text: 'Great subject', stars: 5, submitterName: 'Alice' },
      ];

      const mockQuery = pool.query as jest.Mock;
      mockQuery
        .mockImplementationOnce((_query, _params, callback) => callback(null, [mockSubject]))
        .mockImplementationOnce((_query, _params, callback) => callback(null, mockReviews));

      const result = await subjectService.getSubject('1');

      expect(result).toEqual({ ...mockSubject, reviews: mockReviews });
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE id = ?',
        ['1'],
        expect.any(Function),
      );
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC',
        ['1'],
        expect.any(Function),
      );
    });

    it('should return undefined if the subject does not exist', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, []));

      const result = await subjectService.getSubject('nonexistent-id');

      expect(result).toBeUndefined();
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE id = ?',
        ['nonexistent-id'],
        expect.any(Function),
      );
    });
  });

  describe('updateSubjectDescription', () => {
    it('should update the subject description successfully', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null));

      await expect(
        subjectService.updateSubjectDescription('1', 'Updated description'),
      ).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE Subjects SET description = ? WHERE id = ?',
        ['Updated description', '1'],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(
        subjectService.updateSubjectDescription('1', 'Updated description'),
      ).rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE Subjects SET description = ? WHERE id = ?',
        ['Updated description', '1'],
        expect.any(Function),
      );
    });
  });

  describe('searchSubjects', () => {
    it('should return a list of subjects matching the search term', async () => {
      const mockSubjects = [
        { id: '1', name: 'Math' },
        { id: '2', name: 'Mathematics' },
      ];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockSubjects));

      const result = await subjectService.searchSubjects('Math');

      expect(result).toEqual(mockSubjects);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE name LIKE ?',
        ['%Math%'],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.searchSubjects('Math')).rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE name LIKE ?',
        ['%Math%'],
        expect.any(Function),
      );
    });
  });

  describe('updateSubjectLevel', () => {
    it('should update the subject level successfully', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null));

      await expect(subjectService.updateSubjectLevel('1', 3)).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE Subjects SET levelId = ? WHERE id = ?',
        [3, '1'],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.updateSubjectLevel('1', 3)).rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE Subjects SET levelId = ? WHERE id = ?',
        [3, '1'],
        expect.any(Function),
      );
    });
  });

  describe('getAllLevels', () => {
    it('should return all levels in the system', async () => {
      const mockLevels = [
        { id: 1, name: 'Beginner' },
        { id: 2, name: 'Intermediate' },
        { id: 3, name: 'Advanced' },
      ];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, callback) => callback(null, mockLevels));

      const result = await subjectService.getAllLevels();

      expect(result).toEqual(mockLevels);
      expect(mockQuery).toHaveBeenCalledWith('SELECT id, name FROM Levels', expect.any(Function));
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, callback) => callback(new Error('Database error')));

      await expect(subjectService.getAllLevels()).rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith('SELECT id, name FROM Levels', expect.any(Function));
    });
  });

  describe('getTotalSubjectsCount', () => {
    it('should return the total number of subjects for a field', async () => {
      const mockCount = [{ total: 42 }];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockCount));

      const result = await subjectService.getTotalSubjectsCount(101);

      expect(result).toBe(42);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });

    it('should return 0 if no subjects are found', async () => {
      const mockCount = [{ total: 0 }];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockCount));

      const result = await subjectService.getTotalSubjectsCount(101);

      expect(result).toBe(0);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getTotalSubjectsCount(101)).rejects.toThrow('Database error');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [101],
        expect.any(Function),
      );
    });
  });

  describe('getSubjectByIdCaseInsensitive', () => {
    it('should return a subject if it exists (case-insensitive)', async () => {
      const mockSubject = { id: '1', name: 'Math', fieldId: 101, levelId: 1 };

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, [mockSubject]));

      const result = await subjectService.getSubjectByIdCaseInsensitive('math');

      expect(result).toEqual(mockSubject);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE LOWER(id) = LOWER(?)',
        ['math'],
        expect.any(Function),
      );
    });

    it('should return null if no subject matches the ID', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, []));

      const result = await subjectService.getSubjectByIdCaseInsensitive('unknown-id');

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM Subjects WHERE LOWER(id) = LOWER(?)',
        ['unknown-id'],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectByIdCaseInsensitive('math')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateSubject', () => {
    it('should update a subject successfully', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null));

      await expect(
        subjectService.updateSubject('1', 'Updated Subject', 102),
      ).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE Subjects SET name = ?, fieldId = ? WHERE id = ?',
        ['Updated Subject', 102, '1'],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.updateSubject('1', 'Updated Subject', 102)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getSubjectCountByLevel', () => {
    it('should return subject counts grouped by level for a given fieldId', async () => {
      const mockFieldId = 101;
      const mockCounts = [
        { levelId: 1, count: 5 },
        { levelId: 2, count: 10 },
      ];

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) => callback(null, mockCounts));

      const result = await subjectService.getSubjectCountByLevel(mockFieldId);

      expect(result).toEqual(mockCounts);
      expect(mockQuery).toHaveBeenCalledWith(
        `
      SELECT levelId, COUNT(*) as count 
      FROM Subjects 
      WHERE fieldId = ? 
      GROUP BY levelId WITH ROLLUP
      `,
        [mockFieldId],
        expect.any(Function),
      );
    });

    it('should throw an error if the query fails', async () => {
      const mockFieldId = 101;

      const mockQuery = pool.query as jest.Mock;
      mockQuery.mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectCountByLevel(mockFieldId)).rejects.toThrow(
        'Database error',
      );

      expect(mockQuery).toHaveBeenCalledWith(
        `
      SELECT levelId, COUNT(*) as count 
      FROM Subjects 
      WHERE fieldId = ? 
      GROUP BY levelId WITH ROLLUP
      `,
        [mockFieldId],
        expect.any(Function),
      );
    });
  });
});
