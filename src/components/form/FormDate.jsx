import { forwardRef } from 'react';

const FormDate = forwardRef(({
  label, name, value, onChange, error, required, disabled,
  className = '', min, max, ...rest
}, ref) => (
  <div className={`mb-3 ${className}`}>
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <input
      ref={ref}
      id={name}
      name={name}
      type="date"
      className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
      value={value || ''}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
      aria-invalid={!!error}
      {...rest}
    />
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
));

export default FormDate;
