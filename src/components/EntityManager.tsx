import { type Entity, type Field } from './management/entity-definitions';
export { entityDefinitions } from './management/entity-definitions';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Search, X } from 'lucide-react';
import { request } from '../services/api';
import { Button } from './Button';
import { Feedback } from './PortalShell';
export type Row = Record<string, any>;
// Category-like fields a catalog can be narrowed by. The entity's facet is the
// one of these its table exposes with the most distinct values.
const FILTER_FACETS = ['rol', 'nivel', 'estado', 'tipo'];
export function rowLabel(row: Row) {
  return row.anio
    ? `${row.nivel} · ${row.anio} ${row.division}`
    : row.apellido
      ? `${row.apellido}, ${row.nombre}`
      : row.nombre || row.titulo || row.email || `#${row.id}`;
}
export function EntityManager({
  definition,
  rows,
  catalog,
  reload,
}: {
  definition: Entity;
  rows: Row[];
  catalog: Record<string, Row[]>;
  reload: () => Promise<void>;
}) {
  const [query, setQuery] = useState(''),
    [editing, setEditing] = useState<Row | null>(null),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState(''),
    [facetValue, setFacetValue] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    setEditing(null);
    setMessage('');
    setError('');
    setQuery('');
    setFacetValue('');
  }, [definition.path]);
  const options = (field: Field, row: Row): Row[] =>
    field.source === 'padres'
      ? (catalog.usuarios || []).filter((u) => u.rol === 'padre')
      : field.source === 'referencias'
        ? catalog[row.rol === 'docente' ? 'docentes' : 'alumnos'] || []
        : catalog[field.source || ''] || [];
  const label = (field: Field | undefined, value: unknown, row: Row) =>
    field?.source
      ? rowLabel(
          options(field, row).find((r) => String(r.id) === String(value)) || { id: value ?? '—' },
        )
      : value == null || value === ''
        ? '—'
        : String(value);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setPending(true);
    setError('');
    try {
      const data = Object.fromEntries(
        definition.fields
          .filter((f) => !(f.key === 'password' && !editing.password))
          .map((field) => [
            field.key,
            field.source
              ? editing[field.key]
                ? Number(editing[field.key])
                : null
              : field.type === 'number' || ['visible', 'disponible'].includes(field.key)
                ? Number(editing[field.key])
                : (editing[field.key] ?? ''),
          ]),
      );
      await request(`/${definition.path}${editing.id ? `/${editing.id}` : ''}`, {
        method: editing.id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      });
      await reload();
      setEditing(null);
      setMessage('Los cambios se guardaron correctamente.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const remove = async (row: Row) => {
    if (!window.confirm(`¿${definition.soft ? 'Dar de baja' : 'Eliminar'} a ${rowLabel(row)}?`))
      return;
    setPending(true);
    setError('');
    try {
      await request(`/${definition.path}/${row.id}`, { method: 'DELETE' });
      await reload();
      setMessage('Registro dado de baja.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const distinctValues = (key: string) =>
    [...new Set(rows.map((row) => String(row[key] ?? '')).filter(Boolean))].sort();
  // Among the category-like fields this table exposes, the facet is the one that
  // actually discriminates the current rows; ties keep FILTER_FACETS priority.
  const facetKey = FILTER_FACETS.filter((key) => definition.columns.includes(key)).reduce<
    string | undefined
  >(
    (best, key) => (!best || distinctValues(key).length > distinctValues(best).length ? key : best),
    undefined,
  );
  const facet = facetKey ? definition.fields.find((field) => field.key === facetKey) : undefined;
  const facetValues = facetKey ? distinctValues(facetKey) : [];
  const filtered = rows.filter((row) => {
    const matchesQuery = Object.values(row)
      .join(' ')
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase());
    const matchesFacet = !facetValue || String(row[facetKey ?? ''] ?? '') === facetValue;
    return matchesQuery && matchesFacet;
  });
  return (
    <section className="panel-card">
      <div className="section-toolbar">
        <div>
          <h2>{definition.title}</h2>
          <p>
            {filtered.length === rows.length
              ? `${rows.length} registros`
              : `${filtered.length} de ${rows.length} registros`}
          </p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setEditing(Object.fromEntries(definition.fields.map((f) => [f.key, f.initial ?? ''])));
          }}
        >
          <Plus size={17} /> Nuevo registro
        </Button>
      </div>
      <Feedback error>{error}</Feedback>
      <Feedback>{message}</Feedback>
      {editing && (
        <form className="entity-editor" onSubmit={save}>
          <div className="section-toolbar">
            <h3>{editing.id ? 'Editar registro' : 'Nuevo registro'}</h3>
            <button
              type="button"
              className="icon-button"
              onClick={() => setEditing(null)}
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>
          <div className="editor-grid">
            {definition.fields.map((field) => (
              <label key={field.key}>
                {field.label}
                {field.required ? ' *' : ''}
                {field.options || field.source ? (
                  <select
                    value={editing[field.key] ?? ''}
                    required={field.required}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [field.key]: e.target.value,
                        ...(field.key === 'rol' ? { referencia_id: '' } : {}),
                      })
                    }
                  >
                    <option value="">Seleccionar…</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>
                        {o === '1' ? 'Sí' : o === '0' ? 'No' : o}
                      </option>
                    ))}
                    {field.source &&
                      options(field, editing).map((r) => (
                        <option key={r.id} value={r.id}>
                          {rowLabel(r)}
                        </option>
                      ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    required={field.required}
                    value={editing[field.key] ?? ''}
                    onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value })}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    required={field.required || (field.key === 'password' && !editing.id)}
                    min={field.type === 'number' ? 1 : undefined}
                    minLength={field.type === 'password' ? 10 : undefined}
                    autoComplete={field.type === 'password' ? 'new-password' : undefined}
                    value={editing[field.key] ?? ''}
                    onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
      <div className="entity-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label={`Buscar en ${definition.title}`}
            placeholder="Buscar por nombre, legajo, DNI…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {facet && facetValues.length > 0 && (
          <label className="filter-field">
            <span className="filter-field-label">{facet.label}</span>
            <select
              aria-label={`Filtrar ${definition.title} por ${facet.label}`}
              value={facetValue}
              onChange={(e) => setFacetValue(e.target.value)}
            >
              <option value="">Todos</option>
              {facetValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              {definition.columns.map((key) => (
                <th key={key}>{definition.fields.find((f) => f.key === key)?.label ?? key}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                {definition.columns.map((key) => (
                  <td key={key}>
                    {key === 'estado' ? (
                      <span
                        className={`badge ${row[key] === 'activo' ? 'badge-green' : 'badge-blue'}`}
                      >
                        {row[key]}
                      </span>
                    ) : (
                      label(
                        definition.fields.find((f) => f.key === key),
                        row[key],
                        row,
                      )
                    )}
                  </td>
                ))}
                <td>
                  <div className="table-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditing({ ...row });
                        setError('');
                      }}
                    >
                      <Pencil size={15} /> Editar
                    </button>
                    <button
                      className="text-button danger-text"
                      disabled={pending}
                      onClick={() => remove(row)}
                    >
                      {definition.soft ? 'Dar de baja' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="empty-state">No hay registros que coincidan con la búsqueda.</p>
        )}
      </div>
    </section>
  );
}
