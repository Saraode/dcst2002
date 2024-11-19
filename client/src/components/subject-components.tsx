// Importerer nødvendige komponenter og tjenester
import * as React from 'react';
import { Component } from 'react-simplified';  // Bruker react-simplified for enklere komponenthåndtering
import { Alert, Card, Row, Column, Form, Button } from './widgets';  // Importerer UI-komponenter
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom'; // Importerer router-relaterte funksjoner
import reviewService from '../services/review-service';  // Importerer reviewService for å hente og sende anmeldelser
import { Subject, Review, Campus, CampusListState } from '../types/ServiceTypes';  // Importerer typer for emner, vurderinger osv.
import { createHashHistory } from 'history'; // Bruker hashHistory for navigering
import axios from 'axios'; // Bruker axios for API-anrop
import ChangeHistory from './endringslogg'; // Importerer komponent for endringslogg

// Setter opp historikk med hash
const history = createHashHistory();

// CampusList-komponenten for å vise velkomstmelding og endringslogg
export class CampusList extends Component<{}, CampusListState> {
  state = {
    showHistory: false,  // Holder styr på om endringsloggen skal vises eller ikke
  };

  // Funksjon for å toggle (skru av/på) visning av endringsloggen
  toggleHistory = () => {
    this.setState((prevState) => ({ showHistory: !prevState.showHistory }));
  };

