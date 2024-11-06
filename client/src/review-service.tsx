// client/review-service.tsx

// client/review-service.tsx

import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api';

export type Subject = {
  id: number;
  name: string;
  fieldId: number;
  reviews: Review[];
  level?: string; // Legg til level-felt
};

export type Review = {
  id: number;
  text: string;
  stars: number;
  submitterName: string;
  userId: number;
};

export type Campus = {
  campusId: number;
  name: string;
};

class ReviewService {
  getAllCampuses() {
    return axios.get<Campus[]>('/campuses').then((response) => response.data);
  }

  getSubjectsByCampus(campus: string): Promise<Subject[]> {
    return axios.get<Subject[]>(`/campus/${campus}/subjects`).then((response) => response.data);
  }

  getSubjectsByField(fieldId: number) {
    return axios.get<Subject[]>(`/fields/${fieldId}/subjects`).then((response) => response.data);
  }

  getSubject(id: number) {
    return axios.get<Subject>(`/subjects/${id}`).then((response) => response.data);
  }

  createSubject(campus: string, name: string, level: string) {
    return axios
      .post<{ id: number }>(`/fields/${campus}/subjects`, { name, level })
      .then((response) => response.data.id);
  }

  createReview(
    subjectId: number,
    text: string,
    stars: number,
    userId: number,
    submitterName: string,
  ) {
    return axios
      .post<{
        id: number;
      }>(`/subjects/${subjectId}/reviews`, { text, stars, userId, submitterName })
      .then((response) => response.data.id);
  }
}

const reviewService = new ReviewService();
export default reviewService;
