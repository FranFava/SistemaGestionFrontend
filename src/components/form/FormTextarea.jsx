import { forwardRef, useEffect, useRef, useCallback } from 'react';

const FormTextarea = forwardRef(({
  label, name, value, onChange, error, required, placeholder,
  rows = 3, disabled, className = '', maxLength, autoResize = false, ...rest
}, ref) => {
  const internalRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const el = internalRef.current;
    if (el && autoResize) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [autoResize]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const showCounter = maxLength !== undefined && maxLength > 0;
  const currentLength = value ? value.length : 0;

  const handleInput = (e) => {
    onChange?.(e);
    if (autoResize) adjustHeight();
  };

  const combinedRef = (node) => {
    internalRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <textarea
        ref={combinedRef}
        id={name}
        name={name}
        className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
        value={value || ''}
        onChange={handleInput}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        style={autoResize ? { resize: 'none', overflow: 'hidden', minHeight: `${rows * 24}px` } : {}}
        aria-invalid={!!error}
        {...rest}
      />
      {(error || showCounter) && (
        <div className="d-flex justify-content-between align-items-center mt-1">
          {error ? (
            <div className="invalid-feedback d-block">{error}</div>
          ) : showCounter ? (
            <small></small>
          ) : null}
          {showCounter && (
            <small className={`text-glass-secondary ${currentLength > maxLength ? 'text-danger' : ''}`} style={{ fontSize: '0.75rem' }}>
              {currentLength}/{maxLength}
            </small>
          )}
        </div>
      )}
    </div>
  );
});

export default FormTextarea;
