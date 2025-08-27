// ================================
// 🌐 Módulos essenciais
// ================================
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config(); // Variáveis de ambiente (.env)

// ================================
// 🚀 Inicializa o servidor Express
// ================================
const app = express();

// ================================
// 🛡️ Middlewares básicos
// ================================
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // só o que precisas de fato:
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        // ✅ libera os ícones da WeatherAPI e imagens inline (data:)
        "img-src": ["'self'", "data:", "https://cdn.weatherapi.com"],
        // o front NÃO chama a WeatherAPI direta (usa /api/weather), então basta 'self'
        "connect-src": ["'self'"],
      },
    },
    // estes dois ajudam a evitar bloqueios colaterais com fontes/imagens
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================================
// 🌐 Rotas de páginas (frontend)
// ================================
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/cadastro", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "cadastro.html"))
);
app.get("/planejamento", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "planejamento.html"))
);
app.get("/chat", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "chat.html"))
);

// ================================
// 🤖 Chat IA: Assistente geral (OpenRouter)
// ================================
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ reply: "Mensagem inválida." });
  }

  const systemMessage = "Você é um assistente agrícola educado e claro.";

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sem resposta da IA.";

    console.log("[Chat IA]", reply);
    res.json({ reply });
  } catch (err) {
    console.error("Erro no Chat IA:", err.message);
    res.status(500).json({ reply: "Erro interno ao acessar a IA." });
  }
});

