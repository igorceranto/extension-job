// Adiciona o CSS ao documento
const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('persist.css');
document.head.appendChild(style);

function formatTimeRemaining(date) {
    const now = new Date();
    const diff = date - now;
    
    if (diff <= 0) return "Agora";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Função para encontrar elementos do WhatsApp de forma dinâmica
function findWhatsAppElement(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

// Função para observar mudanças em elementos específicos
function observeElementChanges(targetSelector, callback) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' || mutation.type === 'childList') {
                callback();
            }
        });
    });

    const target = document.querySelector(targetSelector);
    if (target) {
        observer.observe(target, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    return observer;
}

// Função para obter o nome do chat de forma dinâmica
function getChatName(chatId) {
    const selectors = [
        '#main > header > div.x78zum5.xdt5ytf.x1iyjqo2.xl56j7k.xeuugli > div > div > div > div > span',
        'div[data-testid="conversation-header"] span[title]',
        'div[data-testid="conversation-header"] div[title]',
        'div[data-testid="chat-list"] div[aria-selected="true"] span[title]',
        'div[data-testid="chat-list"] div[aria-selected="true"] div[title]'
    ];

    const element = findWhatsAppElement(selectors);
    if (element) {
        const name = element.getAttribute('title') || element.textContent.trim();
        if (name && name !== '') {
            return name;
        }
    }

    return 'Chat desconhecido';
}

// Função para obter o chat atual de forma dinâmica
function getCurrentChat() {
    const selectors = [
        'div[data-testid="conversation-panel"]',
        'div[data-testid="chat-list"] div[aria-selected="true"]',
        'div[data-testid="conversation-header"]'
    ];

    const element = findWhatsAppElement(selectors);
    if (element) {
        const chatId = element.getAttribute('data-testid');
        if (chatId) {
            return {
                element,
                chatId,
                name: getChatName(chatId)
            };
        }
    }

    return null;
}

// Função para observar mudanças no chat atual
function observeCurrentChat(callback) {
    const observer = new MutationObserver((mutations) => {
        const currentChat = getCurrentChat();
        if (currentChat) {
            callback(currentChat);
        }
    });

    // Observa mudanças no painel de conversa e lista de chats
    const selectors = [
        'div[data-testid="conversation-panel"]',
        'div[data-testid="chat-list"]'
    ];

    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            observer.observe(element, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    });

    return observer;
}

// Função para verificar e enviar mensagens agendadas
function checkAndSendScheduledMessages() {
    chrome.storage.local.get('persistentMessages', (data) => {
        const messages = data.persistentMessages || [];
        const now = new Date();
        let updatedMessages = false;

        messages.forEach((msg, index) => {
            if (!msg.enviado && new Date(msg.scheduledTime) <= now) {
                const currentChat = getCurrentChat();
                if (currentChat && currentChat.chatId === msg.chatId) {
                    const inputSelectors = [
                        'div[data-testid="conversation-compose-box-input"]',
                        'div[contenteditable="true"][data-testid="conversation-compose-box-input"]'
                    ];
                    
                    const inputField = findWhatsAppElement(inputSelectors);
                    if (inputField) {
                        inputField.click();
                        document.execCommand('insertText', false, msg.mensagem);
                        
                        setTimeout(() => {
                            const sendButtonSelectors = [
                                'button[data-testid="send"]',
                                'span[data-testid="send"]',
                                'div[data-testid="send"]'
                            ];
                            
                            const sendButton = findWhatsAppElement(sendButtonSelectors);
                            if (sendButton) {
                                sendButton.click();
                                messages[index].enviado = true;
                                updatedMessages = true;
                            }
                        }, 100);
                    }
                } else {
                    // Se não estiver no chat correto, tenta navegar até ele
                    const chatSelectors = [
                        `div[data-testid="${msg.chatId}"]`,
                        `div[aria-selected="true"][data-testid="${msg.chatId}"]`
                    ];
                    
                    const chatElement = findWhatsAppElement(chatSelectors);
                    if (chatElement) {
                        chatElement.click();
                        setTimeout(() => {
                            checkAndSendScheduledMessages();
                        }, 1000);
                    }
                }
            }
        });

        if (updatedMessages) {
            chrome.storage.local.set({ persistentMessages: messages }, () => {
                updateScheduledMessagePreviews();
                updateScheduledMessagesPanel();
            });
        }
    });
}

// Verifica mensagens a cada segundo
setInterval(checkAndSendScheduledMessages, 1000);

