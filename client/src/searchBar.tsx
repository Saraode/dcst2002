// client/SearchBar.tsx

import React, { useState, useEffect } from 'react';

type Subject = {
  id: number;
  name: string;
};

type SearchBarProps = {
  onResults: (results: Subject[]) => void; // Passerer søkeresultater til `onResults`
};

const SearchBar: React.FC<SearchBarProps> = ({ onResults }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (query.length === 0) {
      onResults([]); // Returner tomt resultat om query er tom
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/subjects/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      onResults(data); // Returner søkeresultater til `onResults`
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 500); // Forsink søket med 500ms for debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk etter fag..."
        className="searchbar"
      />
      {loading && <span>Laster...</span>}
    </div>
  );
};

export default SearchBar;
