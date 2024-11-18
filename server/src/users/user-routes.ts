import express, { Request, Response } from 'express';
import { userService } from './user-service';

const userRouter = express.Router();

/// Ny bruker
userRouter.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userId = await userService.registerUser(name, email, password);
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Log in
userRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await userService.verifyUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', userId: user.id, userName: user.name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

export { userRouter };
