import { forwardRef } from 'react';

const FormSelect = forwardRef(({
  label, name, value, onChange, options, error, required,
  placeholder = 'Seleccionar...', disabled, className = '', ...rest
}, ref) => (
  <div className={`mb-3 ${className}`}>
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <select
      ref={ref}
      id={name}
      name={name}
      className={`form-select glass-input ${error ? 'is-invalid' : ''}`}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      aria-invalid={!!error}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
));

export default FormSelect;
