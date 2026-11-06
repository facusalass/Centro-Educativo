import PDFDocument from 'pdfkit';

type FacturaLike = {
  numero_factura: string;
  periodo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  saldo_pendiente: number;
  estado: string;
};

type ItemLike = { descripcion: string; monto: number; monto_pagado?: number };

type AlumnoLike = { nombre: string; apellido: string };

function baseDoc(titulo: string): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.fontSize(16).text('Educar para Transformar', { align: 'center' });
  doc.fontSize(13).text(titulo, { align: 'center' });
  doc.moveDown();
  return doc;
}

function toBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    doc.on('data', (c: Buffer) => parts.push(c));
    doc.on('end', () => resolve(Buffer.concat(parts)));
    doc.on('error', reject);
    doc.end();
  });
}

export function facturaPdfBuffer(
  factura: FacturaLike,
  items: ItemLike[],
  alumno: AlumnoLike,
): Promise<Buffer> {
  const doc = baseDoc(`Factura ${factura.numero_factura} · Período ${factura.periodo}`);
  doc.fontSize(11).text(`Alumno: ${alumno.nombre} ${alumno.apellido}`);
  doc.text(
    `Emisión: ${String(factura.fecha_emision).slice(0, 10)} · Vence: ${String(factura.fecha_vencimiento).slice(0, 10)}`,
  );
  doc.text(
    `Total: $${Number(factura.total).toFixed(2)} · Saldo: $${Number(factura.saldo_pendiente).toFixed(2)} · Estado: ${factura.estado}`,
  );
  doc.moveDown();
  for (const it of items)
    doc.fontSize(11).text(`${it.descripcion} — $${Number(it.monto).toFixed(2)}`);
  return toBuffer(doc);
}

export function reciboPdfBuffer(
  recibo: {
    numero_recibo: string;
    fecha_emision: string;
    monto_total: number;
    detalle_json?: string;
  },
  factura: FacturaLike,
  alumno: AlumnoLike,
  imputaciones: { descripcion: string; monto_imputado: number }[] = [],
): Promise<Buffer> {
  const doc = baseDoc(`Recibo ${recibo.numero_recibo}`);
  doc.fontSize(11).text(`Alumno: ${alumno.nombre} ${alumno.apellido}`);
  doc.text(`Factura: ${factura.numero_factura} · Período ${factura.periodo}`);
  doc.text(
    `Fecha: ${String(recibo.fecha_emision).slice(0, 10)} · Monto: $${Number(recibo.monto_total).toFixed(2)}`,
  );
  if (imputaciones.length) {
    doc.moveDown();
    doc.fontSize(11).text('Detalle de conceptos abonados:');
    for (const item of imputaciones)
      doc.fontSize(11).text(`${item.descripcion} — $${Number(item.monto_imputado).toFixed(2)}`);
  }
  return toBuffer(doc);
}