function injectSendButton() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    // Verifica se o botão já existe
    if (document.querySelector('.schedule-button')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginRight = '8px';

    const scheduleButton = document.createElement('button');
    scheduleButton.className = 'schedule-button';
    scheduleButton.innerHTML = '⏰';
    scheduleButton.title = 'Agendar mensagem';

    scheduleButton.addEventListener('click', () => {
        const inputField = document.querySelector('div[data-testid="conversation-compose-box-input"]');
        if (!inputField) return;

        const message = inputField.textContent;
        if (!message) {
            alert('Digite uma mensagem antes de agendar');
            return;
        }

        const scheduledTime = prompt('Digite a data e hora para envio (formato: DD/MM/YYYY HH:mm)');
        if (!scheduledTime) return;

        const [date, time] = scheduledTime.split(' ');
        const [day, month, year] = date.split('/');
        const [hour, minute] = time.split(':');
        
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        
        if (scheduledDate <= new Date()) {
            alert('A data deve ser no futuro');
            return;
        }

        const currentChat = document.querySelector('div[data-testid="chat-list"] div[aria-selected="true"]');
        const chatId = currentChat ? currentChat.getAttribute('data-testid') : null;
        const chatName = getChatName(chatId);

        chrome.storage.local.get('persistentMessages', (data) => {
            const messages = data.persistentMessages || [];
            messages.push({
                mensagem: message,
                scheduledTime: scheduledDate.toISOString(),
                enviado: false,
                chatId: chatId,
                chatName: chatName
            });
            
            chrome.storage.local.set({ persistentMessages: messages }, () => {
                updateScheduledMessagePreviews();
                inputField.textContent = '';
                alert('Mensagem agendada com sucesso!');
            });
        });
    });

    // Procura o botão de enviar original do WhatsApp
    const sendButton = footer.querySelector('button[data-testid="send"]');
    if (sendButton) {
        // Insere o botão de agendamento antes do botão de enviar
        sendButton.parentElement.insertBefore(buttonContainer, sendButton);
        buttonContainer.appendChild(scheduleButton);
    }
}

function updateScheduledMessagePreviews() {
    const chatContainer = document.querySelector('div.copyable-area');
    if (!chatContainer) return;

    chrome.storage.local.get("persistentMessages", (data) => {
        const messages = data.persistentMessages || [];
        const currentChat = document.querySelector('div[data-testid="chat-list"] div[aria-selected="true"]');
        
        if (currentChat) {
            const chatId = currentChat.getAttribute('data-testid');
            const scheduledMessages = messages.filter(msg => msg.chatId === chatId && !msg.enviado);
            
            // Adiciona ou atualiza o ícone de notificação
            let icon = currentChat.querySelector('.chat-scheduled-icon');
            if (!icon) {
                icon = document.createElement('div');
                icon.className = 'chat-scheduled-icon';
                icon.innerHTML = '⏰';
                currentChat.appendChild(icon);
            }
            icon.classList.toggle('visible', scheduledMessages.length > 0);
        }
    });
}

// Atualiza as mensagens a cada segundo
setInterval(updateScheduledMessagePreviews, 1000);

function injectPersistentMessages() {
    updateScheduledMessagePreviews();
    injectSendButton();
}

// Aguarda o carregamento do DOM e tenta injetar as mensagens
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(injectPersistentMessages, 2000);
});

// Função para criar o painel de mensagens agendadas
function createScheduledMessagesPanel() {
    const panel = document.createElement('div');
    panel.className = 'scheduled-messages-container';
    panel.innerHTML = `
        <div class="scheduled-messages-header">
            <span>Mensagens Agendadas</span>
            <div class="header-buttons">
                <button class="clear-button" title="Limpar todas as mensagens">🗑️</button>
                <button class="close-button" title="Fechar">×</button>
            </div>
        </div>
        <div id="scheduled-messages-list"></div>
    `;
    document.body.appendChild(panel);

    // Adiciona o evento de clique no botão de fechar
    const closeButton = panel.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    // Adiciona o evento de clique no botão de limpar
    const clearButton = panel.querySelector('.clear-button');
    clearButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todas as mensagens agendadas?')) {
            chrome.storage.local.set({ persistentMessages: [] }, () => {
                updateScheduledMessagesPanel();
                updateScheduledMessagePreviews();
            });
        }
    });

    // Adiciona o evento de clique no ícone de notificação
    document.addEventListener('click', (e) => {
        if (e.target.closest('.chat-scheduled-icon')) {
            panel.classList.add('open');
        }
    });

    updateScheduledMessagesPanel();
}

// Função para criar o botão flutuante
function createFloatingButton() {
    const button = document.createElement('button');
    button.className = 'floating-expand-button';
    button.innerHTML = '⏰';
    button.title = 'Ver mensagens agendadas';

    // Adiciona o badge para mostrar o número de mensagens
    const badge = document.createElement('div');
    badge.className = 'badge';
    button.appendChild(badge);

    // Atualiza o número de mensagens
    function updateBadge() {
        chrome.storage.local.get('persistentMessages', (data) => {
            const messages = data.persistentMessages || [];
            const pendingMessages = messages.filter(msg => !msg.enviado).length;
            badge.textContent = pendingMessages;
            badge.style.display = pendingMessages > 0 ? 'flex' : 'none';
        });
    }

    // Atualiza o badge a cada segundo
    setInterval(updateBadge, 1000);
    updateBadge();

    // Adiciona o evento de clique
    button.addEventListener('click', () => {
        const panel = document.querySelector('.scheduled-messages-container');
        if (panel) {
            panel.classList.toggle('open');
        }
    });

    document.body.appendChild(button);
}

