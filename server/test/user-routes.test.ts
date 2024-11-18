import request from 'supertest';
import app from '../src/app';
import { userService } from '../src/users/user-service';

jest.mock('../src/users/user-service', () => ({
  userService: {
    registerUser: jest.fn(),
    verifyUser: jest.fn(),
  },
}));

describe('User Routes (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Nullstiller mocks etter hver test
  });

  describe('POST /register', () => {
    it('should successfully register a new user', async () => {
      // Tester om en ny bruker blir registrert vellykket
      const mockUserId = 1;
      (userService.registerUser as jest.Mock).mockResolvedValue(mockUserId);

      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v2/users/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User registered successfully',
        userId: mockUserId,
      });
      expect(userService.registerUser).toHaveBeenCalledWith(
        userData.name,
        userData.email,
        userData.password,
      );
    });

    it('should fail if email is already in use', async () => {
      // Tester om registreringen feiler når e-posten allerede er i bruk
      (userService.registerUser as jest.Mock).mockRejectedValue(new Error('Email already in use'));

      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v2/users/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email already in use' });
      expect(userService.registerUser).toHaveBeenCalledWith(
        userData.name,
        userData.email,
        userData.password,
      );
    });
  });

  describe('POST /login', () => {
    it('should successfully log in with valid credentials', async () => {
      // Tester om innlogging lykkes med gyldige opplysninger
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedpassword123',
      };
      (userService.verifyUser as jest.Mock).mockResolvedValue(mockUser);

      const loginData = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/v2/users/login').send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Login successful',
        userId: mockUser.id,
        userName: mockUser.name,
      });
      expect(userService.verifyUser).toHaveBeenCalledWith(loginData.email, loginData.password);
    });

    it('should fail if email or password is incorrect', async () => {
      // Tester om innlogging feiler når e-post eller passord er feil
      (userService.verifyUser as jest.Mock).mockResolvedValue(null);

      const invalidLoginData = {
        email: 'testuser@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app).post('/api/v2/users/login').send(invalidLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid email or password' });
      expect(userService.verifyUser).toHaveBeenCalledWith(
        invalidLoginData.email,
        invalidLoginData.password,
      );
    });
  });
});
