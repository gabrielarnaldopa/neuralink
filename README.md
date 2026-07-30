# NEURA — Demo funcional para inversores

Página de presentación con demo de IA en vivo: visualización de red neuronal, chat funcional, secciones de tecnología, arquitectura y roadmap.

## Estructura

```
neura-demo/
├── server.js          # Backend Express: sirve el frontend y hace de proxy seguro a la IA
├── public/
│   └── index.html     # Frontend completo (landing + demo en vivo)
├── package.json
├── .env.example
└── README.md
```

La clave de API vive **solo en el servidor** como variable de entorno. El navegador nunca la ve.

## Requisitos

1. Una clave de API de Anthropic. Se obtiene en https://console.anthropic.com (el uso de la API se factura por consumo, aparte de cualquier suscripción de Claude).
2. Cuenta en Railway (https://railway.app).

## Desplegar en Railway

1. Sube esta carpeta a un repositorio de GitHub (o usa `railway up` con la CLI).
2. En Railway: **New Project → Deploy from GitHub repo** y selecciona el repositorio.
3. En la pestaña **Variables** del servicio, añade:
   - `ANTHROPIC_API_KEY` = tu clave de API
   - (opcional) `NEURA_MODEL` = modelo a usar (por defecto `claude-sonnet-4-6`)
4. Railway detecta Node automáticamente y ejecuta `npm start`. En **Settings → Networking**, genera el dominio público.
5. Abre la URL. La demo debe responder en el chat.

## Probar en local

```bash
npm install
ANTHROPIC_API_KEY=tu_clave npm start
# abre http://localhost:3000
```

## Notas para la demo con inversores

- **Límite de uso incluido**: máx. 25 consultas por IP cada 5 minutos, para que nadie dispare el coste de API si comparten el enlace.
- **Endpoint de salud**: `GET /api/health` devuelve estado y uptime (útil si preguntan por monitorización).
- **Coste**: cada mensaje consume tokens de la API. Con uso de demo (decenas de consultas) el coste es de céntimos, pero revisa la consola de Anthropic si el enlace circula mucho.
- El roadmap de la página refleja el estado real del proyecto (Fase 1 completada, Fase 2 en curso). Mantenerlo veraz es lo que aguanta las preguntas de un inversor.

## Documentación de la API

https://docs.claude.com/en/api/overview
