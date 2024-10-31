// client/SubjectComponents.tsx

import * as React from 'react';
import { Component } from 'react-simplified';
import { Alert, Card, Row, Column, Form, Button } from './widgets';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';
import reviewService, { Subject, Review } from './review-service';
import { createHashHistory } from 'history';
import axios from 'axios';
import { NavBar } from './widgets';

const history = createHashHistory(); // Use history.push(...) to navigate programmatically

export class CampusList extends Component {
  render() {
    return (
      <Card title="Velkommen til NTNU emnevurderinger – Din kilde til å finne de beste emnene ved NTNU!">
        <Column>Søk etter emne: </Column>
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
                <NavLink
                  to={`/campus/${this.props.match.params.campus}/subjects/${subject.id}`}
                >
                  {subject.id} {subject.name} {/* Display both ID and name */}
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
        console.log("Mounted subjects:", subjects); // Debugging log
      })
      .catch((error: { message: string }) => Alert.danger('Error getting subjects: ' + error.message));
  }
}

export const SubjectListWithRouter = withRouter(SubjectList);

class SubjectDetails extends Component<RouteComponentProps<{ campus: string; id: string }>> {
  subject: Subject = {
    id: 0, name: '', reviews: [],
    fieldId: 0
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
          {this.subject.reviews.map((review, index) => (
            <Row key={index}>
              <Column>{review.text}</Column>
            </Row>
          ))}
        </Card>
        <Button.Success
          onClick={() =>
            history.push(
              `/campus/${this.props.match.params.campus}/subjects/${this.props.match.params.id}/reviews/new`
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

  render() {
    return (
      <>
        <Card title="New Subject">
          <Row>
            <Column width={2}>
              <Form.Label>Name:</Form.Label>
            </Column>
            <Column>
              <Form.Input
                type="text"
                value={this.name}
                onChange={(event) => (this.name = event.currentTarget.value)}
              />
            </Column>
          </Row>
        </Card>
        <Button.Success
          onClick={() => {
            const { fieldId, campus } = this.props.match.params;
            reviewService
              .createSubject(Number(fieldId), this.name)
              .then((id) => history.push(`/campus/${campus}/subjects/${id}`))
              .catch((error) => Alert.danger('Error creating subject: ' + error.message));
          }}
        >
          Create
        </Button.Success>
      </>
    );
  }
}

export const SubjectNewWithRouter = withRouter(SubjectNew);

class ReviewNew extends Component<RouteComponentProps<{ campus: string; id: string }>> {
  reviewText = '';

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
            reviewService
              .createReview(Number(this.props.match.params.id), this.reviewText)
              .then(() =>
                history.push(
                  `/campus/${this.props.match.params.campus}/subjects/${this.props.match.params.id}`
                )
              )
              .catch((error) => Alert.danger('Error creating review: ' + error.message));
          }}
        >
          Submit Review
        </Button.Success>
      </>
    );
  }
}

export const ReviewNewWithRouter = withRouter(ReviewNew);
