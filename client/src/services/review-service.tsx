import axios from 'axios';
import { Subject, Review, Campus } from '../types/ServiceTypes';

axios.defaults.baseURL = 'http://localhost:3000/api';

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

  async createPageVersion(fieldId: number, userId: string) {
    console.log(`Calling createPageVersion with fieldId: ${fieldId} by userId: ${userId}`);

    return axios
      .post(`/api/fields/${fieldId}/version`, { userId })
      .then((response) => response.data.version);
  }
  async createSubjectVersion(subjectId: string, userId: string, actionType: string) {
    return axios
      .post(`/subjects/${subjectId}/version`, { userId, actionType })

      .then((response) => response.data.version);
  }
}

const reviewService = new ReviewService();
export default reviewService;
