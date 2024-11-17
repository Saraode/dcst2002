import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useHistory } from 'react-router-dom';

type SearchResult = {
  id: string;
  name: string;
};

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false); // Holder oversikt over fokusstatus
  const searchBarRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); // Brukes til å sammenligne gjeldende side
  const history = useHistory(); // For navigasjon

  // Tøm søkefeltet når siden endres
  useEffect(() => {
    setQuery('');
    setSuggestions([]);
  }, [location.pathname]);

  // Henter forslag fra API
  useEffect(() => {
    if (query.trim().length > 0) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/api/search?query=${query}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Håndterer klikk utenfor søkefeltet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setIsFocused(false); // Setter fokus til false hvis klikk er utenfor
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (result: SearchResult) => {
    setQuery(`${result.id} ${result.name}`);
    setSuggestions([]);
    if (location.pathname !== `/subjects/${result.id}`) {
      history.push(`/subjects/${result.id}`); // Naviger til valgt emneside kun hvis det ikke allerede er på siden
    }
  };

  return (
    <div className="search-bar" ref={searchBarRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)} // Setter fokus til true når input er fokusert
        placeholder="Søk etter emne..."
        className="searchbar"
      />
      {isFocused && query.trim().length > 0 && (
        <ul className="suggestions-list">
          {suggestions.length > 0 &&
            suggestions.map((result) => (
              <li key={result.id} onClick={() => handleSuggestionClick(result)}>
                {result.id} {result.name}
              </li>
            ))}

          {/* Kommentert ut delen for "Ingen emner funnet" */}
          {/* {suggestions.length === 0 && query.trim().length > 0 && (
            <li className="no-results-suggestion">Ingen emner funnet</li>
          )} */}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;