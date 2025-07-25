// 🌐 Importação de módulos essenciais
const express = require("express"); // Framework para criar o servidor e definir rotas
const path = require("path"); // Lida com caminhos de arquivos e diretórios
const fetch = require("node-fetch"); // Realiza chamadas HTTP (usado para conectar com a IA)
const franc = require("franc"); // Detecta o idioma do texto de forma automática
const cors = require("cors"); // Permite que o servidor aceite requisições de outras origens
const helmet = require("helmet"); // Reforça a segurança do servidor via cabeçalhos HTTP
require("dotenv").config(); // Carrega as variáveis de ambiente definidas em .env

// 🧠 Importação de funções auxiliares externas (organização modular)
const { detectGuarani, getSystemMessage } = require("./utils/language"); // Arquivo customizado com funções específicas

// 🚀 Instancia o servidor Express
const app = express();

// 🔐 Middlewares de segurança e configuração
app.use(helmet()); // Protege contra vulnerabilidades conhecidas da web
app.use(cors()); // Permite o acesso a partir de outras origens (útil para apps móveis, etc.)
app.use(express.urlencoded({ extended: true })); // Permite receber dados de formulários
app.use(express.json()); // Permite receber dados em formato JSON

// 🖼️ Define a pasta onde ficam arquivos públicos como HTML, CSS e JS do frontend
app.use(express.static(path.join(__dirname, "public")));

// 📄 Rotas para páginas HTML (usando views separadas para modularidade)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cadastro.html"));
});

app.get("/planejamento", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "planejamento.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "chat.html"));
});

// 🤖 Rota POST que recebe a mensagem do usuário e processa com IA
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // 🔍 Valida a entrada do usuário
  if (!userMessage || typeof userMessage !== "string") {
    return res
      .status(400)
      .json({ reply: "Mensagem inválida. Envie um texto válido." });
  }

  console.log(
    `[${new Date().toISOString()}] 📨 Mensagem recebida: ${userMessage}`
  );

  // 🌍 Detecta idioma com franc (PT, ES, EN)
  const francLang = franc(userMessage, { whitelist: ["pt", "es", "en"] });

  // 🇵🇾 Detecta Guarani com palavras-chave específicas
  const isGuarani = detectGuarani(userMessage);

  // 🎯 Define o idioma final com fallback
  const finalLang = isGuarani ? "gn" : francLang || "pt";

  // 🧠 Gera a mensagem de sistema para orientar a IA
  const systemMessage = getSystemMessage(finalLang);

  try {
    // 🛰️ Requisição para a API da OpenRouter (usando GPT)
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // Chave secreta da API
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo", // Modelo utilizado
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const data = await response.json();

    // 💬 Retorna a resposta da IA para o frontend
    res.json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Desculpe, não consegui gerar uma resposta.",
    });

    console.log("🤖 Resposta da IA:", data.choices?.[0]?.message?.content);
  } catch (error) {
    // ⚠️ Tratamento de erro para evitar crash do servidor
    console.error("❌ Erro ao conectar com a IA:", error.message);
    res.status(500).json({
      reply: `Erro interno: não foi possível conectar com a IA. Detalhes: ${error.message}`,
    });
  }
});

// 🚀 Inicializa o servidor na porta definida ou na 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ AgroIA rodando em http://localhost:${PORT}`);
});
