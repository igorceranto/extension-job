// Este arquivo é necessário para a extensão funcionar
// Ele é executado em segundo plano e pode ser usado para
// gerenciar eventos da extensão, notificações, etc.

// Gerenciamento do ciclo de vida da extensão
chrome.runtime.onInstalled.addListener(() => {
    console.log('WhatsApp Scheduler instalado com sucesso!');
});

// Limpa o storage quando a extensão é desinstalada
chrome.runtime.onSuspend.addListener(() => {
    chrome.storage.local.clear();
});

// Reconecta quando a extensão é atualizada
chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload();
});

// Gerencia erros de conexão
chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            console.log('Erro de conexão:', chrome.runtime.lastError);
        }
    });
}); 