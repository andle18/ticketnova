import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { pathToFileURL } from "node:url";
import { useReceiptPrices } from "./server/receiptPrices.js";
import { languageInstruction, resolveAnalysisLanguage, translateStrings, validTranslationInput } from "./server/language.js";

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Sin ANTHROPIC_API_KEY: análisis de imágenes desactivado.");
}

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "20mb" }));

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados análisis en poco tiempo. Probá de nuevo en unos minutos." },
});

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const SYSTEM_PROMPT = `Eres nutricionista clínico con especialización en prevención cardiovascular y salud metabólica.
Aplicas los criterios NOVA de clasificación alimentaria al ticket de compra que recibes en imagen.

PROCESO EN DOS FASES:

FASE 1 — LECTURA DEL TICKET:
Lee la imagen del ticket y extrae los productos y precios EXACTOS tal como aparecen.
Identifica el supermercado y la moneda.

FASE 2 — RECOMENDACIONES SIN INVENTAR PRECIOS:
Recomienda alternativas y productos para la próxima compra sin atribuirles precios ni tiendas.
Los precios de products y nextWeek.keep solo pueden proceder de líneas legibles del ticket.
Para nextWeek.keep conserva EXACTAMENTE el nombre del producto del ticket y su importe de línea.
Para nextWeek.add devuelve price: null y source: null.
Para topEliminate devuelve alternativePrice: null y alternativeSource: null.
No inventes códigos de barras, fuentes, precios, fechas de verificación ni ahorros.
No afirmes que las recomendaciones mantienen el presupuesto: los precios que faltan son desconocidos.

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin \`\`\`, sin texto antes ni después) con esta estructura:

{
  "language": "es|en|pl|ru|be según las instrucciones del usuario",
  "detectedLanguage": "es|en|pl|ru|be|und según el idioma real del ticket",
  "store": "nombre del supermercado del ticket",
  "location": "ciudad/zona si es legible",
  "date": "fecha del ticket",
  "currency": "símbolo: €, £, $",
  "total": 48.54,
  "products": [
    {
      "name": "nombre del producto",
      "originalName": "nombre exacto impreso en el ticket",
      "price": 1.69,
      "quantity": "1" o "2 x £2.19" o "1.466 kg",
      "nova": "fresco" | "minimo" | "procesado" | "ultra"
    }
  ],
  "summary": {
    "totalSpent": 48.54,
    "freshPct": 17.8,
    "minimoPct": 38.2,
    "procesadoPct": 12.2,
    "ultraPct": 32.5,
    "freshAmount": 8.65,
    "ultraAmount": 15.80,
    "ratio": 0.55
  },
  "topEliminate": [
    {
      "product": "nombre del producto del ticket",
      "price": 4.38,
      "reason": "razón nutricional concreta",
      "alternative": "alternativa concreta",
      "alternativePrice": null,
      "alternativeSource": null
    }
  ],
  "smartBuys": [
    {
      "product": "nombre del producto",
      "price": 4.17,
      "reason": "por qué es buena elección",
      "action": "mantener" | "ampliar"
    }
  ],
  "nextWeek": {
    "keep": [
      { "name": "producto a mantener", "price": 0.89 }
    ],
    "add": [
      {
        "name": "producto a añadir",
        "price": null,
        "source": null
      }
    ],
    "estimatedTotal": null,
    "pricesVerifiedAt": ""
  },
  "notes": "1-2 frases sobre los productos recomendados, sin afirmaciones de precios ni ahorro.",
  "profileGuidance": {
    "buyMore": [
      { "item": "producto o categoría a comprar más", "reason": "por qué ayuda a alcanzar el peso objetivo" }
    ],
    "avoid": [
      { "item": "producto o categoría a evitar", "reason": "por qué dificulta alcanzar el peso objetivo" }
    ],
    "untilNextPurchase": "3-4 frases con una referencia orientativa de qué comer y qué porciones/raciones diarias (proteína, carbohidratos, vegetales, grasas) hasta la próxima compra, coherente con si el usuario necesita bajar, subir o mantener peso"
  }
}

Sobre "profileGuidance": solo completala si en el mensaje del usuario se indican peso actual Y peso ideal.
Si no se indican ambos, devolvé "profileGuidance" con "buyMore": [], "avoid": [] y "untilNextPurchase": "".
Cuando sí los tengas: compará peso actual vs. peso ideal para saber si el objetivo es déficit calórico (bajar),
superávit (subir) o mantenimiento, y que las porciones sugeridas en "untilNextPurchase" sean coherentes con eso.

Reglas NOVA:
- fresco: sin procesar (fruta, verdura, carne fresca, huevos, pescado fresco)
- minimo: mínimamente procesado (lácteos sin azúcar añadido, legumbres secas, arroz integral, agua, frutos secos al natural)
- procesado: procesado tradicional (aceitunas en salmuera, salmón ahumado, queso curado, jamón curado, pan tradicional)
- ultra: ultraprocesado (con aditivos, emulgentes E471/E450, azúcares añadidos, harinas refinadas, "proteico" envasado)

Otras reglas:
- Top 3 a eliminar: prioriza ultraprocesados con mayor impacto en LDL, glucosa o sodio.
- Smart buys: 2 productos del ticket que SÍ están bien elegidos.
- Lista próxima semana: no prometas un presupuesto sin conocer todos los precios.
- NO incluyas markdown, devuelve SOLO el objeto JSON.`;

