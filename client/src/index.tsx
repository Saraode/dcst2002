import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import Menu from './menu';
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';
import SubjectDetails from './SubjectDetails';

import {
  CampusList,
  SubjectListWithRouter as SubjectList,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';

const App = () => {
  // State to track if the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status from localStorage and log it
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Login status from localStorage:', loggedInStatus); // Debugging line
    setIsLoggedIn(loggedInStatus);
  }, []);

  const handleLogout = () => {
    // Clear login data and update state
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('users');
    window.location.href = '/index.html';
  };

  return (
    <Router>
      <div>
        <Menu />
        {/* Conditionally render the Log In and Log Out buttons */}
        {!isLoggedIn ? (
          <Link to="/login">
            <button id="loginButton">Logg inn</button>
          </Link>
        ) : (
          <button onClick={handleLogout}>Logg Ut</button>
        )}

        <Switch>
          {/* Redirect to login HTML */}
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

ReactDOM.render(<App />, document.getElementById('root'));
