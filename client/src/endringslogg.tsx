import React, { useState, useEffect } from 'react';
import axios from 'axios';

type ChangeHistoryEntry = {
  version_number: number;
  timestamp: string;
  user_name: string;
  action_type: string; // Add action type
};

const ChangeHistory: React.FC = () => {
  const [history, setHistory] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch change history from backend when component mounts
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
  }, []); // Empty dependency array ensures it runs only on mount

  return (
    <div style={{ marginTop: '20px' }}>
      {isLoading ? (
        <p>Loading change history...</p>
      ) : (
        <ul>
          {history.map((entry, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <span>
                <strong>{entry.user_name}</strong> has {entry.action_type} a subject at{' '}
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChangeHistory;