// A valid base64 payload only contains these characters, and real ticket
// photos are always well over 1KB — this catches empty/garbage uploads
// before they reach the Anthropic API.
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function validateImagePayload(imageBase64, mediaType) {
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return "No image provided";
  }
  if (imageBase64.length < 1000 || !BASE64_RE.test(imageBase64)) {
    return "Invalid image data";
  }
  if (mediaType && !ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return `Unsupported media type: ${mediaType}`;
  }
  return null;
}

// The model's JSON is well-specified in the prompt but not schema-enforced,
// so numbers can arrive as strings (e.g. Spanish "1,69" decimals) or fields
// can be missing outright. Normalize everything the frontend renders with
// .toFixed()/.map() so a slightly-off model response can't crash the UI.
function toNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9,.-]/g, "").replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeAnalysis(data) {
  const summary = data.summary && typeof data.summary === "object" ? data.summary : {};
  const nextWeek = data.nextWeek && typeof data.nextWeek === "object" ? data.nextWeek : {};
  const withNumericPrice = (item) => ({ ...item, price: toNumber(item?.price) });

  return {
    ...data,
    store: typeof data.store === "string" && data.store ? data.store : "",
    currency: typeof data.currency === "string" && data.currency ? data.currency : "€",
    total: toNumber(data.total),
    products: Array.isArray(data.products)
      ? data.products.map((p) => ({
          ...p,
          name: typeof p?.name === "string" && p.name ? p.name : "",
          price: toNumber(p?.price),
          originalName: typeof p?.originalName === "string" ? p.originalName : (typeof p?.name === "string" ? p.name : ""),
          nova: ["fresco", "minimo", "procesado", "ultra"].includes(p?.nova) ? p.nova : "minimo",
        }))
      : [],
    summary: {
      totalSpent: toNumber(summary.totalSpent),
      freshPct: toNumber(summary.freshPct),
      minimoPct: toNumber(summary.minimoPct),
      procesadoPct: toNumber(summary.procesadoPct),
      ultraPct: toNumber(summary.ultraPct),
      freshAmount: toNumber(summary.freshAmount),
      ultraAmount: toNumber(summary.ultraAmount),
      ratio: toNumber(summary.ratio),
    },
    topEliminate: Array.isArray(data.topEliminate)
      ? data.topEliminate.map((item) => ({
          ...withNumericPrice(item),
          alternativePrice: toNumber(item?.alternativePrice),
        }))
      : [],
    smartBuys: Array.isArray(data.smartBuys) ? data.smartBuys.map(withNumericPrice) : [],
    nextWeek: {
      keep: Array.isArray(nextWeek.keep) ? nextWeek.keep.map(withNumericPrice) : [],
      add: Array.isArray(nextWeek.add) ? nextWeek.add.map(withNumericPrice) : [],
      estimatedTotal: toNumber(nextWeek.estimatedTotal),
      pricesVerifiedAt: typeof nextWeek.pricesVerifiedAt === "string" ? nextWeek.pricesVerifiedAt : "",
    },
    notes: typeof data.notes === "string" ? data.notes : "",
    profileGuidance: {
      buyMore: Array.isArray(data.profileGuidance?.buyMore) ? data.profileGuidance.buyMore : [],
      avoid: Array.isArray(data.profileGuidance?.avoid) ? data.profileGuidance.avoid : [],
      untilNextPurchase:
        typeof data.profileGuidance?.untilNextPurchase === "string"
          ? data.profileGuidance.untilNextPurchase
          : "",
    },
  };
}

