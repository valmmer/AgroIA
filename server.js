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
// 🛡️ Middlewares
// ================================
app.use(helmet());
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
// 🤖 Chat IA: Assistente geral
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
// 🌱 Sugestões de culturas com base no solo
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

  // 🧠 Prompt gerado dinamicamente
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

    // 🧹 Processa a resposta para extrair apenas os itens
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
// 🚀 Inicia o servidor
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ AgroIA rodando em http://localhost:${PORT}`)
);
