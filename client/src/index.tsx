// client/index.tsx

import React from 'react';
import ReactDOM from 'react-dom';
import { NavBar } from './widgets';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  CampusList,
  SubjectListWithRouter as SubjectList, // Bruker withRouter-innpakket komponent
  SubjectDetailsWithRouter as SubjectDetails,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';

// Menu component linking to each campus
class Menu extends React.Component {
  render() {
    return (
      <NavBar brand="NTNU">
        <NavBar.Link to="/campus/Gloshaugen">Gløshaugen</NavBar.Link>
        <NavBar.Link to="/campus/Øya">Øya</NavBar.Link>
        <NavBar.Link to="/campus/Kalvskinnet">Kalvskinnet</NavBar.Link>
        <NavBar.Link to="/campus/Dragvold">Dragvold</NavBar.Link>
        <NavBar.Link to="/campus/Handelshøyskolen">Handelshøyskolen</NavBar.Link>
      </NavBar>
    );
  }
}

// Main application with routing
const App = () => (
  <Router>
    <div>
      <Menu />
      <Switch>
        {/* Route for FieldDropdown for valgt campus */}
        <Route exact path="/campus/:campus" component={FieldDropdown} />

        {/* Route for SubjectsByField */}
        <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} />

        {/* Routes for Subject Components */}
        <Route exact path="/fields/:fieldId/subjects/new" component={SubjectNew} />
        <Route exact path="/fields/:fieldId/subjects/:id/reviews/new" component={ReviewNew} />
        <Route exact path="/fields/:fieldId/subjects/:id" component={SubjectDetails} />

        {/* Fallback route */}
        <Route path="/" component={CampusList} />
      </Switch>
    </div>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

