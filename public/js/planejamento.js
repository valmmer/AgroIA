// 🌱 Sugestão local (fallback) caso IA falhe
function sugerirCulturas(tipoSolo) {
  const culturasPorSolo = new Map([
    ["argiloso", ["Arroz", "Feijão", "Milho"]],
    ["arenoso", ["Cenoura", "Melancia", "Batata-doce"]],
    ["silte", ["Alface", "Beterraba", "Couve"]],
    ["franco", ["Soja", "Milho", "Trigo"]],
    ["calcario", ["Uva", "Azeitona", "Alfarroba"]],
    ["organico", ["Tomate", "Pimentão", "Abóbora"]],
  ]);
  return culturasPorSolo.get(tipoSolo) || ["Culturas variadas"];
}

// 🌦️ Previsão simulada
function gerarPrevisaoSimulada() {
  const condicoesClimaticas = [
    "Ensolarado",
    "Parcialmente Nublado",
    "Nublado",
    "Chuvoso",
  ];
  const temperatura = (Math.random() * 15 + 15).toFixed(1); // 15°C a 30°C
  const condicao =
    condicoesClimaticas[Math.floor(Math.random() * condicoesClimaticas.length)];
  const chuva =
    condicao === "Chuvoso"
      ? Math.floor(Math.random() * 70 + 30)
      : Math.floor(Math.random() * 20);

  return { temperatura, condicao, chuva };
}

// 🚨 Gera alertas
function gerarAlertas(condicao, temperatura) {
  const alertas = [];

  if (condicao === "Chuvoso") {
    alertas.push("Alerta: Possibilidade de chuva forte. Prepare o solo.");
  }
  if (temperatura < 10) {
    alertas.push("Alerta: Temperatura baixa. Risco de geadas.");
  }
  if (temperatura > 28) {
    alertas.push("Alerta: Temperatura alta. Atenção ao calor excessivo.");
  }

  return alertas;
}

// 🔁 Atualiza previsões
function atualizarPrevisao() {
  const previsao = gerarPrevisaoSimulada();

  document.getElementById("temp").textContent = previsao.temperatura;
  document.getElementById("condicao").textContent = previsao.condicao;
  document.getElementById("chuva").textContent = previsao.chuva;

  const alertas = gerarAlertas(
    previsao.condicao,
    parseFloat(previsao.temperatura)
  );
  const alertasContainer = document.getElementById("alertas-lista");
  const alertasSection = document.getElementById("alertas");

  alertasContainer.innerHTML = "";
  alertasSection.style.display = alertas.length > 0 ? "block" : "none";

  alertas.forEach((texto) => {
    const div = document.createElement("div");
    div.className = "alert";
    div.textContent = texto;
    alertasContainer.appendChild(div);
  });
}

// 🌱 Nova função: Sugestões da IA
async function obterSugestoesIA(dadosProdutor) {
  const listaCulturas = document.getElementById("lista-culturas");
  listaCulturas.innerHTML = "<li>Consultando a IA...</li>";

  try {
    const resposta = await fetch("/api/sugestoes-culturas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosProdutor),
    });

    const sugestoes = await resposta.json();

    listaCulturas.innerHTML = "";

    if (sugestoes && sugestoes.length > 0) {
      sugestoes.forEach((cultura) => {
        const li = document.createElement("li");
        li.textContent = cultura;
        listaCulturas.appendChild(li);
      });
    } else {
      listaCulturas.innerHTML = "<li>Nenhuma sugestão encontrada pela IA.</li>";
    }
  } catch (erro) {
    console.error("Erro com a IA. Usando sugestão local:", erro);
    listaCulturas.innerHTML = "";

    sugerirCulturas(dadosProdutor["tipo-solo"]).forEach((cultura) => {
      const li = document.createElement("li");
      li.textContent = cultura;
      listaCulturas.appendChild(li);
    });
  }
}

// 📦 Inicializa a página
document.addEventListener("DOMContentLoaded", () => {
  const dadosBrutos = localStorage.getItem("dadosProdutor");
  if (!dadosBrutos) {
    alert("Nenhum dado de produtor encontrado. Faça o cadastro primeiro.");
    window.location.href = "/cadastro";
    return;
  }

  let dados;
  try {
    dados = JSON.parse(dadosBrutos);
  } catch (erro) {
    console.error("Erro ao interpretar dados:", erro);
    alert("Erro ao carregar dados. Refaça o cadastro.");
    window.location.href = "/cadastro";
    return;
  }

  // 🧾 Exibe os dados
  document.getElementById("nome-produtor").textContent = dados.nome || "—";
  document.getElementById("localizacao-produtor").textContent =
    dados.localizacao || "—";
  document.getElementById("solo-produtor").textContent =
    dados["tipo-solo"] || "—";
  document.getElementById("culturas-produtor").textContent =
    dados.culturas || "—";
  document.getElementById("periodo-produtor").textContent =
    dados["periodo-plantio"] || "—";

  // 🌱 Sugestões da IA
  obterSugestoesIA({
    nome: dados.nome,
    localizacao: dados.localizacao,
    tipoSolo: dados["tipo-solo"],
    culturaInteresse: dados.culturas,
    periodoPlantio: dados["periodo-plantio"],
  });

  // 🌤️ Previsão
  atualizarPrevisao();

  // 🔄 Botão
  document
    .getElementById("btn-refresh")
    .addEventListener("click", atualizarPrevisao);
});
