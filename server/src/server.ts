/**
 * Web server entry point used in `npm start`.
 */

import app from './app';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { userRouter } from './users/user-routes'; // Correct import
import { reviewRouter } from './reviews/review-router'; // Fixed import path
import { subjectRouter } from './subjects/subject-router'; // Correct import
import { fieldRouter } from './fields/field-routes';

// Enable CORS for the frontend
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Serve client files
app.use(express.static(path.join(__dirname, '/../../client/public')));

// Connect API routers
app.use('/api/subjects', subjectRouter); // Subject-related routes
app.use('/api', reviewRouter); // Review-related routes
app.use('/api/users', userRouter); // User-related routes
app.use('/api', fieldRouter); // Ensure this is correct
// app.use('/api/fields', fieldRouter);

// Fallback to serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../../client/public/index.html'));
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.info(`Server running on http://localhost:${port}`);
});

app.use(express.static(path.join(__dirname, '/public'))); // Adjust the path to your static files
