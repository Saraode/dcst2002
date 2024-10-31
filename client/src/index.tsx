import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Menu from './menu';
import FieldDropdown from './FieldDropdown';
import SubjectsByField from './SubjectsByField';
import SubjectDetails from './SubjectDetails'; // Behold kun denne importen

import {
  CampusList,
  SubjectListWithRouter as SubjectList,
  SubjectNewWithRouter as SubjectNew,
  ReviewNewWithRouter as ReviewNew,
} from './subject-components';

const App = () => (
  <Router>
  <div>
    <Menu />
    <Switch>
      <Route exact path="/campus/:campus" component={FieldDropdown} />
      <Route exact path="/fields/:fieldId/subjects" component={SubjectsByField} />
      <Route exact path="/subjects/:subjectId" component={SubjectDetails} /> {/* Kun én rute for SubjectDetails */}
      <Route exact path="/campus/:campus/subjects/new" component={SubjectNew} />
      <Route exact path="/campus/:campus/subjects/:id/reviews/new" component={ReviewNew} />
      <Route path="/" component={CampusList} />
    </Switch>
  </div>
</Router>
);

ReactDOM.render(<App />, document.getElementById('root'));
