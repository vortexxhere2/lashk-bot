const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'autoModerationActionExecution',
    async execute(action) {
        try {
            // Automod bir mesajı engellediğinde veya cezalandırdığında çalışır
            const guild = action.guild;
            const userId = action.userId;
            const matchedKeyword = action.matchedKeyword || 'Bilinmeyen Kural';

            console.log(`⚠️ Automod tetiklendi! Kullanıcı: ${userId}, Kural: ${matchedKeyword}`);

            // İstersen bunu bir log kanalına da gönderebilirsin
        } catch (err) {
            console.error('Automod Event Hatası:', err);
        }
    }
};