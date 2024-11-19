import { versionService } from '../src/versions/version-service';
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
    it('skal opprette en ny sideversjon og returnere versjonsnummer', async () => {
      const mockFieldId = 101;
      const mockUserId = '1';
      const mockDescription = 'Testbeskrivelse';
      const mockSubjects = [{ id: 'subject1' }, { id: 'subject2' }];
      const mockInsertResult = [{ insertId: 2 }];

      const mockPromiseQuery = pool.promise().query as jest.Mock;

      mockPromiseQuery
        .mockResolvedValueOnce([[{ max_version: 1 }], []])
        .mockResolvedValueOnce([mockSubjects, []])
        .mockResolvedValueOnce([mockInsertResult, []]);

      const result = await versionService.createPageVersion(
        mockFieldId,
        mockUserId,
        mockDescription,
      );

      expect(result).toBe(2);
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
        [mockFieldId, 2, mockUserId, JSON.stringify(['subject1', 'subject2']), mockDescription],
      );
    });
    // Tester om en ny sideversjon blir opprettet og versjonsnummer returneres
  });

  describe('getSubjectsByVersion', () => {
    it('skal returnere en liste med emne-IDer for en versjon', async () => {
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
    }); // Tester om en liste med emne-IDer hentes for en spesifikk versjon

    it('skal returnere en tom liste hvis ingen emner finnes', async () => {
      const mockVersionId = 1;

      const mockPromiseQuery = pool.promise().query as jest.Mock;
      mockPromiseQuery.mockResolvedValueOnce([[], []]);

      const result = await versionService.getSubjectsByVersion(mockVersionId);

      expect(result).toEqual([]);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT subject_ids FROM page_versions WHERE version_id = ?',
        [mockVersionId],
      );
    }); // Tester om en tom liste returneres når ingen emner finnes
  });

  describe('createSubjectVersion', () => {
    it('skal opprette en ny emneversjon og returnere versjonsnummer', async () => {
      const mockSubjectId = '1001';
      const mockUserId = '1';
      const mockActionType = 'edit';
      const mockDescription = 'Testbeskrivelse';
      const mockInsertResult = [{ insertId: 3 }];

      const mockPromiseQuery = pool.promise().query as jest.Mock;

      mockPromiseQuery
        .mockResolvedValueOnce([[{ max_version: 2 }], []])
        .mockResolvedValueOnce([mockInsertResult, []]);

      const result = await versionService.createSubjectVersion(
        mockSubjectId,
        mockUserId,
        mockActionType,
        mockDescription,
      );

      expect(result).toBe(3); // Nytt versjonsnummer
      expect(mockPromiseQuery).toHaveBeenCalledTimes(2);
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'SELECT MAX(version_number) AS max_version FROM subject_versions WHERE subject_id = ?',
        [mockSubjectId],
      );
      expect(mockPromiseQuery).toHaveBeenCalledWith(
        'INSERT INTO subject_versions (subject_id, user_id, version_number, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [mockSubjectId, mockUserId, 3, mockActionType, mockDescription],
      );
    }); // Tester om en ny versjon av et emne opprettes og returnerer riktig versjonsnummer
  });
});
