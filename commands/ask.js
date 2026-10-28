const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Kullanıcının aşk oranını ölçer.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Aşkını ölçmek istediğiniz 1. kişi')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('kullanici2')
                .setDescription('Aşkını ölçmek istediğiniz 2. kişi (İsteğe bağlı)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const user1 = interaction.options.getUser('kullanici');
        const user2 = interaction.options.getUser('kullanici2') || interaction.user;
        
        const percentage = Math.floor(Math.random() * 101); // 0 - 100 arası rastgele

        // Orana göre İngilizce durum metinleri
        let statusText = '';
        if (percentage < 20) {
            statusText = 'No Chance 💔';
        } else if (percentage < 50) {
            statusText = 'Low Chance 📉';
        } else if (percentage < 80) {
            statusText = 'Good Match ✨';
        } else {
            statusText = 'True Love! ❤️‍🔥';
        }

        try {
            // 800x400 boyutlarında şık bir kart oluşturuyoruz
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');

            // Arka plan rengi (Koyu bordo / kırmızı tonları)
            ctx.fillStyle = '#1a0507';
            ctx.fillRect(0, 0, 800, 400);

            // Dıştaki çerçeve kutusu
            ctx.fillStyle = '#4a0e17';
            roundRect(ctx, 30, 30, 740, 340, 20, true, false);

            // İç ana zemin kutusu
            ctx.fillStyle = '#2b060a';
            roundRect(ctx, 45, 45, 710, 310, 15, true, false);

            // Avatarları yükleme ve daire şeklinde çizdirme
            try {
                const avatar1 = await loadImage(user1.displayAvatarURL({ extension: 'png', size: 256 }));
                const avatar2 = await loadImage(user2.displayAvatarURL({ extension: 'png', size: 256 }));

                // 1. Kullanıcı Avatarı (Sol taraf)
                ctx.save();
                ctx.beginPath();
                ctx.arc(175, 200, 90, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar1, 85, 110, 180, 180);
                ctx.restore();

                // 2. Kullanıcı Avatarı (Sağ taraf)
                ctx.save();
                ctx.beginPath();
                ctx.arc(625, 200, 90, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar2, 535, 110, 180, 180);
                ctx.restore();
            } catch (err) {
                console.error('Avatar load error:', err);
            }

            // Ortadaki Yüzde Yazısı
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 52px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${percentage}%`, 400, 185);

            // Ortadaki Durum Metni
            ctx.fillStyle = '#ff6b81';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(statusText, 400, 225);

            // Kullanıcı İsim Etiketleri (Üst Kısımdaki Küçük Kutular)
            ctx.fillStyle = '#1a0507';
            roundRect(ctx, 105, 55, 140, 35, 8, true, false);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            const name1 = user1.username.length > 12 ? user1.username.substring(0, 10) + '..' : user1.username;
            ctx.fillText(name1, 175, 78);

            ctx.fillStyle = '#1a0507';
            roundRect(ctx, 555, 55, 140, 35, 8, true, false);
            ctx.fillStyle = '#ffffff';
            const name2 = user2.username.length > 12 ? user2.username.substring(0, 10) + '..' : user2.username;
            ctx.fillText(name2, 625, 78);

            // Kartı Discord'a göndermek için buffer'a çeviriyoruz
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ship-card.png' });

            await interaction.editReply({
                content: `🔥 **${user1.username}** and **${user2.username}** ship results 🔥`,
                files: [attachment]
            });

        } catch (error) {
            console.error('Canvas Error:', error);
            await interaction.editReply({ content: '❌ An error occurred while generating the ship card!' });
        }
    }
};

// Canvas için yuvarlatılmış dikdörtgen çizen yardımcı fonksiyon
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}