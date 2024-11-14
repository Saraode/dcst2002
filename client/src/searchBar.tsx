import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

type Subject = {
  id: string; // Endre til string hvis emnekoder har bokstaver
  name: string;
};

type SearchBarProps = {
  onResults: (results: Subject[]) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ onResults }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Subject[]>([]);
  const [noResults, setNoResults] = useState<boolean>(false);
  const history = useHistory();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/subjects/search?q=${encodeURIComponent(trimmedQuery)}`
      );
      const data = await response.json();
      setSuggestions(data);
      setNoResults(data.length === 0);
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
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSuggestionClick = (suggestion: Subject) => {
    setQuery(`${suggestion.id.toUpperCase()} ${suggestion.name}`);
  };

  const handleButtonClick = () => {
    const trimmedQuery = query.trim();
    const matchedSubject = suggestions.find(
      (subject) =>
        `${subject.id.toUpperCase()} ${subject.name}`.toLowerCase() === trimmedQuery.toLowerCase()
    );

    if (matchedSubject) {
      history.push(`/subjects/${matchedSubject.id}`);
    } else {
      handleSearch().then(() => {
        const newMatch = suggestions.find(
          (subject) =>
            `${subject.id.toUpperCase()} ${subject.name}`.toLowerCase() === trimmedQuery.toLowerCase()
        );
        if (newMatch) {
          history.push(`/subjects/${newMatch.id}`);
        } else {
          alert('Ingen emner funnet. Prøv et annet søk.');
        }
      });
    }
    setSuggestions([]);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery('');
    setSuggestions([]);
  }, [location.pathname]);

  return (
    <div ref={searchContainerRef} className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk etter emne..."
        className="searchbar"
      />
      <button onClick={handleButtonClick} className="search-button">Søk</button>

      {suggestions.length > 0 || noResults ? (
        <ul className="suggestions-list">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion.id.toUpperCase()} {suggestion.name}
            </li>
          ))}
          {noResults && !loading && (
            <li className="no-results-suggestion">Ingen emner funnet</li>
          )}
        </ul>
      ) : null}
    </div>
  );
};

export default SearchBar;
