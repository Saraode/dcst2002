import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { ChangeHistoryEntry } from '../types/ServiceTypes'

// Set app element for Modal (krav for tilgjengelighet)
Modal.setAppElement('#root');

const ChangeHistory: React.FC = () => {
  // State for å lagre endringshistorikk
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  // State for å vise om data er under lasting
  const [isLoading, setIsLoading] = useState(false);
  // State for å kontrollere om modal er åpen
  const [modalIsOpen, setModalIsOpen] = useState(false);

  // useEffect-hook for å hente endringshistorikk fra API ved komponentens første rendering
  useEffect(() => {
    const fetchChangeHistory = async () => {
      setIsLoading(true);  // Sett loading-tilstand til true
      try {
        // Hent data fra API-et
        const response = await axios.get('/api/history');
        console.log('API response:', response.data); // Logg API-responsen
        setHistory(Array.isArray(response.data) ? response.data : []); // Sørg for at responsen er et array
      } catch (error) {
        console.error('Error fetching change history:', error);
        setHistory([]); // Hvis det er feil, fallback til en tom array
      } finally {
        setIsLoading(false); // Sett loading til false når forespørselen er fullført
      }
    };

    fetchChangeHistory(); // Kall funksjonen for å hente endringshistorikk
  }, []); // tom array gjør at useEffect bare kjører én gang når komponenten lastes

  // Funksjon for å åpne modal
  const openModal = () => setModalIsOpen(true);
  // Funksjon for å lukke modal
  const closeModal = () => setModalIsOpen(false);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      {/* Knapp for å åpne endringslogg modal */}
      <button
        onClick={openModal}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Vis endringslogg
      </button>

      {/* Modal for å vise endringshistorikk */}
      <Modal
        isOpen={modalIsOpen} // Kontroller om modal er åpen
        onRequestClose={closeModal} // Funksjon for å lukke modal
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '20px',
            borderRadius: '8px',
          },
        }}
      >
        {/* Modal-header for å vise tittel */}
        <h2>Siste endringer:</h2>
        {/* Knapp for å lukke modal */}
        <button
          onClick={closeModal}
          style={{
            background: 'red',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            padding: '5px 10px',
            float: 'right',
          }}
        >
          Lukk
        </button>

        {/* Vis innholdet i modal */}
        {isLoading ? (
          <p>Laster siste endringer...</p> // Vist når data er under lasting
        ) : (
          <ul style={{ padding: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
            {/* Hvis vi har historikk, vis den som liste */}
            {history.length > 0 ? (
              history.map((entry, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <span>
                    <strong>{entry.user_name}</strong> har {entry.action_type} et fag på{' '}
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </li>
              ))
            ) : (
              // Hvis ingen data, vis "Ingen logg å finne"
              <p>Ingen logg å finne.</p>
            )}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default ChangeHistory;
