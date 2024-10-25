import React from 'react';

interface SearchBarProps {
  query: string;
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onSearch }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Søk i fag..."
      />
    </div>
  );
};

export default SearchBar;

/*
import React, { useState } from 'react';

interface SearchBarProps {
  query1: string;
  query2: string;
  onSearch1: (query: string) => void;
  onSearch2: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query1, query2, onSearch1, onSearch2 }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={query1}
        onChange={(e) => onSearch1(e.target.value)}
        placeholder="Søk i fag 1..."
      />
      <input
        type="text"
        value={query2}
        onChange={(e) => onSearch2(e.target.value)}
        placeholder="Søk i fag 2..."
      />
    </div>
  );
};

export default SearchBar;
*/
