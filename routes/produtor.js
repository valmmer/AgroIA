const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const filePath = path.join(__dirname, "../data/produtores.json");

// GET - listar produtores
router.get("/", (req, res) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erro ao ler arquivo" });
    res.json(JSON.parse(data));
  });
});

// POST - adicionar produtor
router.post("/", (req, res) => {
  const novoProdutor = req.body;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erro ao ler arquivo" });

    const produtores = JSON.parse(data);
    produtores.push(novoProdutor);

    fs.writeFile(filePath, JSON.stringify(produtores, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Erro ao salvar dados" });
      res.status(201).json({ message: "Produtor adicionado com sucesso" });
    });
  });
});

module.exports = router;
