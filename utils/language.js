// utils/language.js

// 🔍 Detecta se o texto contém palavras em guarani
function detectGuarani(text) {
  const guaraniKeywords = [
    "mba'éichapa",
    "che",
    "nde",
    "pytyvõ",
    "kokue",
    "ñemitỹ",
    "rehegua",
    "ikatu",
    "rembiapo",
    "ag̃ua",
    "ka'avo",
    "tembi'u",
    "ñane",
    "mitã",
    "ñemity",
  ];
  return guaraniKeywords.some((word) => text.toLowerCase().includes(word));
}

// 🧠 Retorna instruções para IA conforme idioma detectado
function getSystemMessage(languageCode) {
  switch (languageCode) {
    case "pt":
      return "Você é AgroIA, um assistente agrícola que responde em português brasileiro com clareza e simpatia.";
    case "es":
      return "Eres AgroIA, un asistente agrícola que responde en español claro, útil y amigable.";
    case "en":
      return "You are AgroIA, an agricultural assistant who responds in English with clarity and helpfulness.";
    case "gn":
      return "Nde hína AgroIA, peteî pytyvõhára tembiapo ñemitỹ rehegua. Responde en guaraní mixto con español, de forma respeitosa y útil.";
    default:
      return "Você é AgroIA, um assistente agrícola bilíngue. Responda conforme o idioma do usuário.";
  }
}

// 🧩 Exporta as funções para serem usadas em outros arquivos
module.exports = { detectGuarani, getSystemMessage };
