import app from './app';
import express from 'express';
import path from 'path';
import cors from 'cors';
<<<<<<< HEAD
import { reviewRouter } from './reviews/review-router'; // Fixed import path
import { subjectRouter } from './subjects/subject-router'; // Correct import
import { fieldRouter } from './fields/field-routes';
import { userRouter } from './users/user-routes'; // Import userRouter
import versionRouter from './versions/version-routes'; // Import versionRouter
// Serve client files
=======
import { reviewRouter } from './reviews/review-router'; // Riktig importsti for anmeldelser
import { subjectRouter } from './subjects/subject-router'; // Riktig importsti for fag
import { fieldRouter } from './fields/field-routes'; // Import for felt-relaterte ruter
import { userRouter } from './users/user-routes'; // Import for bruker-relaterte ruter
import versionRouter from './version-routes'; // Import for versjonsinformasjon

// Serverer klientfiler
>>>>>>> 84973e16689af6da90a6af1a424922c5d0686e6d
app.use(express.static(path.join(__dirname, '/../../client/public')));

// Aktiverer CORS for spesifikke klienter
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Koble API-rutene til serveren
app.use('/api/subjects', subjectRouter); // Ruter for fagrelaterte operasjoner
app.use('/api', reviewRouter); // Ruter for anmeldelsesrelaterte operasjoner
app.use('/api/users', userRouter); // Ruter for brukerrelaterte operasjoner
app.use('/api', fieldRouter); // Ruter for feltrelaterte operasjoner
// app.use('/api/fields', fieldRouter); // Alternativ hvis felt-ruter trenger en spesifikk sti
app.use('/api', versionRouter); // Ruter for versjonsinformasjon

// Håndterer alle andre forespørsler ved å returnere index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../../client/public/index.html'));
});

// Starter serveren
const port = 3000;
app.listen(port, () => {
  console.info(`Server kjører på http://localhost:${port}`);
});

// Ekstra servering av statiske filer
app.use(express.static(path.join(__dirname, '/public'))); // Juster stien til statiske filer om nødvendig
