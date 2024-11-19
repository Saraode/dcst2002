import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Switch, Link } from 'react-router-dom'; // Importerer nødvendige React Router komponenter
import FieldDropdown from './components/FieldDropdown'; // Komponent for å vise fagområder
import SubjectsByField from './components/SubjectsByField'; // Komponent for å vise emner etter fagområde
import SubjectDetails from './components/SubjectDetails'; // Komponent for detaljer om et spesifikt emne

import {
  CampusList,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './components/subject-components'; // Importerer komponenter for emnelister, nytt emne og ny anmeldelse

import axios from 'axios'; // Importerer axios for API-kall
import SearchBar from './components/SearchBar'; // Importerer søkebaren

// Definerer typen for Campus, som inneholder campusId og campus navn
type Campus = {
  campusId: number;
  name: string;
};

const App: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]); // State for campusene som lastes inn fra API
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State for å holde styr på om brukeren er innlogget

  // useEffect for å hente campus data fra API ved komponentmontering
  useEffect(() => {
    axios
      .get('http://localhost:3000/api/campuses') // Henter campus data fra backend
      .then((response) => {
        console.log('Fetched campuses:', response.data);
        setCampuses(response.data); // Setter campusene til state
      })
      .catch((error) => console.error('Error fetching campuses:', error));

    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true'; // Sjekker om brukeren er innlogget basert på localStorage
    setIsLoggedIn(loggedInStatus);
  }, []); // Empty array sørger for at dette kjøres kun én gang når komponenten lastes inn

  // Funksjon for å logge ut brukeren
  const handleLogout = () => {
    localStorage.clear(); // Tømmer localStorage
    window.location.href = '/index.html'; // Sender brukeren til index.html (kan være en "landing page" eller annen side)
  };

  return (
    <Router>
      <div>
        <div className="topnav">
          {/* NTNU Home link */}
          <Link to="/" className="home-link">
            NTNU
          </Link>

          {/* Campus links: Viser linker til forskjellige campusene som er hentet fra API */}
          <div className="campus-links left-container">
            {campuses.map((campus) => (
              <Link key={campus.campusId} to={`/campus/${campus.name}`} className="campus-link">
                {campus.name}
              </Link>
            ))}
          </div>

          {/* Authentication and Search Bar */}
          <div className="auth-buttons">
            <div className="search-container">
              <SearchBar /> {/* Søkemulighet for emner */}
            </div>
            {!isLoggedIn ? (
              <Link to="/login">
                <button id="loginButton">Logg inn</button> {/* Vis login-knapp hvis ikke innlogget */}
              </Link>
            ) : (
              <button onClick={handleLogout}>Logg Ut</button>
            )}
          </div>
        </div>

        <Switch>
          {/* Definerer forskjellige ruter for applikasjonen */}
          <Route
            exact
            path="/login"
            component={() => {
              window.location.href = '/html/indexsignup.html'; // Hvis brukeren går til /login, sendes de til signup siden
              return null;
            }}
          />
          <Route exact path="/campus/:campus" component={FieldDropdown} /> {/* Fagområder for valgt campus */}
          <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} /> {/* Emner for valgt fagområde */}
          <Route exact path="/subjects/:subjectId" component={SubjectDetails} /> {/* Detaljer for valgt emne */}
          <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} /> {/* Nytt emne for valgt campus */}
          <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} /> {/* Ny anmeldelse for valgt emne */}
          <Route path="/" component={CampusList} /> {/* Standard visning av campusene */}
        </Switch>
      </div>
    </Router>
  );
};

export default App;
