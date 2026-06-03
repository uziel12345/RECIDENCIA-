import { useState, useEffect } from "react";
import { useBuildingStore } from "../../../store/building-store";
import { Icon } from "../../../components/ui/Icons";

const DEBOUNCE_MS = 250;

export function BuildingSearch() {
  const setSearchTerm = useBuildingStore((state) => state.setSearchTerm);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchTerm]);

  function handleClear() {
    setInputValue("");
    setSearchTerm("");
  }

  return (
    <div className="ito-search">
      <span className="ito-search__icon">
        <Icon name="search" size={18} />
      </span>

      <input
        id="building-search"
        type="search"
        className="ito-search__input"
        placeholder="Buscar aula, tramite o edificio..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        aria-label="Buscar edificio, aula, tramite o servicio"
        autoComplete="off"
      />

      {inputValue.trim() && (
        <button
          type="button"
          className="ito-search__clear"
          onClick={handleClear}
          aria-label="Limpiar busqueda"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
