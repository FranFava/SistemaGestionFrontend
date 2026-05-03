import { forwardRef } from 'react';

const FormNumber = forwardRef(({
  label, name, value, onChange, error, required, placeholder,
  min = 0, max, step = '0.01', disabled, className = '',
  prefix, suffix, ...rest
}, ref) => (
  <div className={`mb-3 ${className}`}>
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <div className="input-group">
      {prefix && <span className="input-group-text">{prefix}</span>}
      <input
        ref={ref}
        id={name}
        name={name}
        type="number"
        className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
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
      {suffix && <span className="input-group-text">{suffix}</span>}
    </div>
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
));

export default FormNumber;
