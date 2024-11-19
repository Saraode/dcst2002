// Denne filen er basert på leksjonen "klient tester", men KI-verktøy har blitt brukt for å rette feil og forbedre testene.

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

describe('Tester for SubjectsByField-komponenten', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Sikrer ren tilstand for hver test
  });

  test('rendrer uten krasj', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const wrapper = shallow(<SubjectsByField />);
    expect(wrapper.exists()).toBe(true);
  });

  test('henter og viser nivåer', async () => {
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

    await new Promise(setImmediate); // Vent på at async useEffect fullfører
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith('/api/levels');
    expect(wrapper.find('label').at(0).text()).toBe('Grunnleggende emner, nivå I');
    expect(wrapper.find('label').at(1).text()).toBe('Videregående emner, nivå II');
  });

  test('legger til nytt fag med gyldige inputs', async () => {
    const mockSubject = {
      id: 'CS101',
      name: 'Datavitenskap',
      level: 1,
      description: 'En grunnleggende kurs i datavitenskap',
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
      .simulate('change', { target: { value: 'Datavitenskap' } });
    wrapper
      .find('textarea')
      .simulate('change', { target: { value: 'En grunnleggende kurs i datavitenskap' } });
    wrapper
      .find('input[type="radio"]')
      .at(0)
      .simulate('change', { target: { value: 1 } });
    wrapper.find('button').at(0).simulate('click');

    await new Promise(setImmediate); // Vent på oppdatering
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith(
      '/api/fields/1/subjects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id: 'CS101',
          name: 'Datavitenskap',
          level: 1,
          description: 'En grunnleggende kurs i datavitenskap',
        }),
      }),
    );
    expect(wrapper.find('ul li').at(0).text()).toContain('CS101 Datavitenskap');
  });

  test('håndterer ugyldige inputs ved tillegg av nytt fag', () => {
    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    wrapper
      .find('input[placeholder="Fagkode"]')
      .simulate('change', { target: { value: 'Ugyldig#Kode' } });

    expect(wrapper.find('p[style="color: red"]').text()).toBe(
      'Fagkode kan kun inneholde bokstaver, tall og mellomrom.',
    );
  });

  test('henter og viser fag basert på valgt nivå', async () => {
    const subjects = [
      { id: 'CS101', name: 'Datavitenskap' },
      { id: 'CS102', name: 'Avansert datavitenskap' },
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

    wrapper.find('button').at(1).simulate('click'); // Simulerer nivåvalg

    await new Promise(setImmediate);
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith('/api/fields/1/subjects?levelId=1');
    expect(wrapper.find('ul li').length).toBe(2);
    expect(wrapper.find('ul li').at(0).text()).toContain('CS101');
    expect(wrapper.find('ul li').at(1).text()).toContain('CS102');
  });

  test('viser feilmelding ved mislykket API-kall', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Kunne ikke hente nivåer'));

    const wrapper = mount(
      <MemoryRouter>
        <SubjectsByField />
      </MemoryRouter>,
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(fetch).toHaveBeenCalledWith('/api/levels');
    expect(console.error).toHaveBeenCalledWith('Kunne ikke hente nivåer:', expect.any(Error));
  });
});