  render() {
    return (
      <Card title="">
        <div style={{ textAlign: 'center', marginTop: '20vh' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#00509e' }}>
            Velkommen til NTNU Emnevurderinger
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#333', marginTop: '1rem' }}>
            Din kilde til å finne de beste emnene ved NTNU!
          </p>
          <ChangeHistory /> {/* Endringslogg-komponenten */}
        </div>
      </Card>
    );
  }
}

// SubjectList-komponenten for å vise emner på campus
class SubjectList extends Component<RouteComponentProps<{ campus: string }>> {
  subjects: Subject[] = [];  // Lagrer emnene som hentes fra API

  render() {
    return (
      <>
        <Card title={`Subjects at ${this.props.match.params.campus}`}>
          {/* Iterer gjennom emnene og vis dem som lenker */}
          {this.subjects.map((subject) => (
            <Row key={subject.id}>
              <Column>
                <NavLink to={`/campus/${this.props.match.params.campus}/subjects/${subject.id}`}>
                  {subject.id} {subject.name}
                </NavLink>
              </Column>
            </Row>
          ))}
        </Card>
        <Button.Success
          onClick={() =>
            this.props.history.push(`/campus/${this.props.match.params.campus}/subjects/new`)
          }
        >
          New Subject  {/* Knapp for å lage et nytt emne */}
        </Button.Success>
      </>
    );
  }

  // Henter emner når komponenten er montert
  mounted() {
    reviewService
      .getSubjectsByCampus(this.props.match.params.campus)  // Henter emner fra API
      .then((subjects: Subject[]) => {
        this.subjects = subjects;  // Setter emnene i komponentens state
      })
      .catch((error: { message: string }) =>
        Alert.danger('Error getting subjects: ' + error.message),  // Håndterer feil ved henting
      );
  }
}

// Wrapping SubjectList med withRouter for å få tilgang til router props
export const SubjectListWithRouter = withRouter(SubjectList);

// SubjectDetails-komponenten for å vise detaljer om et spesifikt emne
class SubjectDetails extends Component<RouteComponentProps<{ campus: string; id: string }>> {
  subject: Subject = {
    id: '',
    name: '',
    review: [],
    fieldid: 0,
    levelId: 0,
    description: '',
    view_count: 0,
  };

  render() {
    return (
      <>
        <Card title={this.subject.name}>
          <Row>
            <Column width={2}>Name:</Column>
            <Column>{this.subject.name}</Column>
          </Row>
          <Row>
            <Column width={2}>Reviews:</Column>
          </Row>
          {/* Itererer gjennom anmeldelser for emnet og viser dem */}
          {this.subject.review.map((review, index) => (
            <Row key={index}>
              <Column>
                <strong>{review.submitterName}</strong>: {review.text}
              </Column>
            </Row>
          ))}
        </Card>
        <Button.Success
          onClick={() =>
            history.push(
              `/campus/${this.props.match.params.campus}/subjects/${this.props.match.params.id}/reviews/new`,
            )
          }
        >
          Add Review  {/* Knapp for å legge til anmeldelse */}
        </Button.Success>
      </>
    );
  }

  // Henter detaljer om emnet når komponenten er montert
  mounted() {
    const subjectId = Number(this.props.match.params.id);
    reviewService
      .getSubject(subjectId)  // Henter emnedetaljer fra API
      .then((subject) => (this.subject = subject))  // Setter emnet i komponentens state
      .catch((error) => Alert.danger('Error getting subject: ' + error.message));  // Håndterer feil
  }
}

// Wrapping SubjectDetails med withRouter for å få tilgang til router props
export const SubjectDetailsWithRouter = withRouter(SubjectDetails);

// SubjectNew-komponenten for å lage et nytt emne
class SubjectNew extends Component<RouteComponentProps<{ campus: string; fieldId: string }>> {
  name = '';  // Fagkode
  level = '';  // Studienivå
  studyLevels: string[] = [];  // Liste over studienivåer

  state = {
    studyLevels: [] as string[],  // Initialiserer state for studienivåer
  };

  // Henter studienivåer ved komponentens første rendering
  async componentDidMount() {
    try {
      const response = await axios.get('/api/study-levels');
      this.setState({ studyLevels: response.data });  // Setter studienivåer i state
    } catch (error: any) {
      Alert.danger('Error fetching study levels: ' + error.message);  // Håndterer feil ved henting
    }
  }

  // Håndterer oppretting av nytt emne
  handleCreateSubject = async () => {
    try {
      const newSubjectId = await reviewService.createSubject(
        this.props.match.params.campus,
        this.name,
        this.level,
      );
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("User ID is missing from local storage. Can't create version.");
        return;
      }
      await reviewService.createPageVersion(Number(this.props.match.params.fieldId), userId);
      history.push(
        `/campus/${this.props.match.params.campus}/fields/${this.props.match.params.fieldId}/subjects/${newSubjectId}`,
      );
    } catch (error) {
      Alert.danger('Failed to create subject or page version: ' + (error as Error).message);  // Håndterer feil
    }
  };

  render() {
    const { studyLevels } = this.state;

    return (
      <>
        <Card title="New Subject">
          <Row>
            <Column width={2}>
              <Form.Label>Fagkode:</Form.Label>
            </Column>
            <Column>
              <Form.Input
                type="text"
                value={this.name}
                onChange={(event) => (this.name = event.currentTarget.value)}  // Håndterer endring i fagkode
              />
            </Column>
          </Row>
          <Row>
            <Column width={2}>
              <Form.Label>Studienivå:</Form.Label>
            </Column>
            <Column>
              {/* Viser en liste med studienivåer som sjekkbokser */}
              {studyLevels.map((level) => (
                <Form.Checkbox
                  key={level}
                  checked={this.level === level}
                  label={level}
                  onChange={() => (this.level = level)}  // Oppdaterer valgt nivå
                />
              ))}
            </Column>
          </Row>
        </Card>
        <Button.Success onClick={this.handleCreateSubject}>Opprett emne</Button.Success>  {/* Knapp for å opprette nytt emne */}
      </>
    );
  }
}

// Wrapping SubjectNew med withRouter for å få tilgang til router props
export const SubjectNewWithRouter = withRouter(SubjectNew);

// ReviewNew-komponenten for å legge til en ny vurdering
class ReviewNew extends Component<
  RouteComponentProps<{ campus: string; id: string }> & { submitterName: string }
> {
  reviewText = '';  // Vurderingstekst
  stars = 5;  // Antall stjerner for vurderingen

  render() {
    return (
      <>
        <Card title="New Review">
          <Row>
            <Column width={2}>
              <Form.Label>Review:</Form.Label>
            </Column>
            <Column>
              <Form.Textarea
                value={this.reviewText}
                onChange={(event) => (this.reviewText = event.currentTarget.value)}  // Håndterer endring i vurderingstekst
                rows={10}
              />
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
              Alert.danger('User is not logged in. Please log in to submit a review.');  // Sjekker om bruker er logget inn
              return;
            }
            reviewService
              .createReview(
                Number(this.props.match.params.id),
                this.reviewText,
                this.stars,
                Number(userId),
                this.props.submitterName,
              )
              .then(() =>
                history.push(
                  `/campus/${this.props.match.params.campus}/subjects/${this.props.match.params.id}`,
                ),
              )
              .catch((error) => Alert.danger('Failed to add review: ' + error.message));  // Håndterer feil ved vurdering
          }}
        >
          Submit Review  {/* Knapp for å sende inn vurdering */}
        </Button.Success>
      </>
    );
  }
}

// Wrapping ReviewNew med withRouter for å få tilgang til router props
export const ReviewNewWithRouter = withRouter(ReviewNew);
