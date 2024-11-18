import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import ChangeHistory from '../src/endringslogg';

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

  test('åpner og lukker loggen som den skal', async () => {
    render(<ChangeHistory />);
    const button = screen.getByText('Vis endringslogg');

    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Siste endringer:')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Lukk');
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText('Siste endringer:')).not.toBeInTheDocument();
    });
  });

  test('Viser lastingen av innhold og at loggen faktisk vises', async () => {
    const mockHistory = [
      {
        version_number: 1,
        timestamp: '2024-11-17T10:00:00Z',
        user_name: 'Mathilde',
        action_type: 'Commented on',
      },
    ];

    mock.onGet('/api/history').reply(200, mockHistory);

    render(<ChangeHistory />);
    const button = screen.getByText('Vis endringslogg');
    fireEvent.click(button);

    expect(screen.getByText('Laster siste endringer...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mathilde')).toBeInTheDocument();
    });
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
