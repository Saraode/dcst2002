import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

Modal.setAppElement('#root');

type ChangeHistoryEntry = {
  version_number: number;
  timestamp: string;
  user_name: string;
  action_type: string;
};

const ChangeHistory: React.FC = () => {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    const fetchChangeHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/history');
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching change history:', error);
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
      {/* "Vis endringslogg" Button */}
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

      {/* Modal for Change History */}
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
            {history.map((entry, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <span>
                  <strong>{entry.user_name}</strong> has {entry.action_type} a subject on{' '}
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default ChangeHistory;
