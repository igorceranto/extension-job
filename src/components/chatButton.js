import { getCurrentChat } from '../utils/domUtils';
import { scheduleMessage } from '../services/messageService';

// Cache para o botão
let buttonContainer = null;

export function createChatButton() {
    // Se o botão já existe, não cria outro
    if (buttonContainer) return;

    // Procura o contêiner do chat de forma mais específica
    const chatContainer = document.querySelector('#main');
    if (!chatContainer) return;

    buttonContainer = document.createElement('div');
    buttonContainer.className = 'chat-schedule-button-container';

    const scheduleButton = document.createElement('button');
    scheduleButton.className = 'chat-schedule-button';
    scheduleButton.innerHTML = '⏰';
    scheduleButton.title = 'Agendar mensagem';

    // Adiciona o botão ao container
    buttonContainer.appendChild(scheduleButton);
    document.body.appendChild(buttonContainer);

    // Adiciona o evento de clique
    scheduleButton.addEventListener('click', handleScheduleClick);
}

// Função separada para lidar com o clique
function handleScheduleClick() {
    const inputField = document.querySelector('div[data-testid="conversation-compose-box-input"]');
    if (!inputField) return;

    const message = inputField.textContent;
    if (!message) {
        alert('Digite uma mensagem antes de agendar');
        return;
    }

    // Criar um modal personalizado para agendamento
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';

    modal.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #128C7E;">Agendar Mensagem</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #333;">Data e Hora:</label>
            <input type="datetime-local" id="schedule-datetime" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancel-schedule" style="padding: 8px 15px; border: none; border-radius: 4px; background: #ddd; cursor: pointer;">Cancelar</button>
            <button id="confirm-schedule" style="padding: 8px 15px; border: none; border-radius: 4px; background: #00a884; color: white; cursor: pointer;">Agendar</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Adicionar overlay
    const overlay = document.createElement('div');
    overlay.className = 'schedule-overlay';
    document.body.appendChild(overlay);

    // Eventos dos botões
    document.getElementById('cancel-schedule').addEventListener('click', () => {
        modal.remove();
        overlay.remove();
    });

    document.getElementById('confirm-schedule').addEventListener('click', () => {
        const datetimeInput = document.getElementById('schedule-datetime');
        const scheduledDate = new Date(datetimeInput.value);
        
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
                modal.remove();
                overlay.remove();
                alert('Mensagem agendada com sucesso!');
            });
    });
} 