import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useHistory } from 'react-router-dom';

import { SearchResult } from '../types/ServiceTypes'


const SearchBar: React.FC = () => {
  // State for søkespørsmål (query) og forslag (suggestions)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  // State for å holde oversikt over fokusstatus
  const [isFocused, setIsFocused] = useState(false);
  
  const searchBarRef = useRef<HTMLDivElement>(null); // Referanse til søkefeltet for å håndtere klikk utenfor
  const location = useLocation(); // Hent gjeldende URL for å tilpasse funksjonaliteten ved sidebytte
  const history = useHistory(); // Brukes for navigasjon til andre sider

  // useEffect for å tømme søkefeltet når siden endres (når pathen endres)
  useEffect(() => {
    setQuery(''); // Tøm søkefeltet
    setSuggestions([]); // Tøm forslagene
  }, [location.pathname]); // Kjører når pathen i URL-en endres

  // useEffect for å hente forslag fra API-et basert på søkespørsmålet
  useEffect(() => {
    // Hent forslag kun hvis søkespørsmålet har mer enn 1 tegn
    if (query.trim().length > 0) {
      const fetchSuggestions = async () => {
        try {
          // Send søkespørsmål til API-et for å få relevante forslag
          const response = await axios.get(`http://localhost:3000/api/search?query=${query}`);
          setSuggestions(response.data); // Sett de hentede forslagene i state
        } catch (error) {
          console.error('Error fetching suggestions:', error); // Logg feilen hvis API-kallet mislykkes
          setSuggestions([]); // Fallback til tom liste hvis API-anropet feiler
        }
      };
      fetchSuggestions(); // Kall funksjonen for å hente forslag
    } else {
      setSuggestions([]); // Hvis søkefeltet er tomt, sett forslagene til en tom liste
    }
  }, [query]); // Kjører når søkespørsmålet endres

  // useEffect for å håndtere klikk utenfor søkefeltet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Hvis klikket er utenfor søkebaren, fjern forslagene og sett fokus til false
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setSuggestions([]); // Tøm forslagene
        setIsFocused(false); // Sett fokus til false
      }
    };

    // Legg til event listener for musklikk
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Fjern event listener når komponenten fjernes
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Denne effekten kjører kun én gang når komponenten rendres

  // Håndterer når en bruker klikker på et forslag
  const handleSuggestionClick = (result: SearchResult) => {
    // Sett søkefeltet til det valgte resultatet (id og navn)
    setQuery(`${result.id} ${result.name}`);
    setSuggestions([]); // Tøm forslagene etter valg

    // Naviger til en ny side med det valgte emnet, hvis vi ikke allerede er der
    if (location.pathname !== `/subjects/${result.id}`) {
      history.push(`/subjects/${result.id}`);
    }
  };

  return (
    <div className="search-bar" ref={searchBarRef}>  {/* Referansen til søkefeltet */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}  
        onFocus={() => setIsFocused(true)}  
        placeholder="Søk etter emne..."
        className="searchbar"
      />
      {isFocused && query.trim().length > 0 && (
        <ul className="suggestions-list">
          {/* Hvis vi har forslag, vis dem i en liste */}
          {suggestions.length > 0 &&
            suggestions.map((result) => (
              <li key={result.id} onClick={() => handleSuggestionClick(result)}>
                {result.id} {result.name}
              </li>
            ))}

        </ul>
      )}
    </div>
  );
};

export default SearchBar;
