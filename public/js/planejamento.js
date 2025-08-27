// ================================
// Planejamento de Plantio – Frontend
// (funciona com rotas do seu server.js)
//  • /api/weather?localizacao=...   -> dados do clima/astro/alertas
//  • /api/sugestoes-culturas (POST) -> lista de culturas sugeridas
// ================================

/* --------------------------------
   🔧 Helpers de DOM
--------------------------------- */
const $  = (sel) => document.querySelector(sel);
const setText = (idOrEl, value) => {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (el) el.textContent = value ?? "—";
};
const setHTML = (idOrEl, html) => {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (el) el.innerHTML = html;
};

/* --------------------------------
   📍 Localização / sanitização
--------------------------------- */
/** Remove emojis, chevrons, múltiplos espaços etc. */
function normalizarLocalizacao(str) {
  if (!str) return "";
  let s = String(str).trim().replace(/\s+/g, " ");
  s = s
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // emojis e símbolos
    .replace(/[<>[\]{}]/g, "")              // caracteres potencialmente problemáticos
    .trim();
  return s;
}

/** Pega a localização exibida; se vazia, tenta localStorage; senão fallback. */
function getLocalizacaoDaUI() {
  const ui = normalizarLocalizacao($("#localizacao-produtor")?.textContent || "");
  if (ui && ui.length >= 2) return ui;

  try {
    const raw = localStorage.getItem("dadosProdutor");
    if (raw) {
      const dados = JSON.parse(raw);
      const ls = normalizarLocalizacao(dados?.localizacao);
      if (ls && ls.length >= 2) return ls;
    }
  } catch (_) {}

  return "Asunción, PY"; // fallback seguro
}

/** Garante que o src do ícone seja uma URL válida (corrige //cdn...) */
function resolveIconUrl(icon) {
  if (!icon) return "";
  const s = String(icon).trim();
  if (s.startsWith("https://") || s.startsWith("http://")) return s;
  if (s.startsWith("//")) return "https:" + s;
  if (s.startsWith("/")) return "https://cdn.weatherapi.com" + s;
  return "https://cdn.weatherapi.com/" + s.replace(/^\//, "");
}

/* --------------------------------
   🌱 Sugestões de culturas (via IA)
--------------------------------- */
/** Fallback simples (usado apenas se a IA falhar) */
function sugerirCulturasFallback(tipoSolo) {
  const mapa = new Map([
    ["argiloso", ["Arroz", "Feijão", "Milho"]],
    ["arenoso", ["Cenoura", "Melancia", "Batata-doce"]],
    ["silte",    ["Alface", "Beterraba", "Couve"]],
    ["franco",   ["Soja", "Milho", "Trigo"]],
    ["calcario", ["Uva", "Azeitona", "Alfarroba"]],
    ["organico", ["Tomate", "Pimentão", "Abóbora"]],
  ]);
  return mapa.get(String(tipoSolo || "").toLowerCase()) || ["Culturas variadas"];
}

/** POST /api/sugestoes-culturas com os dados do produtor e preenche o UL */
async function obterSugestoesIA(dadosProdutor) {
  const lista = document.getElementById("lista-culturas");
  setHTML(lista, "<li>Consultando a IA...</li>");

  try {
    const resp = await fetch("/api/sugestoes-culturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosProdutor),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const sugestoes = await resp.json();

    if (Array.isArray(sugestoes) && sugestoes.length) {
      setHTML(lista, "");
      sugestoes.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = c;
        lista.appendChild(li);
      });
    } else {
      setHTML(lista, "<li>Nenhuma sugestão encontrada pela IA.</li>");
    }
  } catch (e) {
    console.warn("IA indisponível; usando fallback local:", e);
    setHTML(lista, "");
    sugerirCulturasFallback(dadosProdutor?.tipoSolo || dadosProdutor?.["tipo-solo"]).forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      lista.appendChild(li);
    });
  }
}

