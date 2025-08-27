// routes/produtor.js
const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const router = express.Router();

const dirPath = path.join(__dirname, "../data");
const filePath = path.join(dirPath, "produtores.json");

async function ensureStore() {
  await fsp.mkdir(dirPath, { recursive: true });
  try {
    await fsp.access(filePath, fs.constants.F_OK);
  } catch {
    await fsp.writeFile(filePath, "[]", "utf8");
  }
}

async function readAll() {
  await ensureStore();
  const raw = await fsp.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeAll(list) {
  await ensureStore();
  await fsp.writeFile(filePath, JSON.stringify(list, null, 2), "utf8");
}

// GET - listar produtores
router.get("/", async (req, res, next) => {
  try {
    const produtores = await readAll();
    res.json(produtores);
  } catch (err) {
    next(err);
  }
});

// POST - adicionar produtor (com validação simples)
router.post("/", express.json({ limit: "200kb" }), async (req, res, next) => {
  try {
    const { id, nome, telefone } = req.body || {};
    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      (telefone && typeof telefone !== "string")
    ) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    const produtores = await readAll();
    const novo = {
      id: String(id || Date.now()),
      nome: nome.trim(),
      telefone: telefone?.trim() || null,
      createdAt: Date.now(),
    };
    produtores.push(novo);
    await writeAll(produtores);
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
