const express = require("express");
const axios = require("axios");
const router = express.Router();

// Aqui você coloca sua chave da OpenWeatherMap (crie uma conta gratuita)
const API_KEY = "SUA_CHAVE_API_AQUI";

router.get("/", async (req, res) => {
  // Recebe latitude e longitude via query params
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Parâmetros lat e lon são obrigatórios" });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;

    const response = await axios.get(url);
    const data = response.data;

    // Preparar dados para enviar para o frontend
    const clima = {
      temperatura: data.main.temp,
      condicao: data.weather[0].description,
      chuva: data.rain ? data.rain["1h"] || 0 : 0,
      vento: data.wind.speed,
      cidade: data.name,
    };

    res.json(clima);
  } catch (error) {
    console.error("Erro ao buscar clima:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados climáticos" });
  }
});

module.exports = router;
