// routes/clima.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.OPENWEATHER_API_KEY; // defina no .env

router.get("/", async (req, res, next) => {
  try {
    if (!API_KEY) {
      return res.status(501).json({ error: "Serviço de clima não configurado" });
    }
    const { lat, lon, lang = "pt_br" } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Parâmetros lat e lon são obrigatórios" });
    }

    const url = "https://api.openweathermap.org/data/2.5/weather";
    const { data } = await axios.get(url, {
      params: { lat, lon, appid: API_KEY, units: "metric", lang },
      timeout: 8000,
      validateStatus: s => s >= 200 && s < 500, // capturar 4xx/5xx da API
    });

    if (data.cod && Number(data.cod) !== 200) {
      return res.status(502).json({
        error: "Falha ao consultar OpenWeather",
        detail: data.message || data.cod,
      });
    }

    res.json({
      temperatura: data.main?.temp,
      umidade: data.main?.humidity,
      condicao: data.weather?.[0]?.description,
      chuva_mm_h: data.rain?.["1h"] ?? 0,
      vento_ms: data.wind?.speed,
      cidade: data.name,
      dt: data.dt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
