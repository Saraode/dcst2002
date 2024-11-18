import express from 'express';
import { reviewRouter } from './reviews/review-router';
import { userRouter } from './users/user-routes';
import { fieldRouter } from './fields/field-routes';
import { subjectRouter } from './subjects/subject-router';
import versionRouter from './versions/version-routes'; // Import versionRouter

const app = express();

app.use(express.json());

// Legger til fagrelaterte ruter under `/api/v2/subjects`
app.use('/api/v2/subjects', subjectRouter);
console.log('Fagruter registrert på /api/v2/subjects');

// Legger til anmeldelsesrelaterte ruter under `/api/v2/reviews`
app.use('/api/reviews', reviewRouter);
console.log('Anmeldelsesruter registrert på /api/v2/reviews');

// Legger til brukerrelaterte ruter under `/api/v2/users`
app.use('/api/v2/users', userRouter);
console.log('Brukerruter registrert på /api/v2/users');

// Legger til feltrelaterte ruter under `/api/v2/fields`
app.use('/api/v2/fields', fieldRouter); // Sikrer konsistens i navnsetting
console.log('Feltruter registrert på /api/v2/fields');

// Legger til generelle API-ruter
app.use('/api', subjectRouter);
app.use('/api', versionRouter);

export default app;
