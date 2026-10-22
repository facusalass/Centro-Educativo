import { db } from '../database.js';
type Line = { concepto: string; monto: number };
interface MonthlyEnrollment { lines(): Line[] }
class BaseEnrollment implements MonthlyEnrollment {
  constructor(private amount: number) {}
  lines() { return [{ concepto: 'Cursado lectivo', monto: this.amount }]; }
}
// Decorator adds each contracted service without a subclass for each combination.
class ServiceDecorator implements MonthlyEnrollment {
  constructor(private base: MonthlyEnrollment, private concept: string, private amount: number) {}
  lines() { return [...this.base.lines(), { concepto: this.concept, monto: this.amount }]; }
}
export async function monthlyQuote(studentId: number) {
  const fees = await db.all('SELECT * FROM tarifas');
  const services = await db.all("SELECT i.tipo, d.nombre AS deporte FROM inscripciones i LEFT JOIN grupos_deporte g ON g.id = i.grupo_deporte_id LEFT JOIN deportes d ON d.id = g.deporte_id WHERE i.alumno_id = ? AND i.estado = 'activo' ORDER BY i.id", [studentId]);
  const required = ['base', ...services.map((s) => s.tipo)];
  if (required.some((type) => !fees.some((f) => f.tipo === type))) return { configurado: false, conceptos: [], total: null };
  const amount = (type: string) => Number(fees.find((f) => f.tipo === type)!.monto);
  let enrollment: MonthlyEnrollment = new BaseEnrollment(amount('base'));
  for (const service of services) enrollment = new ServiceDecorator(enrollment, service.tipo === 'deporte' ? `Deporte: ${service.deporte}` : service.tipo === 'transporte' ? 'Transporte' : 'Comedor', amount(service.tipo));
  const conceptos = enrollment.lines();
  return { configurado: true, conceptos, total: Math.round(conceptos.reduce((n, l) => n + l.monto, 0) * 100) / 100 };
}
