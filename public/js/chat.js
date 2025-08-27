// ==============================================
// Chat – Script com layout em bolhas e exportações
// ==============================================

// ------- Cache de elementos do DOM -------
const $form     = document.getElementById("chat-form");
const $input    = document.getElementById("user-input");
const $messages = document.getElementById("chat-messages");
const $btnCopy  = document.getElementById("copy-chat");
const $btnPdf   = document.getElementById("export-pdf");
const $btnExcel = document.getElementById("export-excel");

// ------- Estado em memória (usado para exportar) -------
// Cada item: { ts: Date, role: 'Você'|'Agro IA', text: string }
const chatLog = [];

// ------- Helpers de data/hora -------
const now = () => new Date();

/** Retorna data/hora no padrão pt-BR: dd/mm/aaaa hh:mm:ss */
function fmtDate(d) {
  return d.toLocaleString("pt-BR");
}

/** Retorna somente hora no padrão local (para a linha .meta) */
function fmtTime(d) {
  return d.toLocaleTimeString("pt-BR");
}

/** Converte o papel para a classe correta do CSS (.user | .assistant) */
function roleToClass(role) {
  return role === "Você" ? "user" : "assistant";
}

/**
 * Renderiza uma mensagem no padrão do CSS:
 * <div class="msg user|assistant">
 *   <div class="bubble">texto…</div>
 *   <div class="meta">20:55:59</div>
 * </div>
 *
 * - Quando isLoading=true, mostra um indicador de “digitando…”.
 * - A hora fica SEMPRE na linha .meta (abaixo da bolha).
 */
function appendMessage(role, text, isLoading = false) {
  const ts = now();

  // Wrapper da mensagem com alinhamento conforme o papel
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${roleToClass(role)}`;
  wrapper.dataset.role = role;
  wrapper.dataset.ts = ts.toISOString();

  // Se for loading, damos um id fixo para poder remover depois
  if (isLoading) wrapper.id = "loading-msg";

  if (isLoading) {
    // Indicador “digitando…” usando as classes do teu CSS (.typing)
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = `
      <span class="dots">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </span>
      Agro IA está pensando…
    `;
    wrapper.appendChild(typing);
  } else {
    // Bolha com texto seguro (textContent evita XSS)
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    // Linha de metadados com a HORA (se quiser data+hora, use fmtDate(ts))
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = fmtTime(ts);

    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    // Guarda no log para exportações
    chatLog.push({ ts, role, text });
  }

  // Anexa ao container e rola para o fim
  $messages.appendChild(wrapper);
  $messages.scrollTop = $messages.scrollHeight;
}

/** Remove o bloco “digitando…” (id=loading-msg) */
function removeLoading() {
  const el = document.getElementById("loading-msg");
  if (el) el.remove();
}

/** Desabilita/habilita botão e dá feedback visual de busy */
function setBusy(btn, busy) {
  if (!btn) return;
  btn.disabled = busy;
  btn.style.opacity = busy ? "0.6" : "1";
  btn.style.pointerEvents = busy ? "none" : "auto";
}

// ------- Envio de mensagem -------
$form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = $input?.value ?? "";
  if (text.trim() === "") return;

  // 1) renderiza sua mensagem
  appendMessage("Você", text);

  // 2) mostra “digitando…” da IA
  appendMessage("Agro IA", "", true);

  // 3) bloqueia o botão enviar enquanto espera a resposta
  setBusy($form.querySelector("button[type=submit]"), true);

  try {
    // Chama tua API
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json().catch(() => ({}));

    // Remove o “digitando…”
    removeLoading();

    // Resposta normalizada (reply ou message)
    const reply =
      (data && (data.reply ?? data.message)) ||
      "Desculpe, não consegui processar sua mensagem.";

    // 4) renderiza resposta da IA (hora fica na linha .meta)
    appendMessage("Agro IA", reply);
  } catch (err) {
    console.error("Erro na requisição:", err);

    removeLoading();
    appendMessage("Agro IA", "Erro: Não foi possível obter resposta da IA.");
  } finally {
    setBusy($form.querySelector("button[type=submit]"), false);
    if ($input) {
      $input.value = "";
      $input.focus();
    }
  }
});

// ------- Copiar conversa -------
$btnCopy?.addEventListener("click", async () => {
  // Exporta com DATA+HORA para ficar completo no clipboard
  const plain = chatLog
    .map(({ ts, role, text }) => `[${fmtDate(ts)}] ${role}: ${text}`)
    .join("\n");
  try {
    await navigator.clipboard.writeText(plain);
    alert("✅ Conversa copiada para a área de transferência!");
  } catch {
    alert("❌ Não foi possível copiar.");
  }
});

// ------- Exportar PDF -------
// util para injetar script dinamicamente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar " + src));
    document.head.appendChild(s);
  });
}

// retorna o construtor jsPDF se disponível
function getJsPDFCtor() {
  return (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
}

$btnPdf?.addEventListener("click", async () => {
  let JsPDF = getJsPDFCtor();

  // se não estiver disponível, tenta carregar de forma automática (UMD primeiro)
  if (!JsPDF) {
    try {
      await loadScript("https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js");
      JsPDF = getJsPDFCtor();
    } catch (e) {
      console.warn("UMD falhou, tentando global...", e);
    }
  }
  if (!JsPDF) {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.min.js");
      JsPDF = getJsPDFCtor();
    } catch (e) {
      console.error("Global também falhou:", e);
    }
  }

  if (!JsPDF) {
    alert("❌ jsPDF não foi carregado. Verifique sua conexão e a tag <script>.");
    return;
  }

  // --- Geração do PDF ---
  const doc = new JsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("🌾 AgroIA - Histórico da Conversa", 14, 20);

  const content = chatLog
    .map(({ ts, role, text }) => `[${fmtDate(ts)}] ${role}: ${text}`)
    .join("\n");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW  = pageW - margin * 2;
  let y = 35;

  doc.splitTextToSize(content, maxW).forEach((line) => {
    if (y > pageH - 16) { doc.addPage(); y = 16; }
    doc.text(line, margin, y);
    y += 6;
  });

  doc.setFontSize(9);
  doc.text(`Exportado em: ${fmtDate(now())}`, margin, pageH - 8);

  doc.save("AgroIA-conversa.pdf");
});
