//server/
/**
 * Web server entry point used in `npm start`.
 */

import app from './app';
import express from 'express';
import path from 'path';

import bodyParser from 'body-parser';
import subjectRouter from './subject-router'; // Import your subject router

import { reviewRouter } from './review-service';

// Serve client files
app.use(express.static(path.join(__dirname, '/../../client/public')));

const port = 3000;
app.listen(port, () => {
  console.info(`Server running on port ${port}`);
});

app.use('/api', reviewRouter); // Kobler til alle ruter i reviewRouter under /api

app.use('/api/v2/subjects', subjectRouter);
