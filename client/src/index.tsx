import React from 'react';
import ReactDOM from 'react-dom';
import { NavBar, Card, Alert } from './widgets';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SearchBar from './searchBar';
import {
  CampusList,
  SubjectList,
  SubjectDetails,
  SubjectNew,
  ReviewNew,
} from './subject-components';
import FieldDropdown from './FieldDropdown'; // Importer FieldDropdown

class Menu extends React.Component {
  state = {
    query: '',
  };

  handleSearch = (query) => {
    this.setState({ query });
    // Here you can either filter a local list or call a search function
    // For example, if you have a search function passed as a prop:
    // this.props.onSearch(query);
  };

  render() {
    return (
      <NavBar brand="NTNU">
        <NavBar.Link to="/campus/Gloshaugen">Gløshaugen</NavBar.Link>
        <NavBar.Link to="/campus/Øya">Øya</NavBar.Link>
        <NavBar.Link to="/campus/Kalvskinnet">Kalvskinnet</NavBar.Link>
        <NavBar.Link to="/campus/Dragvold">Dragvold</NavBar.Link>
        <NavBar.Link to="/campus/Handelshøyskolen">Handelshøyskolen</NavBar.Link>

        {/* Integrate the SearchBar */}
        <SearchBar query={this.state.query} onSearch={this.handleSearch} />
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
        {/* Route for campus field selector with dropdown */}
        <Route exact path="/campus/:campus" component={FieldDropdown} />

        {/* Existing routes */}
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


