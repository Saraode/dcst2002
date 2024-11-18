import { versionService } from '../src/version-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/mysql-pool', () => ({
  pool: {
    promise: jest.fn().mockReturnValue({
      query: jest.fn(),
    }),
  },
}));

describe('VersionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPageVersion', () => {
    it('should create a new page version and return the version number', async () => {
      const mockFieldId = 101;
      const mockUserId = '1';
      const mockSubjects = [{ id: 'subject1' }, { id: 'subject2' }];
      const mockInsertResult = [{ insertId: 2 }];

      const mockPromiseQuery = pool.promise().query as jest.Mock;

      mockPromiseQuery
        .mockResolvedValueOnce([[{ max_version: 1 }], []]) // MAX(version_number) query
        .mockResolvedValueOnce([mockSubjects, []]) // Subject IDs query
        .mockResolvedValueOnce([mockInsertResult, []]); // INSERT query

      const result = await versionService.createPageVersion(mockFieldId, mockUserId);

      expect(result).toBe(2); // New version number
      expect(mockPromiseQuery).toHaveBeenCalledTimes(3);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT MAX(version_number) AS max_version FROM page_versions WHERE field_id = ?',
        [mockFieldId],
      );
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT id FROM Subjects WHERE fieldId = ?', [
        mockFieldId,
      ]);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO page_versions (field_id, version_number, user_id, subject_ids, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [mockFieldId, 2, mockUserId, JSON.stringify(['subject1', 'subject2'])],
      );
    }); // Tester om en ny versjon blir opprettet og versjonsnummer returneres
  });

  describe('getSubjectsByVersion', () => {
    it('should return a list of subject IDs for a version', async () => {
      const mockVersionId = 1;
      const mockVersionData = [[{ subject_ids: '["subject1", "subject2"]' }], []];

      const mockPromiseQuery = pool.promise().query as jest.Mock;
      mockPromiseQuery.mockResolvedValueOnce(mockVersionData);

      const result = await versionService.getSubjectsByVersion(mockVersionId);

      expect(result).toEqual(['subject1', 'subject2']);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT subject_ids FROM page_versions WHERE version_id = ?',
        [mockVersionId],
      );
    }); // Tester om et sett med emne-IDer blir hentet for en versjon

    it('should return an empty array if no subjects are found', async () => {
      const mockVersionId = 1;

      const mockPromiseQuery = pool.promise().query as jest.Mock;
      mockPromiseQuery.mockResolvedValueOnce([[], []]);

      const result = await versionService.getSubjectsByVersion(mockVersionId);

      expect(result).toEqual([]);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT subject_ids FROM page_versions WHERE version_id = ?',
        [mockVersionId],
      );
    }); // Tester om en tom array returneres når ingen emner finnes
  });

  describe('createSubjectVersion', () => {
    it('should create a new subject version and return the version number', async () => {
      const mockSubjectId = '1001';
      const mockUserId = '1';
      const mockActionType = 'edit';
      const mockInsertResult = [{ insertId: 3 }];

      const mockPromiseQuery = pool.promise().query as jest.Mock;

      mockPromiseQuery
        .mockResolvedValueOnce([[{ max_version: 2 }], []]) // MAX(version_number) query
        .mockResolvedValueOnce([[{ id: '1001' }], []]) // Subject ID query
        .mockResolvedValueOnce([mockInsertResult, []]); // INSERT query

      const result = await versionService.createSubjectVersion(
        mockSubjectId,
        mockUserId,
        mockActionType,
      );

      expect(result).toBe(3); // New version number
      expect(mockPromiseQuery).toHaveBeenCalledTimes(3);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT MAX(version_number) AS max_version FROM subject_versions WHERE subject_id = ?',
        [mockSubjectId],
      );
      expect(mockPromiseQuery).toHaveBeenCalledWith('SELECT id FROM Subjects WHERE id = ?', [
        mockSubjectId,
      ]);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO subject_versions (subject_id, user_id, version_number, action_type) VALUES (?, ?, ?, ?)',
        [mockSubjectId, mockUserId, 3, mockActionType],
      );
    }); // Tester om en ny versjon av et emne blir opprettet og versjonsnummer returneres
  });
});
