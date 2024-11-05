// server.ts
/**
 * Web server entry point used in `npm start`.
 */

import app from './app';
import express from 'express';
import path from 'path';

import subjectRouter from './subject-router';
import { reviewRouter } from './review-service';
import { userRouter } from './user-routes'; // Import userRouter

// Serve client files
app.use(express.static(path.join(__dirname, '/../../client/public')));

// Connect routers to the API
app.use('/api', subjectRouter);    // Adds subject-related routes under /api
app.use('/api', reviewRouter);      // Adds review-related routes under /api

const port = 3000;
app.listen(port, () => {
  console.info(`Server running on port ${port}`);
});


// Connect routers to the API
app.use('/api', subjectRouter); // Adds subject-related routes under /api
app.use('/api', reviewRouter); // Adds review-related routes under /api
app.use('/api/users', userRouter); // Adds user-related routes under /api/users
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../../client/public/index.html'));
});

