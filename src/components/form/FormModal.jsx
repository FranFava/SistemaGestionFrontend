import { useEffect } from 'react';

const FormModal = ({
  isOpen, onClose, title, children, onSubmit, onCancel,
  submitLabel, cancelLabel = 'Cancelar', size = 'lg',
  isLoading, isEditing,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSubmit?.(e);
      }
      if (e.key === 'Escape' && !isLoading) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block glass-modal"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s ease-out' }}
    >
      <div className={`modal-dialog modal-dialog-centered modal-${size}`}>
        <div className="modal-content" style={{ animation: 'fadeInUp 0.25s ease-out' }}>
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {children}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="glass-btn"
                onClick={onCancel || onClose}
                disabled={isLoading}
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Guardando...
                  </>
                ) : isEditing ? (submitLabel || 'Actualizar') : (submitLabel || 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
