const EmptyState = ({ icon = 'inbox', title = 'No hay registros', description, action }) => (
  <div className="text-center py-5">
    <i className={`bi bi-${icon} text-muted`} style={{ fontSize: '3rem' }}></i>
    <h6 className="text-muted mt-3">{title}</h6>
    {description && <p className="text-muted small mb-3">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
