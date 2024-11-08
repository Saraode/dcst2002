import React, { useState, useEffect } from 'react';

type Subject = {
  id: number;
  name: string;
};

type SearchBarProps = {
  onResults: (results: Subject[]) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ onResults }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (query.length === 0) {
      onResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/subjects?q=${query}`);
      const data = await response.json();
      onResults(data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 500); // Delay the request by 500ms for debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk etter fag..."
      />
      {loading && <span>Loading...</span>}
    </div>
  );
};

export default SearchBar;
