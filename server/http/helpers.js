import { errorResponse } from './errors.js';
import { objectBody } from '../core/validation.js';
import { db } from '../database.js';
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCharactersRegex = /^[0-9+()\s-]+$/;
export const enrollmentLevels = new Set(['Nivel Inicial', 'Nivel Primario', 'Nivel Secundario']);
export const employmentPositions = new Set([
  'Docente de Nivel Inicial',
  'Docente de Nivel Primario',
  'Profesores de Nivel Secundario',
  'Personal Administrativo',
]);

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function sendDbError(res, error) {
  const result = errorResponse(error);
  res.status(result.status).json(result.body);
}

export function requireFields(body, fields) {
  return fields.filter((field) => {
    const value = body?.[field];
    return (
      value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
    );
  });
}

export function normalizeBody(body) {
  return Object.fromEntries(
    Object.entries(objectBody(body)).map(([field, value]) => [
      field,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
}

export function isValidPhone(value) {
  if (typeof value !== 'string') return false;
  const digitCount = value.replace(/\D/g, '').length;
  return phoneCharactersRegex.test(value) && digitCount >= 7 && digitCount <= 15;
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function insertRecord(table, data) {
  if (table === 'servicios' && !data.icono) {
    data.icono = 'school';
  }
  if (table === 'instalaciones' && !data.imagen_url) {
    data.imagen_url =
      'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900';
  }

  return db.insert(table, data);
}

export async function getById(table, id) {
  return db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}
