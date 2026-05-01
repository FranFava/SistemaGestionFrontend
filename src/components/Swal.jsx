/* eslint-disable react-refresh/only-export-components */
import Swal from 'sweetalert2';

/**
 * Tema visual para los diálogos de SweetAlert2
 */
const swalTheme = {
  background: '#1a1a2e',
  color: '#fff',
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33'
};

/**
 * Instancia de toast configurada para notificaciones rápidas (top-end, 3s auto-close)
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1a1a2e',
  color: '#fff'
});

/**
 * Objeto de utilidades para notificaciones toast
 */
export const toast = {
  /**
   * Muestra un toast de éxito
   * @param {string} message - Mensaje a mostrar
   */
  success: (message) => Toast.fire({ icon: 'success', title: message }),

  /**
   * Muestra un toast de error
   * @param {string} message - Mensaje a mostrar
   */
  error: (message) => Toast.fire({ icon: 'error', title: message }),

  /**
   * Muestra un toast de advertencia
   * @param {string} message - Mensaje a mostrar
   */
  warning: (message) => Toast.fire({ icon: 'warning', title: message }),

  /**
   * Muestra un toast informativo
   * @param {string} message - Mensaje a mostrar
   */
  info: (message) => Toast.fire({ icon: 'info', title: message })
};

/**
 * Muestra un diálogo de confirmación Sí/Cancelar
 * @param {string} title - Título del diálogo
 * @param {string} text - Texto descriptivo
 * @returns {Promise<Object>} Resultado de SweetAlert (isConfirmed: boolean)
 */
export const confirm = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    ...swalTheme,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
};

/**
 * Muestra un diálogo de alerta simple
 * @param {string} title - Título del diálogo
 * @param {string} message - Mensaje a mostrar
 * @param {string} [icon='info'] - Tipo de ícono ('info', 'success', 'warning', 'error')
 * @returns {Promise<Object>} Resultado de SweetAlert
 */
export const alert = (title, message, icon = 'info') => {
  return Swal.fire(title, message, icon);
};

export default Swal;