// Função para atualizar o painel de mensagens agendadas
function updateScheduledMessagesPanel() {
    const list = document.getElementById('scheduled-messages-list');
    if (!list) return;

    chrome.storage.local.get('persistentMessages', (data) => {
        const messages = data.persistentMessages || [];
        list.innerHTML = '';

        messages.forEach((msg) => {
            if (!msg.enviado) {
                const messageElement = document.createElement('div');
                messageElement.className = 'scheduled-message';
                const scheduledDate = new Date(msg.scheduledTime);
                messageElement.innerHTML = `
                    <div class="scheduled-message-header">
                        <span class="chat-name">${msg.chatName || 'Chat desconhecido'}</span>
                    </div>
                    <div class="scheduled-message-content">${msg.mensagem}</div>
                    <div class="scheduled-message-time">
                        Agendado para: ${scheduledDate.toLocaleString('pt-BR')}
                    </div>
                `;
                list.appendChild(messageElement);
            }
        });

        if (messages.length === 0) {
            list.innerHTML = '<div class="scheduled-message">Nenhuma mensagem agendada</div>';
        }
    });
}

// Função para criar o botão de agendamento dentro do chat
function createScheduleButtonInChat() {
    const chatContainer = document.querySelector('div[data-testid="conversation-panel"]');
    if (!chatContainer) return;

    // Verifica se o botão já existe
    if (chatContainer.querySelector('.schedule-button-in-chat')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'schedule-button-in-chat-container';
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.right = '10px';
    buttonContainer.style.top = '10px';
    buttonContainer.style.zIndex = '1000';

    const scheduleButton = document.createElement('button');
    scheduleButton.className = 'schedule-button-in-chat';
    scheduleButton.innerHTML = '⏰';
    scheduleButton.title = 'Agendar mensagem';
    scheduleButton.style.width = '40px';
    scheduleButton.style.height = '40px';
    scheduleButton.style.borderRadius = '50%';
    scheduleButton.style.backgroundColor = '#25D366';
    scheduleButton.style.border = 'none';
    scheduleButton.style.color = 'white';
    scheduleButton.style.fontSize = '20px';
    scheduleButton.style.cursor = 'pointer';
    scheduleButton.style.display = 'flex';
    scheduleButton.style.alignItems = 'center';
    scheduleButton.style.justifyContent = 'center';
    scheduleButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    scheduleButton.addEventListener('click', () => {
        const inputField = document.querySelector('div[data-testid="conversation-compose-box-input"]');
        if (!inputField) return;

        const message = inputField.textContent;
        if (!message) {
            alert('Digite uma mensagem antes de agendar');
            return;
        }

        const scheduledTime = prompt('Digite a data e hora para envio (formato: DD/MM/YYYY HH:mm)');
        if (!scheduledTime) return;

        const [date, time] = scheduledTime.split(' ');
        const [day, month, year] = date.split('/');
        const [hour, minute] = time.split(':');
        
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        
        if (scheduledDate <= new Date()) {
            alert('A data deve ser no futuro');
            return;
        }

        const currentChat = getCurrentChat();
        if (!currentChat) {
            alert('Não foi possível identificar o chat atual');
            return;
        }

        chrome.storage.local.get('persistentMessages', (data) => {
            const messages = data.persistentMessages || [];
            messages.push({
                mensagem: message,
                scheduledTime: scheduledDate.toISOString(),
                enviado: false,
                chatId: currentChat.chatId,
                chatName: currentChat.name
            });
            
            chrome.storage.local.set({ persistentMessages: messages }, () => {
                updateScheduledMessagePreviews();
                inputField.textContent = '';
                alert('Mensagem agendada com sucesso!');
            });
        });
    });

    buttonContainer.appendChild(scheduleButton);
    chatContainer.appendChild(buttonContainer);
}

// Função para observar mudanças no painel de conversa
function observeConversationPanel() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                createScheduleButtonInChat();
            }
        });
    });

    const chatContainer = document.querySelector('div[data-testid="conversation-panel"]');
    if (chatContainer) {
        observer.observe(chatContainer, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    return observer;
}

// Observa mudanças no DOM para adicionar o botão quando possível
const mainObserver = new MutationObserver(() => {
    if (!document.querySelector('.schedule-button')) {
        injectSendButton();
    }
    if (!document.querySelector('.scheduled-messages-container')) {
        createScheduledMessagesPanel();
    }
    if (!document.querySelector('.floating-expand-button')) {
        createFloatingButton();
    }
    if (!document.querySelector('.schedule-button-in-chat')) {
        createScheduleButtonInChat();
    }
    updateScheduledMessagePreviews();
});

// Observa mudanças específicas em elementos do WhatsApp
const whatsAppObservers = [
    observeCurrentChat((currentChat) => {
        updateScheduledMessagePreviews();
    }),
    observeConversationPanel()
];

mainObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Inicialização
injectSendButton();
createScheduledMessagesPanel();
createFloatingButton();
createScheduleButtonInChat();
updateScheduledMessagePreviews();