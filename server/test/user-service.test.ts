import bcrypt from 'bcrypt';
import { pool } from '../src/mysql-pool';
import { userService } from '../src/users/user-service';

jest.mock('../src/mysql-pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('User Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Tester om en ny bruker registreres vellykket
      const mockUserId = 1;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, { insertId: mockUserId }),
      );

      const userId = await userService.registerUser(
        'Test User',
        'testuser@example.com',
        'password123',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Test User', 'testuser@example.com', 'hashedPassword'],
        expect.any(Function),
      );
      expect(userId).toBe(mockUserId);
    });

    it('should throw an error if email is already in use', async () => {
      // Tester om en feil kastes når e-posten allerede er i bruk
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) => {
        const error = new Error();
        (error as any).code = 'ER_DUP_ENTRY';
        callback(error);
      });

      await expect(
        userService.registerUser('Test User', 'testuser@example.com', 'password123'),
      ).rejects.toThrow('Email already in use');
    });

    it('should throw an error if database query fails', async () => {
      // Tester om en feil kastes når databasen ikke svarer
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) => {
        callback(new Error('Database error'));
      });

      await expect(
        userService.registerUser('Test User', 'testuser@example.com', 'password123'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('verifyUser', () => {
    it('should return a user if email and password are valid', async () => {
      // Tester om brukeren blir returnert når e-post og passord er gyldige
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedPassword',
      };

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, [mockUser]),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const user = await userService.verifyUser('testuser@example.com', 'password123');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['testuser@example.com'],
        expect.any(Function),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(user).toEqual(mockUser);
    });

    it('should return null if email is invalid', async () => {
      // Tester om null returneres når e-posten er ugyldig
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, []),
      );

      const user = await userService.verifyUser('invaliduser@example.com', 'password123');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['invaliduser@example.com'],
        expect.any(Function),
      );
      expect(user).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      // Tester om null returneres når passordet er ugyldig
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedPassword',
      };

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, [mockUser]),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const user = await userService.verifyUser('testuser@example.com', 'wrongpassword');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['testuser@example.com'],
        expect.any(Function),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(user).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if found by email', async () => {
      // Tester om brukeren blir returnert ved søk på e-post
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedPassword',
      };

      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, [mockUser]),
      );

      const user = await userService.findUserByEmail('testuser@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['testuser@example.com'],
        expect.any(Function),
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null if no user is found', async () => {
      // Tester om null returneres når ingen bruker er funnet
      (pool.query as jest.Mock).mockImplementation((_query, _params, callback) =>
        callback(null, []),
      );

      const user = await userService.findUserByEmail('nonexistent@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ?',
        ['nonexistent@example.com'],
        expect.any(Function),
      );
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return a user when found by id', async () => {
      // Tester om brukeren blir returnert ved søk på id
      const mockUser = { id: 1, name: 'John Doe' };

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, [mockUser]); // Simulerer vellykket spørring med brukerresultat
      });

      const result = await userService.findUserById(1);

      expect(result).toEqual(mockUser); // Forventer at den returnerte brukeren stemmer med mocken
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });

    it('should return null when no user is found', async () => {
      // Simulerer at ingen bruker finnes
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, []); // Ingen bruker funnet
      });

      const result = await userService.findUserById(999);

      expect(result).toBeNull(); // Forventer null når ingen bruker er funnet
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [999],
        expect.any(Function),
      );
    });

    it('should handle errors gracefully', async () => {
      // Simulerer databasefeil
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null); // Simulerer databasefeil
      });

      await expect(userService.findUserById(1)).rejects.toThrow('Database error');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [1],
        expect.any(Function),
      );
    });
  });
});