// Sanity range for a human bodyweight in kg — anything outside this is
// treated as no profile rather than passed on to the model.
function validWeightKg(value) {
  const n = toNumber(value, NaN);
  return Number.isFinite(n) && n >= 30 && n <= 250 ? n : null;
}

app.post("/api/analyze", analyzeLimiter, async (req, res) => {
  if (!anthropic) return res.status(503).json({ error: "El análisis de imágenes no está configurado." });
  try {
    const { imageBase64, mediaType, currentWeightKg, idealWeightKg, language, fallbackLanguage } = req.body;

    const validationError = validateImagePayload(imageBase64, mediaType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const currentWeight = validWeightKg(currentWeightKg);
    const idealWeight = validWeightKg(idealWeightKg);
    const hasProfile = currentWeight !== null && idealWeight !== null;
    const profileInstruction = hasProfile
      ? `El usuario pesa actualmente ${currentWeight} kg y su peso ideal/objetivo es ${idealWeight} kg. ` +
        "Completá \"profileGuidance\" personalizando qué comprar más, qué evitar, y las porciones/raciones " +
        "orientativas hasta la próxima compra, según si necesita bajar, subir o mantener peso."
      : "El usuario no indicó peso actual e ideal: dejá \"profileGuidance\" vacío.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: `${SYSTEM_PROMPT}\n\n${languageInstruction(language, fallbackLanguage)}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text:
                "Analiza este ticket. Recomienda productos sin inventar precios ni fuentes. " +
                `${profileInstruction} ` +
                "Devuelve el JSON nutricional con precios únicamente leídos del ticket.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'max_tokens') {
      return res.status(502).json({ error: 'Analysis response incomplete', code: 'ANALYSIS_INCOMPLETE' });
    }

    // Extract the final text block (the JSON answer)
    const textBlocks = response.content.filter((b) => b.type === "text");
    const finalText = textBlocks[textBlocks.length - 1]?.text?.trim() || "";

    // Extract the JSON object even if the model added preamble text
    // or wrapped it in markdown fences anywhere in the response.
    const fenced = finalText.match(/```json\s*([\s\S]*?)```/i);
    const jsonCandidate = fenced ? fenced[1] : finalText;
    const firstBrace = jsonCandidate.indexOf("{");
    const lastBrace = jsonCandidate.lastIndexOf("}");
    const cleaned =
      firstBrace !== -1 && lastBrace !== -1
        ? jsonCandidate.slice(firstBrace, lastBrace + 1)
        : jsonCandidate;

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed. Raw response:", finalText);
      return res.status(500).json({
        error: "Could not parse model response as JSON",
        raw: finalText,
      });
    }

    const normalized = useReceiptPrices(normalizeAnalysis(parsed));
    Object.assign(normalized, resolveAnalysisLanguage(language, fallbackLanguage, parsed.detectedLanguage));
    normalized._meta = {
      model: "claude-sonnet-4-5",
    };

    res.json(normalized);
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/translate', analyzeLimiter, async (req, res) => {
  if (!anthropic) return res.status(503).json({ code: 'TRANSLATION_UNAVAILABLE' });
  const { strings, language } = req.body ?? {};
  if (!validTranslationInput(strings, language)) return res.status(400).json({ code: 'INVALID_TRANSLATION_INPUT' });
  try {
    res.json({ strings: await translateStrings(anthropic, strings, language), language });
  } catch {
    res.status(502).json({ code: 'TRANSLATION_FAILED' });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`✓ Backend running on http://localhost:${PORT}`);
  });
}
