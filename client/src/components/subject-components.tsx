import * as React from 'react';
import { Component } from 'react-simplified';
import { Alert, Card, Row, Column, Form, Button } from './widgets';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';
import reviewService from '../services/review-service';
import { Subject, Review, Campus, CampusListState  } from '../types/ServiceTypes';
import { createHashHistory } from 'history';
import axios from 'axios';
import ChangeHistory from './endringslogg';

const history = createHashHistory();


export class CampusList extends Component<{}, CampusListState> {
  state = {
    showHistory: false,
  };

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
          <ChangeHistory />
        </div>
      </Card>
    );
  }
}

class SubjectList extends Component<RouteComponentProps<{ campus: string }>> {
  subjects: Subject[] = [];

  render() {
    return (
      <>
        <Card title={`Subjects at ${this.props.match.params.campus}`}>
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
          New Subject
        </Button.Success>
      </>
    );
  }

  mounted() {
    reviewService
      .getSubjectsByCampus(this.props.match.params.campus)
      .then((subjects: Subject[]) => {
        this.subjects = subjects;
      })
      .catch((error: { message: string }) =>
        Alert.danger('Error getting subjects: ' + error.message),
      );
  }
}

export const SubjectListWithRouter = withRouter(SubjectList);

class SubjectDetails extends Component<RouteComponentProps<{ campus: string; id: string }>> {
  subject: Subject = {
    id: '',
    name: '',
    review: [],
    fieldid: 0,
    levelId: 0,
    description: '',
    view_count: 0
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
          Add Review
        </Button.Success>
      </>
    );
  }

  mounted() {
    const subjectId = Number(this.props.match.params.id);
    reviewService
      .getSubject(subjectId)
      .then((subject) => (this.subject = subject))
      .catch((error) => Alert.danger('Error getting subject: ' + error.message));
  }
}

export const SubjectDetailsWithRouter = withRouter(SubjectDetails);

class SubjectNew extends Component<RouteComponentProps<{ campus: string; fieldId: string }>> {
  name = '';
  level = '';
  studyLevels: string[] = [];

  state = {
    studyLevels: [] as string[],
  };

  async componentDidMount() {
    try {
      const response = await axios.get('/api/study-levels');
      this.setState({ studyLevels: response.data });
    } catch (error: any) {
      Alert.danger('Error fetching study levels: ' + error.message);
    }
  }

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
      Alert.danger('Failed to create subject or page version: ' + (error as Error).message);
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
                onChange={(event) => (this.name = event.currentTarget.value)}
              />
            </Column>
          </Row>
          <Row>
            <Column width={2}>
              <Form.Label>Studienivå:</Form.Label>
            </Column>
            <Column>
              {studyLevels.map((level) => (
                <Form.Checkbox
                  key={level}
                  checked={this.level === level}
                  label={level}
                  onChange={() => (this.level = level)}
                />
              ))}
            </Column>
          </Row>
        </Card>
        <Button.Success onClick={this.handleCreateSubject}>Opprett emne</Button.Success>
      </>
    );
  }
}

export const SubjectNewWithRouter = withRouter(SubjectNew);

class ReviewNew extends Component<
  RouteComponentProps<{ campus: string; id: string }> & { submitterName: string }
> {
  reviewText = '';
  stars = 5;

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
                onChange={(event) => (this.reviewText = event.currentTarget.value)}
                rows={10}
              />
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
              Alert.danger('User is not logged in. Please log in to submit a review.');
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
              .catch((error) => Alert.danger('Failed to add review: ' + error.message));
          }}
        >
          Submit Review
        </Button.Success>
      </>
    );
  }
}

export const ReviewNewWithRouter = withRouter(ReviewNew);
