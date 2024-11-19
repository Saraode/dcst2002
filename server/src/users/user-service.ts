import { pool } from '../mysql-pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';


// Definerer brukertypen
export type User = {
  id?: number; // ID er valgfri ved oppretting
  name: string; // Brukernavn
  email: string; // E-post
  password: string; // Hashet passord
};

class UserService {
  // Registrer en ny bruker
  async registerUser(name: string, email: string, password: string): Promise<number> {
    if (!name || !email || !password) {
      throw new Error('Missing required fields'); // Feil hvis data mangler
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash passordet

    return new Promise<number>((resolve, reject) => {
      const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      pool.query(query, [name, email, hashedPassword], async (error, results: ResultSetHeader) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return reject(new Error('Email already in use')); // Feil hvis e-post allerede er brukt
          }
          return reject(error);
        }

        // Opprett moderator hvis nødvendig
        await this.createModeratorIfNeeded();

        resolve(results.insertId); // Returner ny bruker-ID
      });
    });
  }

  // Opprett moderatorbruker hvis den ikke finnes
  private async createModeratorIfNeeded() {
    try {
      const [existingModerator] = await pool.promise().query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = 35'
      );

      // Hvis moderator (ID 35) ikke finnes, opprett den
      if (existingModerator.length === 0) {
        const moderatorName = 'Moderator';
        const moderatorEmail = 'moderator@ntnu.no';
        const moderatorPassword = 'moderator'; // Passord for moderator

        const hashedPassword = await bcrypt.hash(moderatorPassword, 10); // Hash passordet

        // Legg moderator i databasen
        const query = 'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, NOW())';
        await pool.promise().query(query, [35, moderatorName, moderatorEmail, hashedPassword]);

        console.log('Moderator (ID 35) ble opprettet.'); // Logg suksess
      }
    } catch (error) {
      console.error('Feil ved oppretting av moderator:', error); // Logg feil
    }
  }

  // Verifiser bruker basert på e-post og passord
  async verifyUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email); // Finn bruker
    if (!user) return null; // Returner null hvis bruker ikke finnes

    const isPasswordValid = await bcrypt.compare(password, user.password); // Sjekk passord
    return isPasswordValid ? user : null; // Returner bruker hvis passord er gyldig
  }

  // Finn bruker basert på e-post
  findUserByEmail(email: string): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      pool.query(query, [email], (error, results: RowDataPacket[]) => {
        if (error) return reject(error); // Feil ved spørring
        resolve(results.length > 0 ? (results[0] as User) : null); // Returner bruker eller null
      });
    });
  }

  // Finn bruker basert på ID
  findUserById(userId: number): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      pool.query(query, [userId], (error, results: RowDataPacket[]) => {
        if (error) return reject(error); // Feil ved spørring
        resolve(results.length > 0 ? (results[0] as User) : null); // Returner bruker eller null
      });
    });
  }
}


export const userService = new UserService();
