import { Subject, Campus } from 'src/types/ServiceTypes';
import reviewService from '../src/services/review-service';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Tester for ReviewService', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Rydder opp mock-funksjoner etter hver test
  });

  test('getAllCampuses henter alle campuser riktig', async () => {
    const mockCampuses: Campus[] = [
      { campusId: 1, name: 'Campus 1' },
      { campusId: 2, name: 'Campus 2' },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockCampuses });

    const result = await reviewService.getAllCampuses();

    expect(axios.get).toHaveBeenCalledWith('/campuses');
    expect(result).toEqual(mockCampuses);
  });

  test('getSubjectsByCampus henter fag riktig for en gitt campus', async () => {
    const mockSubjects: Subject[] = [
      {
        id: '1',
        name: 'Fag 1',
        fieldid: 1,
        review: [],
        levelId: 0,
        description: '',
        view_count: 0,
      },
      {
        id: '2',
        name: 'Fag 2',
        fieldid: 1,
        review: [],
        levelId: 0,
        description: '',
        view_count: 0,
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockSubjects });

    const campus = 'TestCampus';
    const result = await reviewService.getSubjectsByCampus(campus);

    expect(axios.get).toHaveBeenCalledWith(`/campus/${campus}/subjects`);
    expect(result).toEqual(mockSubjects);
  });

  test('createReview sender korrekt anmeldelse', async () => {
    const mockResponse = { id: 123 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await reviewService.createReview(1, 'Bra fag!', 5, 42, 'Tester');

    expect(axios.post).toHaveBeenCalledWith('/subjects/1/reviews', {
      text: 'Bra fag!',
      stars: 5,
      userId: 42,
      submitterName: 'Tester',
    });
    expect(result).toBe(mockResponse.id);
  });

  test('createSubject sender korrekt faginformasjon', async () => {
    const mockResponse = { id: 456 };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await reviewService.createSubject('TestCampus', 'Nytt fag', 'Nybegynner');

    expect(axios.post).toHaveBeenCalledWith('/fields/TestCampus/subjects', {
      name: 'Nytt fag',
      level: 'Nybegynner',
    });
    expect(result).toBe(mockResponse.id);
  });

  test('getSubjectsByCampus håndterer feil riktig', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Kunne ikke hente fag'));

    await expect(reviewService.getSubjectsByCampus('FeilCampus')).rejects.toThrow(
      'Kunne ikke hente fag',
    );
  });

  test('createPageVersion sender korrekt data', async () => {
    const mockResponse = { version: 'v1.0' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await reviewService.createPageVersion(1, 'user123');

    expect(axios.post).toHaveBeenCalledWith('/api/fields/1/version', { userId: 'user123' });
    expect(result).toBe(mockResponse.version);
  });

  test('createSubjectVersion sender korrekt data', async () => {
    const mockResponse = { version: 'v2.0' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

    const result = await reviewService.createSubjectVersion('subject123', 'user456', 'update');

    expect(axios.post).toHaveBeenCalledWith('/subjects/subject123/version', {
      userId: 'user456',
      actionType: 'update',
    });
    expect(result).toBe(mockResponse.version);
  });
});

describe('ReviewService - utvidede tester', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getSubject håndterer ugyldig subject ID', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Fag ikke funnet'));

    await expect(reviewService.getSubject(9999)).rejects.toThrow('Fag ikke funnet');
    expect(axios.get).toHaveBeenCalledWith('/subjects/9999');
  });

  test('createPageVersion håndterer ugyldig fieldId', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Ugyldig fieldId'));

    await expect(reviewService.createPageVersion(-1, 'user123')).rejects.toThrow('Ugyldig fieldId');
    expect(axios.post).toHaveBeenCalledWith('/api/fields/-1/version', { userId: 'user123' });
  });

  test('createSubjectVersion håndterer ugyldig actionType', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Ugyldig action type'));

    await expect(
      reviewService.createSubjectVersion('subject123', 'user456', 'invalidType'),
    ).rejects.toThrow('Ugyldig action type');
    expect(axios.post).toHaveBeenCalledWith('/subjects/subject123/version', {
      userId: 'user456',
      actionType: 'invalidType',
    });
  });

  test('createReview kaster feil når parametere mangler', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Manglende parametere'));

    await expect(reviewService.createReview(1, '', 0, 0, '')).rejects.toThrow(
      'Manglende parametere',
    );
    expect(axios.post).toHaveBeenCalledWith('/subjects/1/reviews', {
      text: '',
      stars: 0,
      userId: 0,
      submitterName: '',
    });
  });
});
