document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-produtor");
  if (!form) {
    console.error("form-produtor não encontrado.");
    return;
  }

  // --- Toast simples ---
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  };

  // --- Pega elementos por id/name (tolerante) ---
  const els = {
    nome: form.querySelector('#nome, [name="nome"]'),
    city: form.querySelector('#city, [name="city"]'),
    state: form.querySelector('#state, [name="state"]'),
    tipoSolo: form.querySelector('#tipo-solo, [name="tipo-solo"]'),
    culturas: form.querySelector('#culturas, [name="culturas"]'),
    periodoPlantio: form.querySelector(
      '#periodo-plantio, [name="periodo-plantio"]'
    ),
  };

  // Aviso se algo estiver faltando no HTML
  const faltando = Object.entries(els)
    .filter(([, el]) => !el)
    .map(([k]) => k);
  if (faltando.length) {
    console.warn("Campos ausentes no formulário:", faltando);
  }

  // --- Prefill do localStorage ---
  try {
    const dadosSalvos = JSON.parse(
      localStorage.getItem("dadosProdutor") || "null"
    );
    if (dadosSalvos) {
      // Se já tínhamos localizacao "Cidade, UF", tenta preencher city/state
      if (dadosSalvos.localizacao && els.city && els.state) {
        const m = String(dadosSalvos.localizacao).match(
          /^(.*?),(?:\s*([A-Za-z]{2}))?$/
        );
        if (m) {
          if (m[1] && els.city) els.city.value = m[1].trim();
          if (m[2] && els.state) els.state.value = m[2].trim().toUpperCase();
        } else {
          // fallback: tudo em city
          els.city.value = dadosSalvos.localizacao;
        }
      }
      if (els.nome) els.nome.value = dadosSalvos.nome || "";
      if (els.tipoSolo) els.tipoSolo.value = dadosSalvos["tipo-solo"] || "";
      if (els.culturas) els.culturas.value = dadosSalvos.culturas || "";
      if (els.periodoPlantio)
        els.periodoPlantio.value = dadosSalvos["periodo-plantio"] || "";
    }
  } catch (e) {
    console.warn("Não foi possível ler dados salvos:", e);
  }

  // --- Submit (vale para ambos botões 'submit') ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Normaliza UF em maiúsculas
    const uf = (els.state?.value || "").trim().toUpperCase();
    const cidade = (els.city?.value || "").trim();

    // Monta a string que o restante do sistema espera
    const localizacao = cidade && uf ? `${cidade}, ${uf}` : cidade;

    const dados = {
      nome: (els.nome?.value || "").trim(),
      localizacao, // <- chave esperada pelo restante do app
      "tipo-solo": (els.tipoSolo?.value || "").trim(),
      culturas: (els.culturas?.value || "").trim(),
      "periodo-plantio": (els.periodoPlantio?.value || "").trim(),
    };

    // Validação básica (o form está com novalidate)
    if (
      !dados.nome ||
      !cidade ||
      !uf ||
      uf.length !== 2 ||
      !dados["tipo-solo"] ||
      !dados.culturas ||
      !dados["periodo-plantio"]
    ) {
      showToast("Por favor, preencha todos os campos corretamente.");
      return;
    }

    // Persiste no storage (consumido pelo planejamento.js)
    localStorage.setItem("dadosProdutor", JSON.stringify(dados));

    // Se o botão foi "Buscar Clima", opcionalmente podemos já abrir /planejamento
    // Dica: dê um id ao botão para diferenciar, ex.: id="btn-buscar-clima"
    // if (e.submitter?.id === "btn-buscar-clima") {
    //   window.location.href = "/planejamento";
    //   return;
    // }

    showToast("Dados salvos com sucesso!");
  });
});
