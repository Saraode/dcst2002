import reviewService, { Subject, Campus } from '../src/services/review-service';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ReviewService Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for getAllCampuses
  test('getAllCampuses should fetch all campuses correctly', async () => {
    const mockCampuses: Campus[] = [
      { campusId: 1, name: 'Campus 1' },
      { campusId: 2, name: 'Campus 2' },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockCampuses });

    const result = await reviewService.getAllCampuses();

    expect(axios.get).toHaveBeenCalledWith('/campuses');
    expect(result).toEqual(mockCampuses);
  });

  // Test for getSubjectsByCampus
  test('getSubjectsByCampus should fetch subjects correctly for given campus', async () => {
    const mockSubjects: Subject[] = [
      { id: 1, name: 'Subject 1', fieldId: 1, reviews: [] },
      { id: 2, name: 'Subject 2', fieldId: 1, reviews: [] },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockSubjects });

    const campus = 'TestCampus';
    const result = await reviewService.getSubjectsByCampus(campus);

    expect(axios.get).toHaveBeenCalledWith(`/campus/${campus}/subjects`);
    expect(result).toEqual(mockSubjects);
  });

  // Test for createReview
  test('createReview should post review data correctly', async () => {
    const mockResponse = { id: 123 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const subjectId = 1;
    const text = 'Great subject!';
    const stars = 5;
    const userId = 42;
    const submitterName = 'Tester';

    const result = await reviewService.createReview(subjectId, text, stars, userId, submitterName);

    expect(axios.post).toHaveBeenCalledWith(`/subjects/${subjectId}/reviews`, {
      text,
      stars,
      userId,
      submitterName,
    });
    expect(result).toBe(mockResponse.id);
  });

  // Test for createSubject
  test('createSubject should post subject data correctly', async () => {
    const mockResponse = { id: 456 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const campus = 'TestCampus';
    const name = 'New Subject';
    const level = 'Beginner';

    const result = await reviewService.createSubject(campus, name, level);

    expect(axios.post).toHaveBeenCalledWith(`/fields/${campus}/subjects`, { name, level });
    expect(result).toBe(mockResponse.id);
  });

  // Test for failure scenario in getSubjectsByCampus
  test('getSubjectsByCampus should handle errors gracefully', async () => {
    const errorMessage = 'Failed to fetch subjects';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(reviewService.getSubjectsByCampus('NonExistentCampus')).rejects.toThrow(
      errorMessage,
    );
  });

  // Test for createPageVersion
  test('createPageVersion should post data correctly', async () => {
    const mockResponse = { version: 'v1.0' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const fieldId = 1;
    const userId = 'user123';

    const result = await reviewService.createPageVersion(fieldId, userId);

    expect(axios.post).toHaveBeenCalledWith(`/api/fields/${fieldId}/version`, { userId });
    expect(result).toBe(mockResponse.version);
  });

  // Test for createSubjectVersion
  test('createSubjectVersion should post data correctly', async () => {
    const mockResponse = { version: 'v2.0' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const subjectId = 'subject123';
    const userId = 'user456';
    const actionType = 'update';

    const result = await reviewService.createSubjectVersion(subjectId, userId, actionType);

    expect(axios.post).toHaveBeenCalledWith(`/subjects/${subjectId}/version`, {
      userId,
      actionType,
    });
    expect(result).toBe(mockResponse.version);
  });
});

describe('ReviewService Tests - Expanded for Full Coverage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Existing Tests for ReviewService...

  // Expanded test for getSubject with invalid subject ID
  test('getSubject should handle non-existent subject correctly', async () => {
    const errorMessage = 'Subject not found';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(reviewService.getSubject(9999)).rejects.toThrow(errorMessage);
    expect(axios.get).toHaveBeenCalledWith(`/subjects/9999`);
  });

  // Test for createPageVersion with invalid fieldId
  test('createPageVersion should handle invalid fieldId correctly', async () => {
    const errorMessage = 'Invalid fieldId';
    mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

    await expect(reviewService.createPageVersion(-1, 'user123')).rejects.toThrow(errorMessage);
    expect(axios.post).toHaveBeenCalledWith(`/api/fields/-1/version`, { userId: 'user123' });
  });

  // Test for createSubjectVersion with invalid action type
  test('createSubjectVersion should handle invalid actionType correctly', async () => {
    const subjectId = 'subject123';
    const userId = 'user456';
    const actionType = 'invalidType';

    const errorMessage = 'Invalid action type';
    mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

    await expect(reviewService.createSubjectVersion(subjectId, userId, actionType)).rejects.toThrow(
      errorMessage,
    );
    expect(axios.post).toHaveBeenCalledWith(`/subjects/${subjectId}/version`, {
      userId,
      actionType,
    });
  });

  // Test createReview with missing parameters
  test('createReview should throw error when required parameters are missing', async () => {
    const errorMessage = 'Missing parameters';
    mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

    await expect(reviewService.createReview(1, '', 0, 0, '')).rejects.toThrow(errorMessage);
    expect(axios.post).toHaveBeenCalledWith(`/subjects/1/reviews`, {
      text: '',
      stars: 0,
      userId: 0,
      submitterName: '',
    });
  });
});
