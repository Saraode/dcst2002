import pool from './mysql-pool';
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
    const hashedPassword = await bcrypt.hash(password, 10);

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

  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }
}

export const userService = new UserService();
