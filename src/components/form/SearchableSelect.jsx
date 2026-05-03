import { useState, useRef, useEffect, useCallback } from 'react';

const SearchableSelect = ({
  label, value, onChange, options, error, required,
  placeholder = 'Buscar...', displayKey = 'nombre', valueKey = '_id',
  className = '', disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(opt => {
    const display = opt[displayKey] || opt.label || '';
    return display.toLowerCase().includes(search.toLowerCase());
  }).slice(0, 20);

  const selected = options.find(o => o[valueKey] === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((opt) => {
    onChange(opt[valueKey]);
    setIsOpen(false);
    setSearch('');
  }, [onChange, valueKey]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`mb-3 ${className}`} ref={wrapperRef}>
      {label && (
        <label className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="position-relative">
        <div
          className={`form-control glass-input d-flex align-items-center justify-content-between ${error ? 'is-invalid' : ''}`}
          style={{ cursor: 'pointer', minHeight: '38px' }}
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        >
          <span className={selected ? '' : 'text-muted'}>
            {selected ? (selected[displayKey] || selected.label || value) : placeholder}
          </span>
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
        {error && <div className="invalid-feedback d-block">{error}</div>}
        {isOpen && !disabled && (
          <div
            className="position-absolute w-100 mt-1 glass-card p-2"
            style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto' }}
          >
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm glass-input mb-2"
              placeholder="Escribir para buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {filtered.length === 0 && (
              <div className="text-muted text-center py-2 small">Sin resultados</div>
            )}
            {filtered.map(opt => (
              <div
                key={opt[valueKey]}
                className={`px-2 py-1 rounded ${opt[valueKey] === value ? 'bg-primary bg-opacity-25' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelect(opt)}
              >
                {opt[displayKey] || opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
