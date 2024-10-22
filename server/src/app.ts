import express from 'express';
import subjectRouter from './subject-router';

/**
 * Express application.
 */
const app = express();

app.use(express.json());

// Since API is not compatible with v1, API version is increased to v2
app.use('/api/v2', subjectRouter);

export default app;
