import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import ChangeHistory from '../src/components/endringslogg';

// Mock axios
const mock = new MockAdapter(axios);

describe('Endringslogg komponenten', () => {
  afterEach(() => {
    mock.reset();
  });

  test('knappen for å åpne endringsloggen', () => {
    render(<ChangeHistory />);
    const button = screen.getByText('Vis endringslogg');
    expect(button).toBeInTheDocument();
  });

  test('håndterer API feil på en bra måte', async () => {
    mock.onGet('/api/history').reply(500);

    render(<ChangeHistory />);
    const button = screen.getByText('Vis endringslogg');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Ingen logg å finne.')).toBeInTheDocument();
    });
  });
});
