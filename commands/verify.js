const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const axios = require('axios');
const { PendingVerify, VerifiedUser } = require('../models/Verify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Roblox hesabınızı Discord hesabınızla doğrular.')
        .addStringOption(option =>
            option.setName('roblox_kullanici_adi')
                .setDescription('Roblox kullanıcı adınızı girin.')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const robloxUsername = interaction.options.getString('roblox_kullanici_adi');
        const discordUserId = interaction.user.id;

        const isAlreadyVerified = await VerifiedUser.findOne({ userId: discordUserId });
        if (isAlreadyVerified) {
            return interaction.editReply({
                content: `# ❌ ZATEN DOĞRULANMIŞ HESAP\nHesabınız zaten **${isAlreadyVerified.robloxUsername}** olarak doğrulanmış!`
            });
        }

        try {
            const userSearchRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [robloxUsername],
                excludeBannedUsers: true
            });

            if (!userSearchRes.data.data || userSearchRes.data.data.length === 0) {
                return interaction.editReply({
                    content: `# ❌ KULLANICI BULUNAMADI\n**${robloxUsername}** adında bir Roblox hesabı bulunamadı!`
                });
            }

            const robloxUser = userSearchRes.data.data[0];
            const robloxId = robloxUser.id;
            const actualRobloxName = robloxUser.name;

            const safeWords = ['elma', 'top', 'mavi', 'kedi', 'masa', 'kalem', 'agac', 'deniz', 'yildiz', 'kitap', 'oyun', 'robot'];
            const word1 = safeWords[Math.floor(Math.random() * safeWords.length)];
            const word2 = safeWords[Math.floor(Math.random() * safeWords.length)];
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const randomCode = `${word1}-${word2}-${randomNum}`;

            await PendingVerify.findOneAndUpdate(
                { userId: discordUserId },
                { robloxUsername: actualRobloxName, robloxId, code: randomCode },
                { upsert: true, new: true }
            );

            const embed = new EmbedBuilder()
                .setTitle('🎮 ROBLOX HESAP DOĞRULAMA')
                .setColor('#00a2ff')
                .setDescription(
                    `# 📌 DOĞRULAMA ADIMLARI\n\n` +
                    `### 1️⃣ Profilinize Gidin:\n` +
                    `🔗 **[Roblox Profilini Açmak İçin Tıklayın](https://www.roblox.com/users/${robloxId}/profile)**\n\n` +
                    `### 2️⃣ Kodu Biyografinize Yapıştırın:\n` +
                    `Roblox **About (Hakkımda)** kısmına aşağıdaki kelime kodunu ekleyin:\n\n` +
                    `# \`\`\`${randomCode}\`\`\`\n` +
                    `### 3️⃣ Butona Basın:\n` +
                    `Kodu kaydedip aşağıdaki **"Doğrula"** butonuna tıklayın.`
                )
                .setFooter({ text: '⏰ Doğrulama kodu 10 dakika geçerlidir.' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_verify_check')
                    .setLabel('✅ DOĞRULA')
                    .setStyle(ButtonStyle.Success)
            );

            return interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Verify Hatası:', error);
            if (error.code === 10062 || error.code === 40060) return;
            return interaction.editReply({
                content: '# ❌ HATA\nRoblox API ile iletişim kurulurken bir sorun oluştu.'
            });
        }
    }
};