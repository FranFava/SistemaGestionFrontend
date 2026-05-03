const FilterBar = ({ children, className = '' }) => (
  <div className={`glass-card p-3 mb-4 ${className}`}>
    <div className="row g-2">{children}</div>
  </div>
);

export const FilterItem = ({ label, children }) => (
  <div className="col-md-3 col-sm-6">
    <label className="form-label small text-muted">{label}</label>
    {children}
  </div>
);

export default FilterBar;
