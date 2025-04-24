// Registra o service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
});

// Adiciona logs para depuração
console.log("Registrando listener para alarmes...");

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(`Alarme disparado: ${alarm.name}`);
    chrome.storage.local.get("persistentMessages", (data) => {
      console.log("Mensagens persistentes carregadas:", data);
      let messages = data.persistentMessages || [];
      const now = new Date();

      messages = messages.map((msg) => {
        if (msg.scheduledTime === alarm.name && !msg.enviado) {
          console.log(`Enviando mensagem agendada: ${msg.mensagem}`);
          
          // Verifica se a aba ativa é do WhatsApp Web
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url.includes("web.whatsapp.com")) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: async (mensagem, chatId) => {
                  // Procura o chat específico
                  const chatElement = document.querySelector(`div[data-testid="${chatId}"]`);
                  if (chatElement) {
                    // Clica no chat para selecioná-lo
                    chatElement.click();
                    
                    // Aguarda o carregamento do chat
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Procura o campo de texto do WhatsApp Web
                    const campoTexto = document.querySelector('div[data-testid="conversation-compose-box-input"]');
                    if (campoTexto) {
                      // Simula o clique no campo de texto
                      campoTexto.click();
                      
                      // Aguarda um momento para garantir que o campo está focado
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      // Insere o texto
                      document.execCommand('insertText', false, mensagem);
                      
                      // Aguarda um momento para garantir que o texto foi inserido
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      // Procura o botão de enviar
                      const sendButton = document.querySelector('button[data-testid="send"]');
                      if (sendButton) {
                        sendButton.click();
                      } else {
                        // Se não encontrar o botão, tenta enviar com Enter
                        const event = new KeyboardEvent('keydown', {
                          key: 'Enter',
                          code: 'Enter',
                          keyCode: 13,
                          which: 13,
                          bubbles: true
                        });
                        campoTexto.dispatchEvent(event);
                      }
                    } else {
                      console.error("Campo de texto não encontrado.");
                    }
                  } else {
                    console.error("Chat não encontrado.");
                  }
                },
                args: [msg.mensagem, msg.chatId]
              });
            } else {
              console.error("Nenhuma aba do WhatsApp Web ativa encontrada.");
            }
          });

          // Marca a mensagem como enviada
          return { ...msg, enviado: true };
        }
        return msg;
      });

      chrome.storage.local.set({ persistentMessages: messages }, () => {
        console.log("Mensagens atualizadas após envio:", messages);
      });
    });
  });
} else {
  console.error("chrome.alarms não está disponível.");
}

// Garante que o script seja injetado corretamente na aba ativa
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["persist.js"]
    }, () => {
      console.log("Script persist.js injetado com sucesso na aba ativa.");
    });
  } else {
    console.error("Nenhuma aba ativa encontrada para injetar o script.");
  }
});

// Adiciona um botão de relógio na página do WhatsApp
function addClockButtonToWhatsApp() {
  const clockButton = document.createElement("button");
  clockButton.id = "clockButton";
  clockButton.style.position = "fixed";
  clockButton.style.right = "10px";
  clockButton.style.bottom = "10px";
  clockButton.style.width = "50px";
  clockButton.style.height = "50px";
  clockButton.style.borderRadius = "50%";
  clockButton.style.backgroundColor = "#25D366";
  clockButton.style.border = "none";
  clockButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  clockButton.style.cursor = "pointer";
  clockButton.style.display = "flex";
  clockButton.style.alignItems = "center";
  clockButton.style.justifyContent = "center";
  clockButton.innerHTML = "⏰";

  clockButton.addEventListener("click", () => {
    alert("Botão de relógio clicado! Aqui você pode implementar a lógica para agendar ou enviar automaticamente.");
  });

  document.body.appendChild(clockButton);
}

// Exibe a mensagem agendada no chat do WhatsApp
function displayScheduledMessage(mensagem, diffFormatted) {
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
  }
}

