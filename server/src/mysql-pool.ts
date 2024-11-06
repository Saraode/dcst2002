import mysql from 'mysql2';

/**
 * MySQL connection pool with options specified in the following environment variables:
 * - `MYSQL_HOST`
 * - `MYSQL_USER`
 * - `MYSQL_PASSWORD`
 * - `MYSQL_DATABASE`
 */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  // Reduce load on NTNU MySQL server
  connectionLimit: 1,
  // Convert MySQL boolean values to JavaScript boolean values
  typeCast: (field, next) =>
    field.type == 'TINY' && field.length == 1 ? field.string() == '1' : next(),
});
const updateVersion = async () => {
  return new Promise((resolve, reject) => {
    console.log('Running updateVersion in MySQL');
    pool.execute('UPDATE site_version SET version = version + 1 WHERE id = 1', (error, results) => {
      if (error) {
        console.error('Error in updateVersion:', error);
        return reject(error);
      }
      console.log('updateVersion results:', results);
      resolve(results);
    });
  });
};

export { pool, updateVersion };
