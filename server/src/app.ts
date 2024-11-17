import express from 'express';
import { subjectRouter } from './subjects/subject-router'; // Handles both /subjects and /fields
import { reviewRouter } from './reviews/review-router'; // Changed to import from the correct file
import { userRouter } from './users/user-routes';
import { fieldRouter } from './fields/field-routes';

const app = express();

app.use(express.json());

// Mount subject-related routes under `/api/v2/subjects`
app.use('/api/v2/subjects', subjectRouter);
console.log('Subject routes registered at /api/v2/subjects');

// Mount review-related routes under `/api/v2/reviews`
app.use('/api/reviews', reviewRouter);
console.log('Review routes registered at /api/v2/reviews');

// Mount user-related routes under `/api/v2/users`
app.use('/api/v2/users', userRouter);
console.log('User routes registered at /api/v2/users');

// Mount field-related routes under `/api/v2/fields`
app.use('/api/v2/fields', fieldRouter); // Added namespace consistency
console.log('Field routes registered at /api/v2/fields');

app.use('/api', subjectRouter);

export default app;
