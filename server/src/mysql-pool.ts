import mysql from 'mysql2';

/**
 * MySQL connection pool with options specified in the following environment variables:
 * - MYSQL_HOST
 * - MYSQL_USER
 * - MYSQL_PASSWORD
 * - MYSQL_DATABASE
 */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST, // MySQL-serverens adresse
  user: process.env.MYSQL_USER, // Brukernavn for MySQL
  password: process.env.MYSQL_PASSWORD, // Passord for MySQL
  database: process.env.MYSQL_DATABASE, // Navnet på databasen som skal brukes
  // Reduserer belastningen på NTNU MySQL-serveren
  connectionLimit: 1,
  // Konverterer MySQL-booleanverdier til JavaScript-booleanverdier
  typeCast: (field, next) =>
    field.type == 'TINY' && field.length == 1 ? field.string() == '1' : next(),
});

export { pool };
