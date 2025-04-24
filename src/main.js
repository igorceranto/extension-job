import { checkAndSendScheduledMessages } from './services/messageService';
import { 
    injectSendButton, 
    createScheduledMessagesPanel, 
    createFloatingButton, 
    updateScheduledMessagePreviews 
} from './components/uiComponents';
import { createChatButton } from './components/chatButton';
import { observeElementChanges } from './utils/domUtils';

// Função para verificar se a extensão está válida
function isExtensionValid() {
    try {
        return chrome.runtime.id !== undefined;
    } catch (e) {
        return false;
    }
}

// Adiciona o CSS ao documento
const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.runtime.getURL('persist.css');
document.head.appendChild(style);

// Inicialização dos componentes
function initializeComponents() {
    if (!isExtensionValid()) return;

    try {
        // Inicializa os componentes principais
        createChatButton();
        createFloatingButton();
        createScheduledMessagesPanel();
    } catch (error) {
        console.error('Erro na inicialização dos componentes:', error);
    }
}

// Verifica mensagens a cada 5 segundos (reduzido de 1 segundo)
const messageInterval = setInterval(() => {
    if (isExtensionValid()) {
        checkAndSendScheduledMessages();
    }
}, 5000);

// Observa mudanças no DOM de forma mais eficiente
const mainObserver = new MutationObserver((mutations) => {
    if (!isExtensionValid()) return;

    // Verifica apenas se houve mudanças relevantes
    const hasRelevantChanges = mutations.some(mutation => {
        return mutation.type === 'childList' && 
               (mutation.target.id === 'main' || 
                mutation.target.getAttribute('data-testid') === 'conversation-panel');
    });

    if (hasRelevantChanges) {
        initializeComponents();
    }
});

// Configuração do observer com opções otimizadas
mainObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false, // Não observa mudanças de atributos
    characterData: false // Não observa mudanças de texto
});

// Inicialização inicial com um pequeno delay
setTimeout(initializeComponents, 1000);

// Limpeza quando a página é descarregada
window.addEventListener('unload', () => {
    mainObserver.disconnect();
    clearInterval(messageInterval);
}); 