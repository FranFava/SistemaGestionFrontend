import { createContext, useContext, useState, useEffect } from 'react';
import { cajaService } from '../services/api';

/**
 * Contexto de cotización del dólar para conversión de precios
 * @type {React.Context}
 */
const DollarContext = createContext();

/**
 * Hook personalizado para acceder al contexto del dólar
 * @returns {{ cotizacionDolar: number|null, updateCotizacion: Function, loading: boolean, error: string|null, hasCotizacion: boolean, refreshCotizacion: Function }}
 * @throws Error si se usa fuera de DollarProvider
 */
export const useDollar = () => {
  const context = useContext(DollarContext);
  if (!context) {
    throw new Error('useDollar debe usarse dentro de DollarProvider');
  }
  return context;
};

/**
 * Proveedor del contexto de cotización del dólar
 * @param {{ children: React.ReactNode }} props - Props del componente
 * @returns {JSX.Element}
 */
export const DollarProvider = ({ children }) => {
  const [cotizacionDolar, setCotizacionDolar] = useState(() => {
    const saved = localStorage.getItem('cotizacionDolar');
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Obtiene la cotización del dólar desde el servidor
   * Solo ejecuta la petición si hay un token de autenticación
   */
  const fetchCotizacion = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await cajaService.getCotizacion();
      const data = response.data?.data || response.data;
      if (data && data.cotizacionDolar && Number(data.cotizacionDolar) > 0) {
        const newValue = Number(data.cotizacionDolar);
        setCotizacionDolar(newValue);
        setError(null);
        localStorage.setItem('cotizacionDolar', newValue.toString());
      } else {
        setError('Sin datos de cotización');
      }
    } catch (err) {
      setError('No se pudo obtener cotización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizacion();
  }, []);

  /**
   * Actualiza la cotización del dólar en el servidor y localmente
   * @param {number} nuevoValor - Nueva cotización del dólar
   * @returns {Promise<boolean>} true si la actualización fue exitosa
   */
  const updateCotizacion = async (nuevoValor) => {
    try {
      await cajaService.updateCotizacion(nuevoValor);
      setCotizacionDolar(nuevoValor);
      localStorage.setItem('cotizacionDolar', nuevoValor.toString());
      return true;
    } catch (err) {
      throw err;
    }
  };

  return (
    <DollarContext.Provider value={{ 
      cotizacionDolar, 
      updateCotizacion, 
      loading, 
      error,
      hasCotizacion: cotizacionDolar !== null,
      refreshCotizacion: fetchCotizacion 
    }}>
      {children}
    </DollarContext.Provider>
  );
};