/* --------------------------------
   🌤️ Previsão do tempo (via server)
--------------------------------- */
/** pt-BR curto: qui., 28/08 */
function fmtDataCurta(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Cache leve em memória para evitar chamadas repetidas em poucos segundos */
const wxCache = { q: null, at: 0, data: null };
const WX_TTL_MS = 45_000;

/** Atualiza toda a seção do card de clima (Agora/Hoje/Astro/Alertas/Dias) */
async function atualizarPrevisaoReal(force = false) {
  const localizacao = getLocalizacaoDaUI();

  // Refs de UI
  const cidadeEl = $("#wx-cidade");
  const nowIcon  = $("#wx-now-icon");
  const diasEl   = $("#dias-lista");
  const alertBox = $("#alertas");
  const alertList= $("#alertas-lista");

  // Campos principais
  const tempEl   = $("#temp");
  const condEl   = $("#condicao");
  const umidEl   = $("#umidade");
  const ventoEl  = $("#vento");
  const uvEl     = $("#uv");
  const maxEl    = $("#dia-max");
  const chuvaEl  = $("#dia-chuva");
  const minEl    = $("#noite-min");
  const nasEl    = $("#nascer-sol");
  const porEl    = $("#por-sol");
  const luaEl    = $("#fase-lua");

  // Estado "carregando"
  setText(condEl, "Carregando...");
  [tempEl, umidEl, ventoEl, uvEl, maxEl, chuvaEl, minEl, nasEl, porEl, luaEl].forEach((el) => setText(el, "—"));
  setHTML(diasEl, "");
  setHTML(alertList, "");
  alertBox.style.display = "none";
  cidadeEl.textContent = localizacao;
  if (nowIcon) nowIcon.style.display = "none";

  // Cache simples
  const now = Date.now();
  if (!force && wxCache.q === localizacao && (now - wxCache.at) < WX_TTL_MS) {
    renderWeather(wxCache.data);
    return;
  }

  try {
    const resp = await fetch(`/api/weather?localizacao=${encodeURIComponent(localizacao)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const wx = await resp.json();

    // Guarda cache
    wxCache.q = localizacao;
    wxCache.at = now;
    wxCache.data = wx;

    renderWeather(wx);
  } catch (err) {
    console.error("Erro ao obter previsão:", err);
    setText(condEl, "Falha ao obter previsão");
  }

  // --- função interna para pintar a UI (usa o payload do servidor)
  function renderWeather(wx) {
    // Ícone do "agora"
    if (wx.agora?.condicao_icone) {
      nowIcon.src = resolveIconUrl(wx.agora.condicao_icone);
      nowIcon.alt = wx.agora?.condicao_texto || "Condição";
      nowIcon.style.display = "block";
    }

    // Agora
    setText(tempEl,  wx.agora?.temp_c ?? "—");
    setText(condEl,  wx.agora?.condicao_texto ?? "—");
    setText(umidEl,  wx.agora?.umidade ?? "—");
    setText(uvEl,    wx.agora?.uv ?? wx.hoje?.uv ?? "—");
    if (wx.agora?.vento_kph != null) {
      const dir = wx.agora?.vento_dir ? `${wx.agora.vento_dir} ` : "";
      setText(ventoEl, `${dir}${wx.agora.vento_kph} km/h`);
    } else {
      setText(ventoEl, "—");
    }

    // Hoje
    setText(maxEl,   wx.hoje?.max_c ?? "—");
    setText(chuvaEl, wx.hoje?.chance_chuva ?? "—");
    setText(minEl,   wx.hoje?.min_c ?? "—");

    // Astro
    setText(nasEl, wx.astro?.nascer_sol ?? "—");
    setText(porEl, wx.astro?.por_sol ?? "—");
    setText(luaEl, wx.astro?.fase_lua ?? "—");

    // Alertas
    if (Array.isArray(wx.alertas) && wx.alertas.length) {
      alertBox.style.display = "block";
      setHTML(alertList, "");
      wx.alertas.forEach((a) => {
        const div = document.createElement("div");
        div.className = "alert";
        div.textContent = `Alerta: ${a.titulo || "Informação"}${a.descricao ? " — " + a.descricao : ""}`;
        alertList.appendChild(div);
      });
    }

    // Próximos dias (máx. 4; pula hoje se tiver 5+)
    const todos = Array.isArray(wx.dias) ? wx.dias : [];
    const diasParaExibir = todos.length >= 5 ? todos.slice(1, 5) : todos.slice(0, 4);

    setHTML(diasEl, "");
    diasParaExibir.forEach((d) => {
      const icon = resolveIconUrl(d.icone);
      const card = document.createElement("div");
      card.className = "wx-day";
      card.innerHTML = `
        <div class="date">${fmtDataCurta(d.data)}</div>
        ${
          icon
            ? `<img class="icon" src="${icon}" alt="${d.condicao || ""}" loading="lazy" width="28" height="28">`
            : `<span class="icon" aria-hidden="true">⛅</span>`
        }
        <div class="temps"><strong>${d.max_c ?? "—"}°</strong> / ${d.min_c ?? "—"}°</div>
        <div class="rain">Chuva: ${d.chance_chuva ?? "—"}%</div>
        <div class="cond">${d.condicao || ""}</div>
      `;
      diasEl.appendChild(card);
    });
  }
}

/* --------------------------------
   🧭 Preenche “Informações do Produtor”
--------------------------------- */
function preencherBlocoProdutor(d) {
  setText("nome-produtor",        d?.nome || "—");
  setText("localizacao-produtor", d?.localizacao || "—");
  setText("solo-produtor",        d?.["tipo-solo"] || d?.tipoSolo || "—");
  setText("culturas-produtor",    d?.culturas || "—");
  setText("periodo-produtor",     d?.["periodo-plantio"] || d?.periodoPlantio || "—");
}

/* --------------------------------
   🚀 Boot
--------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // 1) Exigir cadastro prévio
  const raw = localStorage.getItem("dadosProdutor");
  if (!raw) {
    alert("Nenhum dado de produtor encontrado. Faça o cadastro primeiro.");
    window.location.href = "/cadastro";
    return;
  }

  let dados;
  try { dados = JSON.parse(raw); }
  catch (e) {
    console.error("dadosProdutor inválido:", e);
    alert("Erro ao carregar dados. Refaça o cadastro.");
    window.location.href = "/cadastro";
    return;
  }

  // 2) Preencher UI do produtor
  preencherBlocoProdutor(dados);

  // 3) Sugestões de culturas (IA do backend)
  obterSugestoesIA({
    nome: dados.nome,
    localizacao: dados.localizacao,
    tipoSolo: dados["tipo-solo"] ?? dados.tipoSolo,
    culturaInteresse: dados.culturas,
    periodoPlantio: dados["periodo-plantio"] ?? dados.periodoPlantio,
  });

  // 4) Clima (via backend)
  atualizarPrevisaoReal();

  // 5) Botão “Atualizar”
  const btn = document.getElementById("btn-refresh");
  if (btn) btn.addEventListener("click", () => atualizarPrevisaoReal(true));

  // 6) Se a localização na UI mudar (ex.: usuário edita), recarrega
  const spanLoc = document.getElementById("localizacao-produtor");
  if (spanLoc) {
    const obs = new MutationObserver(() => atualizarPrevisaoReal(true));
    obs.observe(spanLoc, { childList: true, characterData: true, subtree: true });
  }
});
