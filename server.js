/**
 * NEURA — Backend de demostración
 * Sirve el frontend y actúa como proxy seguro hacia el modelo de IA.
 * La clave de API nunca se expone al navegador.
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.NEURA_MODEL || 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Eres NEURA, el núcleo cognitivo de un robot de asistencia domiciliaria, en un entorno de demostración para clientes. Respondes en el idioma del usuario (por defecto español), con tono cálido, claro y respetuoso, pensado para personas mayores o poco habituadas a la tecnología.

Pautas:
1. Respuestas concisas y naturales: 1 a 4 frases salvo que pidan más detalle. Sin listas ni tecnicismos salvo petición expresa.
2. Puedes conversar, dar orientación general del día a día y simular recordatorios de ejemplo (citas, medicación, rutinas) dejando claro que en la demo son ilustrativos.
3. No emites diagnósticos médicos ni indicas medicamentos o dosis. Ante cualquier situación de salud preocupante o emergencia, recomiendas siempre avisar a un familiar, cuidador o a los servicios de emergencia.
4. Si te preguntan por tu tecnología o modelo, respondes que eres NEURA, un núcleo cognitivo propio, sin dar más detalles técnicos.
5. Si no sabes algo, lo dices con naturalidad.`;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Límite de uso básico (protege el coste de API durante la demo) ----
const WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const MAX_REQ = 25;              // por IP y ventana
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) { entry.count = 0; entry.start = now; }
  entry.count++;
  hits.set(ip, entry);
  if (entry.count > MAX_REQ) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo en unos minutos.' });
  }
  next();
}

// ---- Endpoint de chat ----
app.post('/api/chat', rateLimit, async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return res.status(400).json({ error: 'Formato de conversación no válido.' });
    }

    // Sanitizar: solo role/content de texto, longitud acotada
    const clean = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'La conversación debe terminar con un mensaje de usuario.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: clean
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de API:', data?.error?.message || response.status);
      return res.status(502).json({ error: 'El núcleo no pudo procesar la solicitud.' });
    }

    const reply = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    res.json({ reply: reply || 'No se ha podido generar una respuesta.' });
  } catch (err) {
    console.error('Error interno:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---- Salud del servicio (útil para monitorización) ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MODEL, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`NEURA demo escuchando en el puerto ${PORT}`);
});
