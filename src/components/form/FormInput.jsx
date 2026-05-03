import { forwardRef } from 'react';

const FormInput = forwardRef(({
  label, name, type = 'text', value, onChange, error, required,
  placeholder, icon, disabled, className = '', helperText, maxLength, ...rest
}, ref) => {
  const showCounter = maxLength !== undefined && maxLength > 0;
  const currentLength = value ? value.length : 0;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className={icon ? 'input-group' : ''}>
        {icon && (
          <span className="input-group-text" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            <i className={`bi bi-${icon}`}></i>
          </span>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
          style={icon ? { borderRadius: '0 8px 8px 0' } : {}}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          {...rest}
        />
      </div>
      {(error || helperText || showCounter) && (
        <div className="d-flex justify-content-between align-items-center mt-1">
          {error ? (
            <div id={`${name}-error`} className="invalid-feedback d-block">{error}</div>
          ) : helperText ? (
            <small id={`${name}-helper`} className="text-glass-secondary" style={{ fontSize: '0.8rem' }}>
              {helperText}
            </small>
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

export default FormInput;