// Atualiza o armazenamento local ao agendar uma mensagem
chrome.storage.local.get("persistentMessages", (data) => {
  let messages = data.persistentMessages || [];
  messages.push({
    mensagem,
    diffFormatted,
    scheduledTime: scheduledTime.toISOString(),
    enviado: false
  });
  chrome.storage.local.set({ persistentMessages: messages });

  // Configura um alarme para enviar a mensagem no horário agendado
  chrome.alarms.create(scheduledTime.toISOString(), { when: scheduledTime.getTime() });
});

// Executa o script na página do WhatsApp
if (window.location.hostname.includes("web.whatsapp.com")) {
  addClockButtonToWhatsApp();

  chrome.storage.local.get("persistentMessages", (data) => {
    const messages = data.persistentMessages || [];
    messages.forEach(({ mensagem, diffFormatted }) => {
      displayScheduledMessage(mensagem, diffFormatted);
    });
  });
}

// Adiciona o listener para mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scheduleMessage") {
    const { message, scheduledTime } = request;
    
    // Salva a mensagem agendada
    chrome.storage.local.get("persistentMessages", (data) => {
      let messages = data.persistentMessages || [];
      messages.push({
        message,
        scheduledTime,
        enviado: false
      });
      
      chrome.storage.local.set({ persistentMessages: messages }, () => {
        // Configura o alarme para enviar a mensagem
        chrome.alarms.create(scheduledTime, { when: new Date(scheduledTime).getTime() });
        sendResponse({ success: true });
      });
    });
    
    return true; // Mantém a conexão aberta para a resposta assíncrona
  }
});

// Função para detectar elementos do WhatsApp
function detectWhatsAppElements() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 10;
    let attempts = 0;

    const checkElements = () => {
      attempts++;
      
      const chatContainer = document.querySelector('div[data-testid="conversation-panel"]');
      const inputField = document.querySelector('div[data-testid="conversation-compose-box-input"]');
      const sendButton = document.querySelector('button[data-testid="send"]');

      if (chatContainer && inputField && sendButton) {
        resolve({ chatContainer, inputField, sendButton });
      } else if (attempts >= maxAttempts) {
        reject(new Error('Elementos do WhatsApp não encontrados após várias tentativas'));
      } else {
        setTimeout(checkElements, 500);
      }
    };

    checkElements();
  });
}

// Função para verificar se o WhatsApp Web está carregado
function checkWhatsAppLoaded() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 20;
    let attempts = 0;

    const check = () => {
      attempts++;
      
      // Verifica se a página está carregada
      if (document.readyState === 'complete') {
        // Verifica se o WhatsApp Web está carregado
        const whatsAppLoaded = document.querySelector('div[data-testid="chat-list"]') !== null;
        
        if (whatsAppLoaded) {
          resolve(true);
        } else if (attempts >= maxAttempts) {
          reject(new Error('WhatsApp Web não carregou corretamente'));
        } else {
          setTimeout(check, 500);
        }
      } else if (attempts >= maxAttempts) {
        reject(new Error('Página não carregou completamente'));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}

// Modifica a função sendMessageWithRetry para incluir a verificação de carregamento
async function sendMessageWithRetry(message) {
  try {
    // Verifica se o WhatsApp Web está carregado
    await checkWhatsAppLoaded();
    
    // Detecta os elementos
    const elements = await detectWhatsAppElements();
    
    // Limpa o campo de entrada
    elements.inputField.textContent = '';
    elements.inputField.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Insere a mensagem
    elements.inputField.textContent = message;
    elements.inputField.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Aguarda um momento para garantir que o texto foi inserido
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clica no botão de enviar
    elements.sendButton.click();
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

// Modifica o listener de alarmes para usar as novas funções
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get("persistentMessages", (data) => {
    const messages = data.persistentMessages || [];
    const messageToSend = messages.find(m => m.scheduledTime === alarm.name && !m.enviado);
    
    if (messageToSend) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url.includes("web.whatsapp.com")) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: sendMessageWithRetry,
            args: [messageToSend.message]
          }).then(() => {
            // Marca a mensagem como enviada
            messageToSend.enviado = true;
            chrome.storage.local.set({ persistentMessages: messages });
          }).catch(error => {
            console.error('Erro ao enviar mensagem:', error);
          });
        }
      });
    }
  });
});
