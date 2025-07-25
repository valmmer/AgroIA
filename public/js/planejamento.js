// 🌱 Sugere culturas com base no tipo de solo
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

// 🌦️ Gera uma previsão de tempo simulada
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

// 🚨 Gera alertas com base na previsão
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

// 🔁 Atualiza os dados visuais da previsão e dos alertas
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

// 📦 Inicializa a página com os dados salvos no localStorage
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

  // 🧾 Exibe os dados do produtor
  document.getElementById("nome-produtor").textContent = dados.nome || "—";
  document.getElementById("localizacao-produtor").textContent =
    dados.localizacao || "—";
  document.getElementById("solo-produtor").textContent =
    dados["tipo-solo"] || "—";
  document.getElementById("culturas-produtor").textContent =
    dados.culturas || "—";
  document.getElementById("periodo-produtor").textContent =
    dados["periodo-plantio"] || "—";

  // 🌿 Sugere culturas
  const listaCulturas = document.getElementById("lista-culturas");
  listaCulturas.innerHTML = "";
  sugerirCulturas(dados["tipo-solo"]).forEach((cultura) => {
    const li = document.createElement("li");
    li.textContent = cultura;
    listaCulturas.appendChild(li);
  });

  // 🌤️ Atualiza previsão na primeira carga
  atualizarPrevisao();

  // 🔄 Botão de atualização
  document
    .getElementById("btn-refresh")
    .addEventListener("click", atualizarPrevisao);
});
