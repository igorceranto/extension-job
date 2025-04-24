export function findWhatsAppElement(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

export function observeElementChanges(targetSelector, callback) {
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

export function getChatName(chatId) {
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

export function getCurrentChat() {
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