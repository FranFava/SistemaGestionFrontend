import { createContext, useContext, useState, useEffect } from 'react';
import { cajaService } from '../services/api';

const DollarContext = createContext();

export const useDollar = () => {
  const context = useContext(DollarContext);
  if (!context) {
    throw new Error('useDollar debe usarse dentro de DollarProvider');
  }
  return context;
};

export const DollarProvider = ({ children }) => {
  const [cotizacionDolar, setCotizacionDolar] = useState(() => {
    const saved = localStorage.getItem('cotizacionDolar');
    return saved ? Number(saved) : 1000;
  });
  const [loading, setLoading] = useState(true);

  const fetchCotizacion = async () => {
    try {
      const response = await cajaService.getCotizacion();
      const data = response.data?.data || response.data;
      if (data && data.cotizacionDolar) {
        const newValue = Number(data.cotizacionDolar);
        setCotizacionDolar(newValue);
        localStorage.setItem('cotizacionDolar', newValue.toString());
        console.log('[DollarContext] Cotización actualizada:', newValue);
      }
    } catch (err) {
      console.error('[DollarContext] Error al obtener cotización:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizacion();
  }, []);

  const updateCotizacion = async (nuevoValor) => {
    try {
      await cajaService.updateCotizacion(nuevoValor);
      setCotizacionDolar(nuevoValor);
      localStorage.setItem('cotizacionDolar', nuevoValor.toString());
      console.log('[DollarContext] Cotización actualizada a:', nuevoValor);
      return true;
    } catch (err) {
      console.error('[DollarContext] Error al actualizar cotización:', err.message);
      throw err;
    }
  };

  return (
    <DollarContext.Provider value={{ cotizacionDolar, updateCotizacion, loading, refreshCotizacion: fetchCotizacion }}>
      {children}
    </DollarContext.Provider>
  );
};
