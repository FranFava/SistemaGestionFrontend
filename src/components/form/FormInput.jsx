import { forwardRef } from 'react';

const FormInput = forwardRef(({
  label, name, type = 'text', value, onChange, error, required,
  placeholder, icon, disabled, className = '', ...rest
}, ref) => (
  <div className={`mb-3 ${className}`}>
    {label && (
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
    )}
    <div className="input-group">
      {icon && <span className="input-group-text"><i className={`bi bi-${icon}`}></i></span>}
      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        className={`form-control ${icon ? '' : 'glass-input'} ${error ? 'is-invalid' : ''}`}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
    </div>
    {error && <div id={`${name}-error`} className="invalid-feedback d-block">{error}</div>}
  </div>
));

export default FormInput;
