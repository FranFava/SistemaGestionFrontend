import { forwardRef } from 'react';

const FormNumber = forwardRef(({
  label, name, value, onChange, error, required, placeholder,
  min = 0, max, step = '0.01', disabled, className = '',
  prefix, suffix, ...rest
}, ref) => {
  const hasAddon = prefix || suffix;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className={hasAddon ? 'input-group' : ''}>
        {prefix && (
          <span className="input-group-text" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
          }}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type="number"
          className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
          style={prefix ? { borderRadius: '0 8px 8px 0' } : {}}
          value={value || ''}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && (
          <span className="input-group-text" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderLeft: prefix ? 'none' : undefined,
            borderRadius: prefix ? '0 8px 8px 0' : '0 8px 8px 0',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
          }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
});

export default FormNumber;
