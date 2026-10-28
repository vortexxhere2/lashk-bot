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
                content: `# ❌ ALREADY VERIFIED ACCOUNT\nYour account is already verified as **${isAlreadyVerified.robloxUsername}**!`
            });
        }

        try {
            const userSearchRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [robloxUsername],
                excludeBannedUsers: true
            });

            if (!userSearchRes.data.data || userSearchRes.data.data.length === 0) {
                return interaction.editReply({
                    content: `# ❌ USER NOT FOUND\nNo Roblox account named **${robloxUsername}** was found!`
                });
            }

            const robloxUser = userSearchRes.data.data[0];
            const robloxId = robloxUser.id;
            const actualRobloxName = robloxUser.name;

            const safeWords = ['apple', 'ball', 'blue', 'cat', 'desk', 'pen', 'tree', 'sea', 'star', 'book', 'game', 'robot'];
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
                .setTitle('🎮 ROBLOX ACCOUNT VERIFICATION')
                .setColor('#00a2ff')
                .setDescription(
                    `# 📌 VERIFICATION STEPS\n\n` +
                    `### 1️⃣ Go to Your Profile:\n` +
                    `🔗 **[Click Here to Open Roblox Profile](https://www.roblox.com/users/${robloxId}/profile)**\n\n` +
                    `### 2️⃣ Paste the Code into Your Bio:\n` +
                    `Add the word code below to your Roblox **About** section:\n\n` +
                    `# \`\`\`${randomCode}\`\`\`\n` +
                    `### 3️⃣ Click the Button:\n` +
                    `Save the code and click the **"Verify"** button below.`
                )
                .setFooter({ text: '⏰ The verification code is valid for 10 minutes.' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_verify_check')
                    .setLabel('✅ VERIFY')
                    .setStyle(ButtonStyle.Success)
            );

            return interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Verify Error:', error);
            if (error.code === 10062 || error.code === 40060) return;
            return interaction.editReply({
                content: '# ❌ ERROR\nAn issue occurred while communicating with the Roblox API.'
            });
        }
    }
};