import { useEffect, useState } from "react";

export default function AutoCompleteInput({ label, apiRoute, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(() => {
      fetch(`${apiRoute}?q=${query}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data))
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(delay);
  }, [query, apiRoute]);

  const handleSelect = (item) => {
    setQuery(item.name || item.code || item); // what to display
    onChange(item); // return the full object {id, code, name}
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto shadow">
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {item.code ? `${item.code} - ${item.name}` : item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
