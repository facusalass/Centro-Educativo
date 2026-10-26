# Resolución de TC003, TC007 y TC014

Complemento del reporte generado por TestSprite (`testsprite-mcp-test-report.md`), que
quedó en 12/15. Este documento explica qué era cada caso fallido, qué se cambió y
dónde vive ahora la verificación automatizada.

## Diagnóstico: no eran tres bugs equivalentes

| Caso | Naturaleza | Estado tras esta sesión |
|---|---|---|
| TC007 | Defecto de producto: faltaba el filtro por categoría en el catálogo | Resuelto en la app |
| TC003 | Artefacto del arnés + fragilidad real del export CSV | Export endurecido y cubierto |
| TC014 | Artefacto del arnés + hueco de producto: no existía vista previa | Vista previa implementada y cubierta |

Dos precisiones sobre los artefactos:

- Los tres `.py` de `testsprite_tests/` son **salidas generadas** por TestSprite. TC003 y
  TC014 terminan con un `raise AssertionError("Test blocked during agent run: ...")`
  inyectado por el generador: no pueden pasar por construcción, en ningún entorno.
- Python Playwright no está instalado en el proyecto, así que esos archivos tampoco son
  ejecutables localmente. Se dejan intactos como registro de la corrida (decisión tomada
  en esta sesión); la cobertura durable vive en la suite Playwright del repo.

## TC007 — filtro del catálogo administrativo

`EntityManager.tsx` solo ofrecía búsqueda de texto sobre `Object.values(row)`. Se agregó un
`<select>` de faceta que se **deriva de la definición de la entidad**: entre los campos
categóricos que la tabla ya expone (`rol`, `nivel`, `estado`, `tipo`), se usa el que más
valores distintos tiene en los datos cargados. Las opciones se pueblan con los valores
**reales** de las filas, no con `field.options`, para no ofrecer categorías vacías.

Resultado por catálogo con los datos de demo:

- Alumnos y Docentes → `Estado`
- Usuarios y permisos → `Rol`
- Grupos deportivos y Noticias → `Nivel`
- Catálogos sin campo categórico (Transporte, Aranceles) → sin filtro

La faceta se combina por AND con la búsqueda de texto, y el contador pasa a mostrar
`N de M registros` cuando hay algo filtrado. El `aria-label` es
`Filtrar <título> por <campo>`, estable para tests.

## TC003 — export CSV

El export usaba `URL.revokeObjectURL` de forma sincrónica inmediatamente después de
`anchor.click()`, y el anchor nunca se insertaba en el documento. Se corrigió:

- el anchor se agrega al `body`, se clickea y se remueve;
- el `revokeObjectURL` se difiere 1000 ms, para no cancelar la transferencia antes de que
  el navegador lea el blob.

El formato no cambió: BOM UTF-8, delimitador `;`, comillas escapadas y prefijo `'` en
celdas que empiezan con `=`, `+`, `@` o `-` (protección de inyección de fórmulas).

## TC014 — imprimir / vista previa

Antes, los botones «Imprimir / PDF» y «Guardar / Descargar PDF» hacían lo mismo:
`window.print()`. En Chromium headless esa llamada no abre ningún diálogo, y la app no
tenía vista previa, así que el assert de TestSprite era imposible de satisfacer.

Ahora ambos botones abren una **vista previa in-app**: un overlay que envuelve el mismo
nodo `#printable-report` (sin clonar DOM y sin ids duplicados, así el `@media print` de
`global.css` sigue funcionando sin cambios). El overlay muestra «Vista previa», el título
del reporte y los botones «Imprimir» y «Cerrar». `window.print()` se invoca **solo** al
confirmar, y eso es lo que el test intercepta.

## Cobertura durable

`tests/browser/reportes-export.spec.ts` (nuevo) cubre los tres casos y corre con la suite
del repo:

```bash
npm run build && npm run test:e2e
```

- descarga real vía `page.waitForEvent('download')`, verificando nombre de archivo, BOM,
  delimitador y encabezados del CSV;
- filtro por faceta: conteo exacto, contenido de cada fila, combinación con la búsqueda de
  texto y vuelta a «Todos»;
- vista previa: se abre sin invocar `window.print`, se invoca exactamente una vez al
  confirmar (stub por `addInitScript`) y se cierra.

## Prerrequisito de entorno detectado en el camino

El baseline de la suite E2E estaba **rojo con el árbol limpio** (5 de 6 tests fallando) por
una causa ajena a los tres casos: el shell SPA se servía con
`res.sendFile(rutaAbsoluta)`, y `send` rechaza con 404 cualquier ruta absoluta que contenga
un segmento oculto. Como este worktree vive bajo `.gemini/antigravity/…`, todos los deep
links (`/login`, `/admin`) devolvían `{"error":"Not Found"}` y la suite no podía ni loguearse.

Se cambió a la forma canónica `res.sendFile('index.html', { root: staticDir })`, que resuelve
la ruta relativa al root y no dispara la protección de dotfiles. Además de desbloquear el
E2E, corrige el caso real de una instalación servida desde una ruta con segmento oculto.
