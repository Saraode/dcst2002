import React from 'react';
import { shallow, mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import SubjectsByField from '../src/components/SubjectsByField';

global.fetch = jest.fn() as jest.Mock;

// Mock `useParams` hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn().mockReturnValue({ fieldId: '1' }),
}));

describe('SubjectsByField Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]), // Mock levels API response
    });
    const wrapper = shallow(<SubjectsByField />);
    expect(wrapper.exists()).toBe(true);
  });

  test('fetches and displays levels', async () => {
    const levels = [
      { id: 1, name: 'Grunnleggende emner, nivå I' },
      { id: 2, name: 'Videregående emner, nivå II' },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(levels),
    });

    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    // Wait for `useEffect` to complete
    await new Promise(setImmediate);
    wrapper.update();

    // Check if levels are rendered correctly
    expect(fetch).toHaveBeenCalledWith('/api/levels');
    expect(wrapper.find('label').at(0).text()).toBe('Grunnleggende emner, nivå I');
    expect(wrapper.find('label').at(1).text()).toBe('Videregående emner, nivå II');
  });

  test('handles adding a new subject with valid inputs', async () => {
    const mockSubject = {
      id: 'CS101',
      name: 'Computer Science',
      level: 1,
      description: 'A basic computer science course',
    };

    (fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/api/fields/1/subjects') && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubject),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    wrapper.find('input[placeholder="Fagkode"]').simulate('change', { target: { value: 'CS101' } });
    wrapper
      .find('input[placeholder="Emnenavn"]')
      .simulate('change', { target: { value: 'Computer Science' } });
    wrapper
      .find('textarea')
      .simulate('change', { target: { value: 'A basic computer science course' } });

    // Simulate selecting a level
    wrapper
      .find('input[type="radio"]')
      .at(0)
      .simulate('change', { target: { value: 1 } });

    wrapper.find('button').at(0).simulate('click');

    await new Promise(setImmediate);
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith(
      '/api/fields/1/subjects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id: 'CS101',
          name: 'Computer Science',
          level: 1,
          description: 'A basic computer science course',
        }),
      }),
    );

    // Verify that the new subject appears in the list
    expect(wrapper.find('ul li').at(0).text()).toContain('CS101 Computer Science');
  });

  test('handles invalid inputs when adding a new subject', () => {
    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    wrapper
      .find('input[placeholder="Fagkode"]')
      .simulate('change', { target: { value: 'Invalid#Code' } });
    expect(wrapper.find('p[style="color: red"]').text()).toBe(
      'Fagkode kan kun inneholde bokstaver, tall og mellomrom.',
    );
  });

  test('fetches and displays subjects based on selected level', async () => {
    const subjects = [
      { id: 'CS101', name: 'Computer Science' },
      { id: 'CS102', name: 'Advanced Computer Science' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(subjects),
    });

    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    wrapper.find('button').at(1).simulate('click'); // Simulate selecting a level

    await new Promise(setImmediate);
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith('/api/fields/1/subjects?levelId=1');
    expect(wrapper.find('ul li').length).toBe(2);
    expect(wrapper.find('ul li').at(0).text()).toContain('CS101');
    expect(wrapper.find('ul li').at(1).text()).toContain('CS102');
  });

  test('displays error message on failed API call', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch levels'));

    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith('/api/levels');
    expect(console.error).toHaveBeenCalledWith('Failed to fetch levels:', expect.any(Error));
  });
});
