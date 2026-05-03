import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_VISIBLE = 20;

const SearchableSelect = ({
  label, value, onChange, options, error, required,
  placeholder = 'Buscar...', displayKey = 'nombre', valueKey = '_id',
  className = '', disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = options.filter(opt => {
    const display = opt[displayKey] || opt.label || '';
    return display.toLowerCase().includes(search.toLowerCase());
  });
  const isLimited = filtered.length > MAX_VISIBLE;
  const visible = isLimited ? filtered.slice(0, MAX_VISIBLE) : filtered;

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
    setHighlightedIdx(-1);
  }, [onChange, valueKey]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIdx >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIdx];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIdx, isOpen]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      handleSelect(visible[highlightedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setHighlightedIdx(-1);
  };

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
          <span className={selected ? '' : 'text-muted'} style={{ flex: 1 }}>
            {selected ? (selected[displayKey] || selected.label || value) : placeholder}
          </span>
          {selected && (
            <i
              className="bi bi-x-circle me-1"
              style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
              onClick={handleClear}
              onMouseEnter={e => e.target.style.color = '#ef5350'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
            ></i>
          )}
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
        {error && <div className="invalid-feedback d-block">{error}</div>}
        {isOpen && !disabled && (
          <div
            className="position-absolute w-100 mt-1 glass-card p-2"
            style={{ zIndex: 1060, maxHeight: '280px', overflowY: 'auto', animation: 'fadeInUp 0.15s ease-out' }}
            onKeyDown={handleKeyDown}
            ref={listRef}
          >
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm glass-input mb-2"
              placeholder="Escribir para buscar..."
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlightedIdx(-1); }}
              onClick={e => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            />
            {filtered.length === 0 && (
              <div className="text-muted text-center py-2 small">Sin resultados</div>
            )}
            {visible.map((opt, idx) => (
              <div
                key={opt[valueKey]}
                className={`px-2 py-1 rounded ${idx === highlightedIdx ? 'bg-primary bg-opacity-25' : ''} ${opt[valueKey] === value ? 'bg-primary bg-opacity-15' : ''}`}
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightedIdx(idx)}
                onMouseLeave={() => setHighlightedIdx(-1)}
              >
                {opt[displayKey] || opt.label}
              </div>
            ))}
            {isLimited && (
              <div className="text-center small text-glass-secondary mt-1">
                Mostrando {MAX_VISIBLE} de {filtered.length} resultados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
