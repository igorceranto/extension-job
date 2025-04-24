import { getCurrentChat } from '../utils/domUtils';
import { scheduleMessage } from '../services/messageService';

export function injectSendButton() {
    const footer = document.querySelector('footer');
    if (!footer) return;

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

        const currentChat = getCurrentChat();
        if (!currentChat) {
            alert('Não foi possível identificar o chat atual');
            return;
        }

        scheduleMessage(message, scheduledDate, currentChat)
            .then(() => {
                inputField.textContent = '';
                alert('Mensagem agendada com sucesso!');
            });
    });

    const sendButton = footer.querySelector('button[data-testid="send"]');
    if (sendButton) {
        sendButton.parentElement.insertBefore(buttonContainer, sendButton);
        buttonContainer.appendChild(scheduleButton);
    }
}

export function createScheduledMessagesPanel() {
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

    const closeButton = panel.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    const clearButton = panel.querySelector('.clear-button');
    clearButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todas as mensagens agendadas?')) {
            chrome.storage.local.set({ persistentMessages: [] }, () => {
                updateScheduledMessagesPanel();
                updateScheduledMessagePreviews();
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.chat-scheduled-icon')) {
            panel.classList.add('open');
        }
    });

    updateScheduledMessagesPanel();
}

export function createFloatingButton() {
    const button = document.createElement('button');
    button.className = 'floating-expand-button';
    button.innerHTML = '⏰';
    button.title = 'Ver mensagens agendadas';

    const badge = document.createElement('div');
    badge.className = 'badge';
    button.appendChild(badge);

    function updateBadge() {
        chrome.storage.local.get('persistentMessages', (data) => {
            const messages = data.persistentMessages || [];
            const pendingMessages = messages.filter(msg => !msg.enviado).length;
            badge.textContent = pendingMessages;
            badge.style.display = pendingMessages > 0 ? 'flex' : 'none';
        });
    }

    setInterval(updateBadge, 1000);
    updateBadge();

    button.addEventListener('click', () => {
        const panel = document.querySelector('.scheduled-messages-container');
        if (panel) {
            panel.classList.toggle('open');
        }
    });

    document.body.appendChild(button);
}

export function updateScheduledMessagesPanel() {
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

export function updateScheduledMessagePreviews() {
    const chatContainer = document.querySelector('div.copyable-area');
    if (!chatContainer) return;

    chrome.storage.local.get("persistentMessages", (data) => {
        const messages = data.persistentMessages || [];
        const currentChat = document.querySelector('div[data-testid="chat-list"] div[aria-selected="true"]');
        
        if (currentChat) {
            const chatId = currentChat.getAttribute('data-testid');
            const scheduledMessages = messages.filter(msg => msg.chatId === chatId && !msg.enviado);
            
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