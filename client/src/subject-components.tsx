import * as React from 'react';
import { Component } from 'react-simplified';
import { Alert, Card, Row, Column, Form, Button } from './widgets';
import { NavLink } from 'react-router-dom';
import reviewService, { Subject, Review } from './review-service';
import { createHashHistory } from 'history';

const history = createHashHistory(); // Use history.push(...) to navigate programmatically

/**
 * Renders campus list.
 */
export class CampusList extends Component {
  campuses = ['Gløshaugen', 'Øya', 'Kalvskinnet', 'Dragvold', 'Handelshøyskolen'];

  render() {
    return (
      <Card title="Campuses">
        {this.campuses.map((campus, index) => (
          <Row key={index}>
            <Column>
              <NavLink to={'/campus/' + campus}>{campus}</NavLink>
            </Column>
          </Row>
        ))}
      </Card>
    );
  }
}

/**
 * Renders subject list for a campus.
 */
export class SubjectList extends Component<{ match: { params: { campus: string } } }> {
  subjects: Subject[] = [];

  render() {
    return (
      <>
        <Card title={`Subjects at ${this.props.match.params.campus}`}>
          {this.subjects.map((subject) => (
            <Row key={subject.id}>
              <Column>
                <NavLink
                  to={'/campus/' + this.props.match.params.campus + '/subjects/' + subject.id}
                >
                  {subject.name}
                </NavLink>
              </Column>
            </Row>
          ))}
        </Card>
        <Button.Success
          onClick={() =>
            history.push('/campus/' + this.props.match.params.campus + '/subjects/new')
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
      .then((subjects) => (this.subjects = subjects))
      .catch((error) => Alert.danger('Error getting subjects: ' + error.message));
  }
}

/**
 * Renders subject details and reviews.
 */
export class SubjectDetails extends Component<{
  match: { params: { campus: string; id: number } };
}> {
  subject: Subject = { id: 0, name: '', reviews: [] };

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
              '/campus/' +
                this.props.match.params.campus +
                '/subjects/' +
                this.props.match.params.id +
                '/reviews/new',
            )
          }
        >
          Add Review
        </Button.Success>
      </>
    );
  }

  mounted() {
    reviewService
      .getSubject(this.props.match.params.id)
      .then((subject) => (this.subject = subject))
      .catch((error) => Alert.danger('Error getting subject: ' + error.message));
  }
}

/**
 * Renders form to create a new subject.
 */
export class SubjectNew extends Component<{ match: { params: { campus: string } } }> {
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
            reviewService
              .createSubject(this.props.match.params.campus, this.name)
              .then((id) =>
                history.push('/campus/' + this.props.match.params.campus + '/subjects/' + id),
              )
              .catch((error) => Alert.danger('Error creating subject: ' + error.message));
          }}
        >
          Create
        </Button.Success>
      </>
    );
  }
}

/**
 * Renders form to create a new review for a subject.
 */
export class ReviewNew extends Component<{ match: { params: { campus: string; id: number } } }> {
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
              .createReview(this.props.match.params.id, this.reviewText)
              .then(() =>
                history.push(
                  '/campus/' +
                    this.props.match.params.campus +
                    '/subjects/' +
                    this.props.match.params.id,
                ),
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
