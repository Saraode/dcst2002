import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Switch, Link } from 'react-router-dom';
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';
import SubjectDetails from './SubjectDetails';
import {
  CampusList,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';
import SearchBar from './searchBar';
import axios from 'axios';

type Campus = {
  campusId: number;
  name: string;
};

const App: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]); // Opprett state for søkeresultater
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Hent campuser
    axios
      .get('http://localhost:3000/api/campuses')
      .then((response) => setCampuses(response.data))
      .catch((error) => console.error('Error fetching campuses:', error));

    // Sjekk login status
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedInStatus);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/index.html';
  };

  // Funksjonen for å håndtere resultater fra søk
  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
  };

  return (
    <Router>
      <div>
        {/* Top Navigation Bar */}
        <div className="topnav">
          <Link to="/" className="home-link">
            NTNU
          </Link>
          {/* Campus Links */}
          <div className="campus-links left-container">
            {campuses.map((campus) => (
              <Link key={campus.campusId} to={`/campus/${campus.name}`} className="campus-link">
                {campus.name}
              </Link>
            ))}
          </div>
          {/* Search Bar */}
          <SearchBar onResults={handleSearchResults} /> {/* Bruk riktig funksjon her */}
          {/* Authentication buttons */}
          <div className="auth-buttons">
            {!isLoggedIn ? (
              <Link to="/login">
                <button id="loginButton">Logg inn</button>
              </Link>
            ) : (
              <button onClick={handleLogout}>Logg Ut</button>
            )}
          </div>
        </div>

        {/* Routes for navigation */}
        <Switch>
          <Route
            exact
            path="/login"
            component={() => {
              window.location.href = '/html/indexsignup.html';
              return null;
            }}
          />
          <Route exact path="/campus/:campus" component={FieldDropdown} />
          <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} />
          <Route exact path="/subjects/:subjectId" component={SubjectDetails} />
          <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} />
          <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} />
          <Route path="/" component={CampusList} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
