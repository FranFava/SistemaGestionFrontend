const PageHeader = ({ title, subtitle, icon, actions, className = '' }) => (
  <div className={`d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 ${className}`}>
    <div>
      <h2 className="mb-0">
        {icon && <i className={`bi bi-${icon} me-2`}></i>}{title}
      </h2>
      {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
    </div>
    {actions && <div className="d-flex gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
