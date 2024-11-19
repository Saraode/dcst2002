import { FieldService } from '../src/fields/field-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/mysql-pool', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool };
});

describe('FieldService', () => {
  const fieldService = new FieldService();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Fields', () => {
    // Tester at alle fields hentes korrekt
    it('should fetch all fields', async () => {
      const mockFields = [
        { id: 1, name: 'Field 1', campusId: 1 },
        { id: 2, name: 'Field 2', campusId: 2 },
      ];

      (pool.query as jest.Mock).mockImplementation((query, callback) => {
        if (query.includes('SELECT * FROM Fields')) {
          callback(null, mockFields);
        }
      });

      const fields = await fieldService.getFields();
      expect(fields).toEqual(mockFields);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM Fields', expect.any(Function));
    });

    // Tester at fields for en spesifikk campus hentes korrekt
    it('should fetch fields by campus', async () => {
      const mockFields = [
        { id: 1, name: 'Field 1', campusId: 1 },
        { id: 2, name: 'Field 2', campusId: 1 },
      ];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        if (query.includes('JOIN Campuses')) {
          callback(null, mockFields);
        }
      });

      const fields = await fieldService.getFieldsByCampus('Campus 1');
      expect(fields).toEqual(mockFields);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT f.id, f.name, f.campusId'),
        ['Campus 1'],
        expect.any(Function),
      );
    });
  });

  describe('Get Single Field', () => {
    // Tester at en field hentes korrekt basert på ID
    it('should fetch a field by ID', async () => {
      const mockField = { id: 1, name: 'Field 1', campusId: 1 };

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        if (query.includes('WHERE id = ?')) {
          callback(null, [mockField]);
        }
      });

      const field = await fieldService.getFieldById(1);
      expect(field).toEqual(mockField);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM Fields WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });
  });

  describe('Get Campuses', () => {
    // Tester at alle campuser hentes korrekt
    it('should fetch all campuses', async () => {
      const mockCampuses = [
        { campusId: 1, name: 'Campus 1' },
        { campusId: 2, name: 'Campus 2' },
      ];

      (pool.query as jest.Mock).mockImplementation((query, callback) => {
        if (query.includes('SELECT * FROM Campuses')) {
          callback(null, mockCampuses);
        }
      });

      const campuses = await fieldService.getAllCampuses();
      expect(campuses).toEqual(mockCampuses);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM Campuses', expect.any(Function));
    });
  });

  describe('Get Total Subjects Count', () => {
    // Tester at antall subjects for en field hentes korrekt
    it('should fetch total subjects count for a field', async () => {
      const mockCount = 42;

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        if (query.includes('COUNT(*) as total FROM Subjects')) {
          callback(null, [{ total: mockCount }]);
        }
      });

      const count = await fieldService.getTotalSubjectsCount(1);
      expect(count).toBe(mockCount);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as total FROM Subjects'),
        [1],
        expect.any(Function),
      );
    });
  });

  describe('Get Field Name', () => {
    // Tester at navnet til en field hentes korrekt basert på ID
    it('should fetch field name by ID', async () => {
      const mockFieldName = 'Field 1';

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        if (query.includes('SELECT name FROM Fields WHERE id = ?')) {
          callback(null, [{ name: mockFieldName }]);
        }
      });

      const fieldName = await fieldService.getFieldNameById(1);
      expect(fieldName).toBe(mockFieldName);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT name FROM Fields WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });

    // Tester at null returneres hvis ingen resultater finnes for navnet
    it('should handle no results for field name', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        if (query.includes('SELECT name FROM Fields WHERE id = ?')) {
          callback(null, []);
        }
      });

      const fieldName = await fieldService.getFieldNameById(1);
      expect(fieldName).toBeNull();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT name FROM Fields WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });
  });
});
