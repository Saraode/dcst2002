import subjectService from '../src/subjects/subject-service';
import { pool } from '../src/mysql-pool';

// Mock the MySQL pool
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
    jest.clearAllMocks(); // Reset mocks after each test
  });

  describe('getSubjectsByField', () => {
    it('should return a list of subjects by field ID', async () => {
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
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Database error')),
      );

      await expect(subjectService.getSubjectsByField(101)).rejects.toThrow('Database error');
    });
  });

  describe('createSubject', () => {
    it('should create a new subject and return its ID', async () => {
      const mockSubjectId = '3';
      const mockName = 'Physics';
      const mockFieldId = 101;
      const mockLevelId = 2;
      const mockDescription = 'Physics course description';

      jest.spyOn(subjectService, 'getSubjectByIdCaseInsensitive').mockResolvedValueOnce(null);
      (pool.promise().query as jest.Mock).mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await subjectService.createSubject(
        mockSubjectId,
        mockName,
        mockFieldId,
        mockLevelId,
        mockDescription,
      );

      expect(result).toBe(mockSubjectId);
      expect(subjectService.getSubjectByIdCaseInsensitive).toHaveBeenCalledWith(mockSubjectId);
      expect(pool.promise().query).toHaveBeenCalledWith(
        'INSERT INTO Subjects (id, name, fieldId, levelId, description) VALUES (?, ?, ?, ?, ?)',
        [mockSubjectId, 'Physics', mockFieldId, mockLevelId, mockDescription],
      );
      expect(pool.promise().query).toHaveBeenCalledWith('COMMIT;');
    });

    it('should throw an error if the subject already exists', async () => {
      const mockSubjectId = '3';
      const mockExistingSubject = { id: '3', name: 'Physics', fieldId: 101, levelId: 2 };

      jest
        .spyOn(subjectService, 'getSubjectByIdCaseInsensitive')
        .mockResolvedValueOnce(mockExistingSubject);

      await expect(
        subjectService.createSubject(
          mockSubjectId,
          'Physics',
          101,
          2,
          'Physics course description',
        ),
      ).rejects.toThrow(`Subject with ID '${mockSubjectId}' already exists`);

      expect(subjectService.getSubjectByIdCaseInsensitive).toHaveBeenCalledWith(mockSubjectId);
      expect(pool.promise().query).not.toHaveBeenCalled();
    });
  });

  describe('deleteSubject', () => {
    it('should delete a subject and its reviews', async () => {
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
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(new Error('Failed to delete reviews')),
      );

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete reviews');
    });

    it('should throw an error if deleting the subject fails', async () => {
      (pool.query as jest.Mock)
        .mockImplementationOnce((_query, _params, callback) => callback(null))
        .mockImplementationOnce((_query, _params, callback) =>
          callback(new Error('Failed to delete subject')),
        );

      await expect(subjectService.deleteSubject('3')).rejects.toThrow('Failed to delete subject');
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
});
