import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter, useHistory } from 'react-router-dom';

import SearchBar from '../src/components/SearchBar';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('SearchBar-komponenten', () => {
  beforeEach(() => {
    // Mocker standard API-respons
    mockedAxios.get.mockResolvedValue({
      data: [
        { id: '1', name: 'Matematikk' },
        { id: '2', name: 'Fysikk' },
      ],
    });
  });

  test('viser søkefelt riktig', () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>,
    );

    const inputElement = screen.getByPlaceholderText(/Søk etter emne.../);
    expect(inputElement).toBeInTheDocument();
  });

  test('fjerner forslag når man klikker utenfor komponenten', async () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>,
    );

    const inputElement = screen.getByPlaceholderText(/Søk etter emne.../);
    fireEvent.focus(inputElement);
    fireEvent.change(inputElement, { target: { value: 'Math' } });

    await waitFor(() => {
      const suggestions = screen.getAllByRole('listitem');
      expect(suggestions).toHaveLength(2);
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      const suggestionList = screen.queryByRole('list');
      expect(suggestionList).not.toBeInTheDocument();
    });
  });
});
