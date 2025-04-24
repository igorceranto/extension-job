import { findWhatsAppElement, getCurrentChat } from '../utils/domUtils';

export function checkAndSendScheduledMessages() {
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

export function scheduleMessage(message, scheduledTime, currentChat) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('persistentMessages', (data) => {
            const messages = data.persistentMessages || [];
            messages.push({
                mensagem: message,
                scheduledTime: scheduledTime.toISOString(),
                enviado: false,
                chatId: currentChat.chatId,
                chatName: currentChat.name
            });
            
            chrome.storage.local.set({ persistentMessages: messages }, () => {
                updateScheduledMessagePreviews();
                resolve();
            });
        });
    });
} 