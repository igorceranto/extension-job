document.getElementById("agendar").addEventListener("click", () => {
  const mensagem = document.getElementById("mensagem").value;
  const horarioInput = document.getElementById("horario").value;

  if (!mensagem || !horarioInput) {
    alert("Preencha a mensagem e o horário.");
    return;
  }

  const scheduledTime = new Date(horarioInput);
  const now = new Date();
  const diff = scheduledTime - now;

  if (diff <= 0) {
    alert("O horário deve ser no futuro.");
    return;
  }

  // Formata o tempo restante em horas, minutos e segundos
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const diffFormatted = hours + "h " + minutes + "m " + seconds + "s";

  // Injetando a mensagem com o tempo restante no chat do WhatsApp
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url.includes("web.whatsapp.com")) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (mensagem, diffFormatted) => {
          function injectMessage() {
            // Identifica o chat ativo no WhatsApp Web
            const chatContainer = document.querySelector('div[data-testid="conversation-panel"]');
            if (chatContainer) {
              const messageDiv = document.createElement("div");
              messageDiv.style.margin = "10px 0";
              messageDiv.style.padding = "10px";
              messageDiv.style.background = "#dcf8c6";
              messageDiv.style.borderRadius = "8px";
              messageDiv.style.display = "inline-block";
              messageDiv.style.fontSize = "14px";
              messageDiv.style.lineHeight = "1.4";
              messageDiv.innerText = mensagem;

              const clockSpan = document.createElement("span");
              clockSpan.style.marginLeft = "10px";
              clockSpan.style.fontSize = "12px";
              clockSpan.style.color = "#555";
              clockSpan.innerText = "⏰ " + diffFormatted;

              messageDiv.appendChild(clockSpan);
              chatContainer.appendChild(messageDiv);
            } else {
              // Tenta novamente em 1 segundo se o container não estiver disponível
              setTimeout(injectMessage, 1000);
            }
          }
          injectMessage();
        },
        args: [mensagem, diffFormatted]
      });
    } else {
      alert("Por favor, abra o WhatsApp Web antes de agendar uma mensagem.");
      return;
    }
  });

  // Salva a mensagem agendada para persistência
  chrome.storage.local.get("persistentMessages", (data) => {
    let messages = data.persistentMessages || [];
    messages.push({
      mensagem,
      diffFormatted,
      scheduledTime: scheduledTime.toISOString(),
      enviado: false
    });
    chrome.storage.local.set({ persistentMessages: messages }, () => {
      // Configura o alarme para enviar a mensagem no horário agendado
      chrome.alarms.create(scheduledTime.toISOString(), { when: scheduledTime.getTime() });
      alert("Mensagem agendada com sucesso!");
    });
  });
});

// Remove o botão de relógio e ajusta os campos
// Removendo o clockButton
const clockButton = document.getElementById("clockButton");
if (clockButton) {
  clockButton.remove();
}

// Ajustando os campos para melhor usabilidade
document.getElementById("mensagem").style.width = "100%";
document.getElementById("mensagem").style.height = "100px";
document.getElementById("mensagem").style.marginBottom = "10px";
document.getElementById("mensagem").style.padding = "10px";
document.getElementById("mensagem").style.border = "1px solid #ccc";
document.getElementById("mensagem").style.borderRadius = "4px";

document.getElementById("horario").style.width = "100%";
document.getElementById("horario").style.marginBottom = "10px";
document.getElementById("horario").style.padding = "10px";
document.getElementById("horario").style.border = "1px solid #ccc";
document.getElementById("horario").style.borderRadius = "4px";

const agendarButton = document.getElementById("agendar");
agendarButton.style.width = "100%";
agendarButton.style.padding = "10px";
agendarButton.style.backgroundColor = "#4CAF50";
agendarButton.style.color = "#fff";
agendarButton.style.border = "none";
agendarButton.style.borderRadius = "4px";
agendarButton.style.cursor = "pointer";
agendarButton.style.fontSize = "16px";
agendarButton.style.fontWeight = "bold";
agendarButton.style.transition = "background-color 0.3s ease";

agendarButton.addEventListener("mouseover", () => {
  agendarButton.style.backgroundColor = "#45a049";
});

agendarButton.addEventListener("mouseout", () => {
  agendarButton.style.backgroundColor = "#4CAF50";
});

// Adiciona um botão para abrir a tela de mensagens agendadas
const openScheduledButton = document.createElement("button");
openScheduledButton.id = "openScheduledButton";
openScheduledButton.style.position = "fixed";
openScheduledButton.style.right = "10px";
openScheduledButton.style.bottom = "70px";
openScheduledButton.style.width = "50px";
openScheduledButton.style.height = "50px";
openScheduledButton.style.borderRadius = "50%";
openScheduledButton.style.backgroundColor = "#007bff";
openScheduledButton.style.border = "none";
openScheduledButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
openScheduledButton.style.cursor = "pointer";
openScheduledButton.style.display = "flex";
openScheduledButton.style.alignItems = "center";
openScheduledButton.style.justifyContent = "center";
openScheduledButton.innerHTML = "📋";

// Adiciona evento de clique para abrir a tela de mensagens agendadas
openScheduledButton.addEventListener("click", () => {
  chrome.tabs.create({ url: "scheduled.html" });
});

// Adiciona o botão ao corpo do documento
document.body.appendChild(openScheduledButton);
