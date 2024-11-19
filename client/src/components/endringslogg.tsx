import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { ChangeHistoryEntry } from '../types/ServiceTypes';

Modal.setAppElement('#root');
// for å lage modal har jeg brukt denne linken:
// https://stackademic.com/blog/how-to-implement-a-reusable-modal-component-in-react-and-typescript som insirasjon
const ChangeHistory: React.FC = () => {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    const fetchChangeHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/history');
        console.log('API response:', response.data);
        setHistory(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching change history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangeHistory();
  }, []);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
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

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
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
        <h2>Siste endringer:</h2>
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

        {isLoading ? (
          <p>Laster siste endringer...</p>
        ) : (
          <ul style={{ padding: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
            {history.length > 0 ? (
              history.map((entry, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <span>
                    <strong>{entry.user_name}</strong> has {entry.action_type} a subject on{' '}
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </li>
              ))
            ) : (
              <p>Ingen logg å finne.</p>
            )}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default ChangeHistory;
