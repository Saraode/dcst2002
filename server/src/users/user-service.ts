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
    if (!name || !email || !password) {
      throw new Error('Missing required fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise<number>((resolve, reject) => {
      const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      pool.query(query, [name, email, hashedPassword], async (error, results: ResultSetHeader) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return reject(new Error('Email already in use'));
          }
          return reject(error);
        }
        // Etter at en ny bruker er registrert, sjekk om moderator med ID 35 eksisterer
        await this.createModeratorIfNeeded();

        resolve(results.insertId);
      });
    });
  }

  // Sjekk om moderatorbrukeren finnes, hvis ikke, opprett den
  private async createModeratorIfNeeded() {
    try {
      // Sjekk om moderator (ID 35) finnes
      const [existingModerator] = await pool.promise().query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = 35'
      );

      // Hvis moderator ikke finnes, opprett den
      if (existingModerator.length === 0) {
        const moderatorName = 'Moderator';
        const moderatorEmail = 'moderator@ntnu.no';
        const moderatorPassword = 'moderator'; // Sett ønsket passord her

        const hashedPassword = await bcrypt.hash(moderatorPassword, 10); // Hash passordet

        // Sett inn moderatorbrukeren i databasen
        const query = 'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, NOW())';
        await pool.promise().query(query, [35, moderatorName, moderatorEmail, hashedPassword]);

        console.log('Moderator (ID 35) ble opprettet.');
      }
    } catch (error) {
      console.error('Feil ved oppretting av moderator:', error);
    }
  }

  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
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
}

export const userService = new UserService();
