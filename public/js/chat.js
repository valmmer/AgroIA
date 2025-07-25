document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("user-input").value;
  const messages = document.getElementById("chat-messages");

  if (input.trim() === "") return;

  // Exibe a mensagem do usuário
  messages.innerHTML += `<p><strong>Você:</strong> ${input}</p>`;
  messages.scrollTop = messages.scrollHeight;

  console.log("Enviando mensagem:", input); // Log para depuração

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await response.json();
    console.log("Resposta da API:", data); // Log para depuração
    messages.innerHTML += `<p><strong>Agro IA:</strong> ${
      data.reply || "Desculpe, não consegui processar sua mensagem."
    }</p>`;
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    console.error("Erro na requisição:", error);
    messages.innerHTML += `<p><strong>Agro IA:</strong> Erro: Não foi possível obter resposta da IA.</p>`;
    messages.scrollTop = messages.scrollHeight;
  }

  document.getElementById("user-input").value = "";
});
