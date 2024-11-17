import axios from 'axios';
import app from '../src/app'; // Adjust the path to your app file
import { Server } from 'http';
import { pool } from '../src/mysql-pool'; // Direct access to the database for cleanup

axios.defaults.baseURL = 'http://localhost:3000/api/v2'; // Base URL for API

let server: Server;

beforeAll(() => {
  const TEST_PORT = 3001; // Use a different port for testing
  server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });
  axios.defaults.baseURL = `http://localhost:${TEST_PORT}/api/v2`; // Update base URL dynamically
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

beforeEach(async () => {
  // Clean up test users from the database
  await pool.promise().query('DELETE FROM users WHERE email = ?', ['testuser@example.com']);
});

describe('User Routes', () => {
  describe('POST /register', () => {
    test('should successfully register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await axios.post('/users/register', userData);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({
        message: 'User registered successfully',
        userId: expect.any(Number),
      });
    });

    test('should fail if email is already in use', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      // First registration
      await axios.post('/users/register', userData);

      try {
        // Attempt to register again with the same email
        await axios.post('/users/register', userData);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual({
          error: 'Email already in use',
        });
      }
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      await axios.post('/users/register', userData);
    });

    test('should successfully log in with valid credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await axios.post('/users/login', loginData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        message: 'Login successful',
        userId: expect.any(Number),
        userName: 'Test User',
      });
    });

    test('should fail if email or password is incorrect', async () => {
      const invalidLoginData = {
        email: 'testuser@example.com',
        password: 'wrongpassword',
      };

      try {
        await axios.post('/users/login', invalidLoginData);
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toEqual({
          error: 'Invalid email or password',
        });
      }
    });
  });
});
