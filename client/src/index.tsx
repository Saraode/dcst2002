import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Menu from './menu'; // Oppdatert import til Menu
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';
import {
  CampusList,
  SubjectListWithRouter as SubjectList,
  SubjectDetailsWithRouter as SubjectDetails,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';

const App = () => (
  <Router>
    <div>
      <Menu /> {/* Dynamisk campusmeny */}
      <Switch>
        <Route exact path="/campus/:campus" component={FieldDropdown} />
        <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} />
        <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} />
        <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} />
        <Route exact path="/campus/:campus/subjects/:id" component={SubjectDetails} />
        <Route path="/" component={CampusList} />
      </Switch>
    </div>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

