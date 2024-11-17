import { pool } from '../mysql-pool';

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';

export type User = {
  id?: number;
  name: string;
  email: string;
  password: string;
};

class UserService {
  async registerUser(name: string, email: string, password: string): Promise<number> {
    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Missing required fields');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    return new Promise<number>((resolve, reject) => {
      const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      pool.query(query, [name, email, hashedPassword], (error, results: ResultSetHeader) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return reject(new Error('Email already in use'));
          }
          return reject(error);
        }
        resolve(results.insertId);
      });
    });
  }

  async verifyUser(email: string, password: string): Promise<User | null> {
    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  // Helper methods remain unchanged
  findUserByEmail(email: string): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      pool.query(query, [email], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as User) : null);
      });
    });
  }

  findUserById(userId: number): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      pool.query(query, [userId], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as User) : null);
      });
    });
  }
}

export const userService = new UserService();
