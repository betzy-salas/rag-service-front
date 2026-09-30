# rag-service-front

Cliente web del servicio `assistant` (`../rag-service-assistant`). Permite hacer preguntas sobre la
documentación indexada de Confluence y muestra la respuesta con las páginas de origen.

Interfaz de conversación en tema oscuro: barra lateral con las conversaciones recientes y el estado
del servicio, mensajes con las fuentes citadas y un cuadro de consulta con sugerencias.

## Tecnologías

| | |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Tests | Vitest, Testing Library, MSW (servicio simulado) |
| Lint | oxlint |

## Requisitos

- Node.js 20 o superior.
- El servicio `assistant` arrancado en `http://localhost:8081` con CORS permitiendo el origen del
  front (por defecto `http://localhost:5173`, configurable con `app.cors.allowed-origins`).

## Arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Configuración

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8081` (en `.env.development`) | URL base del servicio. Vacía si el front se sirve desde el mismo origen que la API. |

Las variables se leen en tiempo de build. Para producción, crea `.env.production` con la URL real.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm run preview` | Sirve `dist/` en local |
| `npm test` | Ejecuta los tests una vez |
| `npm run test:watch` | Tests en modo observador |
| `npm run lint` | Lint del código |

## Estructura

```
src/
├── api/             Contrato del servicio (types), cliente HTTP con errores tipados, llamada a /questions y salud
├── components/      Iconos SVG en línea
├── features/chat/   Barra lateral, mensajes, cuadro de consulta, panel y hook de conversaciones
├── features/status/ Sondeo de /actuator/health para el indicador de estado
├── styles/          Tokens de color del tema oscuro y estilos globales
└── test/            Configuración de Vitest y servidor MSW
```

## Comportamiento

- Cada pregunta se envía a `POST /questions`. La interfaz no envía `spaceKey`, aunque la capa API lo admite.
- Intro envía; Mayús + Intro añade una línea. Límite de 2000 caracteres.
- Las conversaciones se guardan en `localStorage` y aparecen en la barra lateral. "Nueva conversación"
  empieza otra; la anterior queda en la lista de recientes. El servicio no tiene memoria: cada pregunta
  se responde por separado, la agrupación es solo visual.
- Mientras el servicio responde, el envío queda deshabilitado y el turno muestra un estado de espera.
- Cada respuesta muestra los pasos del pipeline, el tiempo de respuesta y las fuentes como tarjetas con
  el espacio de Confluence extraído de la URL.
- Los errores del servicio (`application/problem+json`) se muestran con su `detail` y un botón de
  reintento. Si el servicio no responde, se indica que puede no estar arrancado.
- El pie de la barra lateral consulta `/actuator/health` cada 30 s y muestra si el servicio responde.
- En pantallas estrechas la barra lateral se convierte en un panel desplegable.
