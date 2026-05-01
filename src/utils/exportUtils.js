import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * @description Exports data to an Excel (.xlsx) file with custom column mappings
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Name for the output file (without extension)
 * @param {Array<{header: string, key?: string, accessor?: Function}>} columns - Column definitions with header labels and data accessors
 */
export const exportToExcel = (data, filename, columns) => {
  const ws = XLSX.utils.json_to_sheet(data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.header] = col.accessor ? col.accessor(item) : item[col.key];
    });
    return row;
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * @description Exports data to a PDF file with auto-generated table
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Name for the output file (without extension)
 * @param {Array<{header: string, key?: string, accessor?: Function}>} columns - Column definitions with header labels and data accessors
 * @param {string} [title] - Optional title for the PDF report
 */
export const exportToPDF = (data, filename, columns, title) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title || filename, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

  const headers = columns.map(col => col.header);
  const body = data.map(item => columns.map(col => {
    const value = col.accessor ? col.accessor(item) : item[col.key];
    return value !== null && value !== undefined ? String(value) : '';
  }));

  doc.autoTable({
    head: [headers],
    body: body,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`${filename}.pdf`);
};

/**
 * @description Exports product inventory to Excel with stock, pricing, and warranty info
 * @param {Array<Object>} productos - Array of product objects with variantes, precioCosto, precioVenta, etc.
 */
export const exportProductosExcel = (productos) => {
  const data = productos.map(p => ({
    SKU: p.sku,
    Nombre: p.nombre,
    Marca: p.marca || '',
    Categoría: p.categoria || '',
    'Stock Total': p.variantes.reduce((sum, v) => sum + v.stock, 0),
    'Stock Mínimo': p.stockMinimo,
    'Precio Costo': p.precioCosto,
    'Precio Venta': p.precioVenta,
    Garantía: `${p.garantiaMeses || 0} meses`
  }));
  exportToExcel(data, 'productos', Object.keys(data[0] || {}).map(k => ({ header: k, key: k })));
};

/**
 * @description Exports movement history to Excel with dates, types, and product details
 * @param {Array<Object>} movimientos - Array of movement objects with fecha, tipo, producto, etc.
 */
export const exportMovimientosExcel = (movimientos) => {
  const data = movimientos.map(m => ({
    Fecha: new Date(m.fecha).toLocaleString(),
    Tipo: m.tipo,
    Producto: m.producto?.nombre || '',
    Color: m.variante?.color || '',
    Capacidad: m.variante?.capacidad || '',
    Cantidad: m.cantidad,
    Motivo: m.motivo || '',
    Usuario: m.usuario?.nombre || ''
  }));
  exportToExcel(data, 'movimientos', Object.keys(data[0] || {}).map(k => ({ header: k, key: k })));
};

/**
 * @description Exports stock alert data to PDF showing products below minimum stock levels
 * @param {Array<Object>} alertas - Array of alert objects with sku, nombre, variante, stockMinimo
 */
export const exportAlertasPDF = (alertas) => {
  const data = alertas.map(a => [
    a.sku,
    a.nombre,
    a.variante?.color || '-',
    a.variante?.capacidad || '-',
    a.variante?.stock || 0,
    a.stockMinimo
  ]);
  
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reporte de Alertas de Stock', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

  doc.autoTable({
    head: [['SKU', 'Producto', 'Color', 'Capacidad', 'Stock Actual', 'Stock Mínimo']],
    body: data,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [192, 57, 43] }
  });

  doc.save('alertas_stock.pdf');
};