// ================================
// 🌱 Sugestões de culturas com base no solo (via IA)
// ================================
app.post("/api/sugestoes-culturas", async (req, res) => {
  const { nome, localizacao, tipoSolo, culturaInteresse, periodoPlantio } =
    req.body;

  if (!tipoSolo || !localizacao || !periodoPlantio) {
    return res.status(400).json({
      error:
        "Dados obrigatórios ausentes: tipoSolo, localizacao ou periodoPlantio.",
    });
  }

  // 🧠 Prompt gerado dinamicamente para a IA
  const prompt = `
Você é um engenheiro agrônomo consultor. Com base nos dados abaixo, indique culturas apropriadas ao solo e ao período informado:

• Nome do produtor: ${nome || "não informado"}
• Localização: ${localizacao}
• Tipo de solo: ${tipoSolo}
• Cultura principal de interesse: ${culturaInteresse || "não informado"}
• Período de plantio: ${periodoPlantio}

Com base em conhecimento técnico (tipo de solo, época, clima provável), sugira 3 a 5 culturas alternativas viáveis para esse cenário. Retorne a lista de forma simples e direta, sem explicações.
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Você é um engenheiro agrônomo especialista em planejamento agrícola no Brasil e Paraguai. Use linguagem técnica e direta.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();

    const textoIA = data.choices?.[0]?.message?.content || "";

    // 🧹 Extrai apenas os itens (1., 2., 3. -> texto limpo)
    const sugestoes = textoIA
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l) => l.length > 0);

    if (sugestoes.length === 0) {
      throw new Error("A resposta da IA não retornou sugestões válidas.");
    }

    res.json(sugestoes);
  } catch (err) {
    console.error("[Erro IA - sugestões culturas]:", err.message);
    res
      .status(500)
      .json([
        "Erro ao gerar sugestões com IA. Verifique sua conexão ou tente mais tarde.",
      ]);
  }
});

// ================================
// 🌦️ Previsão do tempo (WeatherAPI.com)
// - desambiguação por cidade+UF usando /v1/search.json
// - cache simples em memória
// - normalização de ícones (fixIcon) para evitar quebras de URL
// ================================
if (!process.env.WEATHERAPI_KEY) {
  console.warn("[WARN] WEATHERAPI_KEY não encontrada no .env.");
}

// Cache em memória para reduzir chamadas repetidas
const WEATHER_CACHE = new Map();
const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 min

// ---- util: remover acentos e normalizar comparação ----
function semAcentos(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ---- mapa UF -> nome do estado (para comparar com 'region' da API) ----
const UF_TO_ESTADO = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

// ---- extrai "cidade" e "UF" de "Itajubá, MG" ----
function extrairCidadeUf(localizacao) {
  const s = String(localizacao).trim();
  const m = s.match(/^(.+?),\s*([A-Za-z]{2})$/); // Cidade, UF
  if (m) return { cidade: m[1].trim(), uf: m[2].toUpperCase() };
  return { cidade: s, uf: null };
}

// ---- fallback textual caso não resolvamos por lat/lon ----
function montarQueryClima(localizacao) {
  const s = String(localizacao).trim();
  // já tem país? (BR, PY, AR, UY) -> mantém
  if (/,?\s*(BR|Brazil|PY|Paraguay|AR|Argentina|UY|Uruguay)$/i.test(s))
    return s;
  // "Cidade, UF" -> adiciona ", BR"
  const m = s.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (m) return `${m[1].trim()}, ${m[2].trim().toUpperCase()}, BR`;
  // só cidade -> adiciona ", BR"
  return `${s}, BR`;
}

/** 🔧 Ícones da WeatherAPI às vezes vêm como "//cdn..." ou "/images/...".
 *  Essa função devolve SEMPRE uma URL absoluta "https://...".
 */
function fixIcon(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("https://") || s.startsWith("http://")) return s;
  if (s.startsWith("//")) return "https:" + s;
  if (s.startsWith("/")) return "https://cdn.weatherapi.com" + s;
  return "https://cdn.weatherapi.com/" + s.replace(/^\//, "");
}

/**
 * 🔎 Usa /v1/search.json para desambiguar cidade por UF e retornar lat/lon.
 * Retorna { lat, lon } quando encontra um match confiável; senão null.
 */
async function resolverLocalizacaoPorSearch(localizacao, key) {
  const { cidade, uf } = extrairCidadeUf(localizacao);
  const cidadeQ = cidade || localizacao;
  const url = new URL("https://api.weatherapi.com/v1/search.json");
  url.searchParams.set("key", key);
  // restringe a busca ao Brasil para evitar homônimos em outros países
  url.searchParams.set("q", `${cidadeQ}, BR`);

  const resp = await fetch(url.toString());
  if (!resp.ok) return null;

  const arr = await resp.json(); // [{ name, region, country, lat, lon, ... }]
  if (!Array.isArray(arr) || arr.length === 0) return null;

  // filtra Brasil e, se houver UF, tenta casar com o nome completo do estado
  const arrBrasil = arr.filter((x) => semAcentos(x.country).includes("brazil"));
  if (arrBrasil.length === 0) return null;

  // se tiver UF, preferimos candidatos cuja 'region' bata com o estado
  if (uf && UF_TO_ESTADO[uf]) {
    const alvoEstado = semAcentos(UF_TO_ESTADO[uf]);
    // 1) cidade exata + estado bate
    let cand = arrBrasil.find(
      (x) =>
        semAcentos(x.name) === semAcentos(cidade) &&
        semAcentos(x.region).includes(alvoEstado)
    );
    if (cand) return { lat: cand.lat, lon: cand.lon };

    // 2) estado bate (aceita variações da cidade)
    cand = arrBrasil.find((x) => semAcentos(x.region).includes(alvoEstado));
    if (cand) return { lat: cand.lat, lon: cand.lon };
  }

  // se não tem UF e há apenas 1 resultado BR, usamos ele
  if (arrBrasil.length === 1) {
    return { lat: arrBrasil[0].lat, lon: arrBrasil[0].lon };
  }

  // por fim, tentamos match exato da cidade no BR
  const candCidade = arrBrasil.find(
    (x) => semAcentos(x.name) === semAcentos(cidade)
  );
  if (candCidade) return { lat: candCidade.lat, lon: candCidade.lon };

  return null; // deixa o fallback textual decidir
}

// ---- Rota principal de clima ----
app.get("/api/weather", async (req, res) => {
  try {
    const key = process.env.WEATHERAPI_KEY;
    if (!key) {
      return res.status(500).json({ error: "WEATHERAPI_KEY ausente no .env" });
    }

    // sanitiza entrada do cliente
    const localizacaoRaw = (req.query.localizacao || "").trim();
    if (!localizacaoRaw) {
      return res
        .status(400)
        .json({ error: "Parâmetro 'localizacao' é obrigatório" });
    }
    const localizacao = localizacaoRaw
      .replace(/\s+/g, " ")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // remove emojis
      .trim();

    // cache por localização informada
    const cacheKey = `wx:${localizacao.toLowerCase()}`;
    const now = Date.now();
    const cached = WEATHER_CACHE.get(cacheKey);
    if (cached && now - cached.timestamp < WEATHER_TTL_MS) {
      return res.json(cached.data);
    }

    // 1) tenta resolver lat/lon via /search.json usando a UF
    let qForecast;
    try {
      const coords = await resolverLocalizacaoPorSearch(localizacao, key);
      if (coords) qForecast = `${coords.lat},${coords.lon}`; // coordenadas -> previsão precisa
    } catch (_) {
      // ignora e usa fallback textual
    }

    // 2) fallback textual se não achamos lat/lon
    if (!qForecast) {
      qForecast = montarQueryClima(localizacao);
    }

    // monta a requisição da previsão
    const url = new URL("https://api.weatherapi.com/v1/forecast.json");
    url.searchParams.set("key", key);
    url.searchParams.set("q", qForecast);
    url.searchParams.set("days", "10"); // (free costuma retornar até 3)
    url.searchParams.set("aqi", "no");
    url.searchParams.set("alerts", "yes");
    url.searchParams.set("lang", "pt");

    const r = await fetch(url.toString());
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res
        .status(r.status)
        .json({ error: `WeatherAPI falhou: ${txt || r.statusText}` });
    }
    const j = await r.json();

    // normaliza o payload para o front
    const current = j.current || {};
    const fd = j.forecast?.forecastday || [];
    const today = fd[0] || {};
    const day = today.day || {};
    const astro = today.astro || {};
    const alertasApi = j.alerts?.alert ?? [];

    const data = {
      local: {
        nome: j.location?.name,
        regiao: j.location?.region,
        pais: j.location?.country,
        lat: j.location?.lat,
        lon: j.location?.lon,
        tz: j.location?.tz_id,
      },
      agora: {
        temp_c: current.temp_c,
        condicao_texto: current.condition?.text,
        condicao_icone: fixIcon(current.condition?.icon), // ✅ URL absoluta
        vento_kph: current.wind_kph,
        vento_dir: current.wind_dir,
        vento_graus: current.wind_degree,
        umidade: current.humidity,
        uv: current.uv,
        chuva_mm: current.precip_mm,
        sensacao_c: current.feelslike_c,
      },
      hoje: {
        max_c: day.maxtemp_c,
        min_c: day.mintemp_c,
        chance_chuva: day.daily_chance_of_rain,
        total_chuva_mm: day.totalprecip_mm,
        uv: day.uv,
      },
      astro: {
        nascer_sol: astro.sunrise,
        por_sol: astro.sunset,
        nascer_lua: astro.moonrise,
        por_lua: astro.moonset,
        fase_lua: astro.moon_phase,
      },
      horarios: (today.hour || []).map((h) => ({
        time: h.time,
        temp_c: h.temp_c,
        chance_chuva: h.chance_of_rain,
        condicao: h.condition?.text,
        // se um dia você quiser ícone por hora, passe por fixIcon(h.condition?.icon)
      })),
      // lista de dias (o front exibe 4; aqui mandamos todos)
      dias: fd.map((x) => ({
        data: x.date,
        max_c: x.day?.maxtemp_c,
        min_c: x.day?.mintemp_c,
        chance_chuva: x.day?.daily_chance_of_rain,
        condicao: x.day?.condition?.text,
        icone: fixIcon(x.day?.condition?.icon), // ✅ URL absoluta
      })),
      alertas: alertasApi.map((a) => ({
        titulo: a.headline || a.event || "Alerta",
        severidade: a.severity || a.severity_level,
        inicio: a.effective,
        fim: a.expires,
        descricao: a.desc || a.note || a.instruction || a.description,
        areas: a.areas,
      })),
    };

    // salva em cache e responde
    WEATHER_CACHE.set(cacheKey, { timestamp: now, data });
    res.json(data);
  } catch (e) {
    console.error("[/api/weather] erro:", e);
    res.status(500).json({ error: "Erro interno ao consultar WeatherAPI" });
  }
});

// ================================
// 🚀 Inicia o servidor
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ AgroIA rodando em http://localhost:${PORT}`)
);
