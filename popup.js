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

// Adiciona o botão de agendamento no chat do WhatsApp
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0 && tabs[0].url.includes("web.whatsapp.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        // Cria o botão de agendamento
        const scheduleButton = document.createElement("button");
        scheduleButton.innerHTML = "⏰";
        scheduleButton.style.position = "fixed";
        scheduleButton.style.right = "10px";
        scheduleButton.style.top = "10px";
        scheduleButton.style.zIndex = "9999";
        scheduleButton.style.padding = "10px";
        scheduleButton.style.borderRadius = "50%";
        scheduleButton.style.backgroundColor = "#128C7E";
        scheduleButton.style.color = "white";
        scheduleButton.style.border = "none";
        scheduleButton.style.cursor = "pointer";
        scheduleButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

        // Cria o modal
        const modal = document.createElement("div");
        modal.style.display = "none";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.zIndex = "10000";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";

        const modalContent = document.createElement("div");
        modalContent.style.backgroundColor = "white";
        modalContent.style.padding = "20px";
        modalContent.style.borderRadius = "8px";
        modalContent.style.width = "300px";

        const title = document.createElement("h2");
        title.textContent = "Agendar Mensagem";
        title.style.marginBottom = "20px";
        title.style.color = "#128C7E";

        const messageInput = document.createElement("textarea");
        messageInput.placeholder = "Digite sua mensagem";
        messageInput.style.width = "100%";
        messageInput.style.height = "100px";
        messageInput.style.marginBottom = "10px";
        messageInput.style.padding = "10px";
        messageInput.style.border = "1px solid #ccc";
        messageInput.style.borderRadius = "4px";

        const dateInput = document.createElement("input");
        dateInput.type = "datetime-local";
        dateInput.style.width = "100%";
        dateInput.style.marginBottom = "20px";
        dateInput.style.padding = "10px";
        dateInput.style.border = "1px solid #ccc";
        dateInput.style.borderRadius = "4px";

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-between";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancelar";
        cancelButton.style.padding = "10px 20px";
        cancelButton.style.backgroundColor = "#ccc";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "4px";
        cancelButton.style.cursor = "pointer";

        const scheduleConfirmButton = document.createElement("button");
        scheduleConfirmButton.textContent = "Agendar";
        scheduleConfirmButton.style.padding = "10px 20px";
        scheduleConfirmButton.style.backgroundColor = "#128C7E";
        scheduleConfirmButton.style.color = "white";
        scheduleConfirmButton.style.border = "none";
        scheduleConfirmButton.style.borderRadius = "4px";
        scheduleConfirmButton.style.cursor = "pointer";

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(scheduleConfirmButton);

        modalContent.appendChild(title);
        modalContent.appendChild(messageInput);
        modalContent.appendChild(dateInput);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Adiciona eventos
        scheduleButton.addEventListener("click", () => {
          modal.style.display = "flex";
        });

        cancelButton.addEventListener("click", () => {
          modal.style.display = "none";
        });

        scheduleConfirmButton.addEventListener("click", () => {
          const message = messageInput.value;
          const date = dateInput.value;

          if (!message || !date) {
            alert("Por favor, preencha todos os campos.");
            return;
          }

          const scheduledTime = new Date(date);
          const now = new Date();

          if (scheduledTime <= now) {
            alert("A data deve ser no futuro.");
            return;
          }

          // Envia a mensagem para o background script
          chrome.runtime.sendMessage({
            action: "scheduleMessage",
            message: message,
            scheduledTime: scheduledTime.toISOString()
          });

          modal.style.display = "none";
          messageInput.value = "";
          dateInput.value = "";
        });

        document.body.appendChild(scheduleButton);
      }
    });
  }
});

// Função para formatar a data e hora
function formatDateTime(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função para atualizar a lista de mensagens agendadas
function updateScheduledList() {
  chrome.storage.local.get("persistentMessages", (data) => {
    const messages = data.persistentMessages || [];
    const scheduledList = document.getElementById("scheduledList");
    scheduledList.innerHTML = "";

    messages.forEach((msg, index) => {
      if (!msg.enviado) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "scheduled-message";
        
        const timeDiv = document.createElement("div");
        timeDiv.className = "time";
        timeDiv.textContent = formatDateTime(msg.scheduledTime);
        
        const messageContent = document.createElement("div");
        messageContent.className = "message";
        messageContent.textContent = msg.message;
        
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Excluir";
        deleteButton.style.marginTop = "5px";
        deleteButton.style.padding = "5px 10px";
        deleteButton.style.backgroundColor = "#dc3545";
        deleteButton.style.color = "white";
        deleteButton.style.border = "none";
        deleteButton.style.borderRadius = "4px";
        deleteButton.style.cursor = "pointer";
        
        deleteButton.addEventListener("click", () => {
          messages.splice(index, 1);
          chrome.storage.local.set({ persistentMessages: messages }, () => {
            updateScheduledList();
          });
        });
        
        messageDiv.appendChild(timeDiv);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(deleteButton);
        scheduledList.appendChild(messageDiv);
      }
    });
  });
}

// Adiciona o evento de clique no botão de agendar
document.getElementById("schedule").addEventListener("click", () => {
  const message = document.getElementById("message").value;
  const datetime = document.getElementById("datetime").value;

  if (!message || !datetime) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const scheduledTime = new Date(datetime);
  const now = new Date();

  if (scheduledTime <= now) {
    alert("A data deve ser no futuro.");
    return;
  }

  // Salva a mensagem agendada
  chrome.storage.local.get("persistentMessages", (data) => {
    let messages = data.persistentMessages || [];
    messages.push({
      message,
      scheduledTime: scheduledTime.toISOString(),
      enviado: false
    });
    
    chrome.storage.local.set({ persistentMessages: messages }, () => {
      // Configura o alarme para enviar a mensagem
      chrome.alarms.create(scheduledTime.toISOString(), { when: scheduledTime.getTime() });
      
      // Limpa os campos
      document.getElementById("message").value = "";
      document.getElementById("datetime").value = "";
      
      // Atualiza a lista
      updateScheduledList();
      
      alert("Mensagem agendada com sucesso!");
    });
  });
});

// Atualiza a lista de mensagens agendadas quando a página carrega
document.addEventListener("DOMContentLoaded", updateScheduledList);
