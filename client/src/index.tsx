import React from 'react';
import ReactDOM from 'react-dom';
import { NavBar, Card, Alert } from './widgets';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  CampusList,
  SubjectList,
  SubjectDetails,
  SubjectNew,
  ReviewNew,
} from './subject-components'; // Updated imports

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
      <Menu /> {/* Display the campus menu */}
      <Switch>
        {/* Route for campus subject list */}
        <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} />
        <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} />
        <Route exact path="/campus/:campus/subjects/:id" component={SubjectDetails} />
        <Route exact path="/campus/:campus" component={SubjectList} />

        {/* Fallback route (optional) */}
        <Route path="/" component={CampusList} />
      </Switch>
    </div>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));
