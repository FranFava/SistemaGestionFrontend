import { forwardRef } from 'react';

const FormTextarea = forwardRef(({
  label, name, value, onChange, error, required, placeholder,
  rows = 3, disabled, className = '', ...rest
}, ref) => (
  <div className={`mb-3 ${className}`}>
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      id={name}
      name={name}
      className={`form-control glass-input ${error ? 'is-invalid' : ''}`}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      aria-invalid={!!error}
      {...rest}
    />
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
));

export default FormTextarea;
