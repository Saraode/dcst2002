// client/App.tsx

import React from 'react';
import ReactDOM from 'react-dom';
import { NavBar } from './widgets';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  CampusList,
  SubjectDetailsWithRouter as SubjectDetails,  // Bruk withRouter-innpakkede komponenter
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';

const App = () => (
  <Router>
    <div>
      <NavBar brand="NTNU">
        <NavBar.Link to="/campus">Velg Campus</NavBar.Link>
      </NavBar>
      <Switch>
        {/* Route for FieldDropdown */}
        <Route exact path="/campus/:campus" component={FieldDropdown} />

        {/* Route for SubjectsByField */}
        <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} />

        {/* Routes for existing subject-related components */}
        <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} />
        <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} />
        <Route exact path="/campus/:campus/subjects/:id" component={SubjectDetails} />

        {/* Fallback route */}
        <Route path="/" component={CampusList} />
      </Switch>
    </div>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

