document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-produtor");

  // Criar o elemento toast dinamicamente
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // Carregar dados salvos
  const dadosSalvos = JSON.parse(localStorage.getItem("dadosProdutor"));
  if (dadosSalvos) {
    form.nome.value = dadosSalvos.nome || "";
    form.localizacao.value = dadosSalvos.localizacao || "";
    form["tipo-solo"].value = dadosSalvos["tipo-solo"] || "";
    form.culturas.value = dadosSalvos.culturas || "";
    form["periodo-plantio"].value = dadosSalvos["periodo-plantio"] || "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const dados = {
      nome: form.nome.value.trim(),
      localizacao: form.localizacao.value.trim(),
      "tipo-solo": form["tipo-solo"].value,
      culturas: form.culturas.value.trim(),
      "periodo-plantio": form["periodo-plantio"].value.trim(),
    };

    if (
      !dados.nome ||
      !dados.localizacao ||
      !dados["tipo-solo"] ||
      !dados.culturas ||
      !dados["periodo-plantio"]
    ) {
      showToast("Por favor, preencha todos os campos corretamente.");
      return;
    }

    localStorage.setItem("dadosProdutor", JSON.stringify(dados));
    showToast("Dados salvos com sucesso!");
    // form.reset(); // opcional limpar form após salvar
  });
});
