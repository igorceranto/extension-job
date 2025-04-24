export function formatTimeRemaining(date) {
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