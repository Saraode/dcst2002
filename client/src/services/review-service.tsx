import axios from 'axios';
import { Subject, Campus } from '../types/ServiceTypes';

// Setter baseURL for axios, slik at alle API-anrop går til denne basen
axios.defaults.baseURL = 'http://localhost:3000/api';

class ReviewService {
  // Henter alle campus (fakulteter)
  getAllCampuses() {
    return axios.get<Campus[]>('/campuses').then((response) => response.data);
  }

  // Henter emner for et gitt campus
  getSubjectsByCampus(campus: string): Promise<Subject[]> {
    return axios.get<Subject[]>(`/campus/${campus}/subjects`).then((response) => response.data);
  }

  // Henter emner for et gitt fagområde (fieldId)
  getSubjectsByField(fieldId: number) {
    return axios.get<Subject[]>(`/fields/${fieldId}/subjects`).then((response) => response.data);
  }

  // Henter spesifikt emne basert på emne-ID
  getSubject(id: number) {
    return axios.get<Subject>(`/subjects/${id}`).then((response) => response.data);
  }

  // Oppretter et nytt emne for et gitt campus med navn og nivå
  createSubject(campus: string, name: string, level: string) {
    return axios
      .post<{ id: number }>(`/fields/${campus}/subjects`, { name, level })
      .then((response) => response.data.id); // Returnerer den nyopprettede emnekoden (id)
  }

  // Oppretter en anmeldelse for et spesifikt emne
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
      .then((response) => response.data.id); // Returnerer den nyopprettede anmeldelsen (id)
  }

  // Oppretter en versjon for en fagområde (fieldId) som er oppdatert
  async createPageVersion(fieldId: number, userId: string) {
    console.log(`Calling createPageVersion with fieldId: ${fieldId} by userId: ${userId}`);

    return axios
      .post(`/api/fields/${fieldId}/version`, { userId })
      .then((response) => response.data.version); // Returnerer versjonsnummeret
  }

  // Oppretter en versjon for et spesifikt emne (subjectId) basert på handlingen (f.eks. redigering)
  async createSubjectVersion(subjectId: string, userId: string, actionType: string) {
    return axios
      .post(`/subjects/${subjectId}/version`, { userId, actionType })
      .then((response) => response.data.version); // Returnerer versjonsnummeret for emnet
  }
}

// Oppretter en instans av ReviewService
const reviewService = new ReviewService();
export default reviewService;
