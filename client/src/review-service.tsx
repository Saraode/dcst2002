import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api/v2';

export type Subject = {
  id: number;
  name: string;
  reviews: Review[];
};

export type Review = {
  id: number;
  text: string;
};

/**
 * Review Service to handle subjects and reviews for different campuses.
 */
class ReviewService {
  /**
   * Get a list of subjects for a given campus.
   */
  getSubjectsByCampus(campus: string) {
    return axios.get<Subject[]>(`/campus/${campus}/subjects`).then((response) => response.data);
  }

  /**
   * Get a specific subject by its id.
   */
  getSubject(id: number) {
    return axios.get<Subject>(`/subjects/${id}`).then((response) => response.data);
  }

  /**
   * Create a new subject for a specific campus.
   */
  createSubject(campus: string, name: string) {
    return axios
      .post<{ id: number }>(`/campus/${campus}/subjects`, { name })
      .then((response) => response.data.id);
  }

  /**
   * Create a new review for a specific subject.
   */
  createReview(subjectId: number, text: string) {
    return axios
      .post<{ id: number }>(`/subjects/${subjectId}/reviews`, { text })
      .then((response) => response.data.id);
  }
}

const reviewService = new ReviewService();
export default reviewService;
