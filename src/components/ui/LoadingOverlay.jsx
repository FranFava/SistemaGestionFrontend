const LoadingOverlay = ({ text = 'Cargando...' }) => (
  <div className="d-flex justify-content-center py-5">
    <div className="text-center">
      <div className="spinner-border text-primary mb-2"></div>
      <div className="text-muted small">{text}</div>
    </div>
  </div>
);

export default LoadingOverlay;
