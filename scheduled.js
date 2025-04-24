// Recupera as mensagens do armazenamento local
chrome.storage.local.get("persistentMessages", (data) => {
  const messages = data.persistentMessages || [];
  const now = new Date();

  const notSentList = document.getElementById("not-sent-list");
  const sentList = document.getElementById("sent-list");

  messages.forEach(({ mensagem, scheduledTime }) => {
    const listItem = document.createElement("li");
    const timeLeft = new Date(scheduledTime) - now;

    if (timeLeft > 0) {
      listItem.textContent = `Mensagem: "${mensagem}" - Tempo restante: ${Math.floor(timeLeft / 1000)} segundos`;
      notSentList.appendChild(listItem);
    } else {
      listItem.textContent = `Mensagem: "${mensagem}" - Já enviada`;
      sentList.appendChild(listItem);
    }
  });
});

// Exportar mensagens
document.getElementById("export").addEventListener("click", () => {
  chrome.storage.local.get("persistentMessages", (data) => {
    const blob = new Blob([JSON.stringify(data.persistentMessages || [])], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mensagens_agendadas.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Importar mensagens
document.getElementById("import").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMessages = JSON.parse(e.target.result);
          chrome.storage.local.set({ persistentMessages: importedMessages }, () => {
            alert("Mensagens importadas com sucesso!");
            location.reload();
          });
        } catch (error) {
          alert("Erro ao importar mensagens: " + error.message);
        }
      };
      reader.readAsText(file);
    }
  });
  input.click();
}); 