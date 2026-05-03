const BADGE_MAP = {
  activo: 'success', inactivo: 'secondary', activa: 'success', inactiva: 'secondary',
  pendiente: 'warning', parcial: 'info', cancelado: 'success', anulado: 'danger',
  admin: 'danger', vendedor: 'info',
  bien: 'primary', servicio: 'warning',
  ARS: 'info', USD: 'warning',
  FACT: 'primary', REC: 'success', NC: 'danger', ND: 'warning', SENIA: 'info', REM: 'secondary',
  compra: 'info', venta: 'primary',
  ingreso: 'success', egreso: 'danger', ajuste: 'warning', reserva: 'info', devolucion: 'secondary',
};

const StatusBadge = ({ value, customColor }) => {
  const color = customColor || BADGE_MAP[value] || 'secondary';
  return <span className={`badge bg-${color}`}>{value}</span>;
};

export default StatusBadge;
