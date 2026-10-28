const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Tryout = require('../models/Tryout');
const { VerifiedUser } = require('../models/Verify');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Sunucudaki en iyi tryout sıralamasını gösterir.'),

    async execute(interaction) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply().catch(() => {});
            }

            const tryouts = await Tryout.find().limit(10);

            if (!tryouts || tryouts.length === 0) {
                return interaction.editReply({ content: '❌ No tryout results recorded yet.' });
            }

            const embedPromises = tryouts.map(async (t, i) => {
                const verified = await VerifiedUser.findOne({ userId: t.userId });
                const robloxUsername = verified ? verified.robloxUsername : 'Unknown';
                const robloxId = verified ? verified.robloxId : null;
                
                let avatarUrl = 'https://www.roblox.com';
                if (robloxId) {
                    try {
                        const avatarRes = await axios.get(
                            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`,
                            { timeout: 3000 }
                        );
                        if (avatarRes.data && avatarRes.data.data && avatarRes.data.data.length > 0) {
                            avatarUrl = avatarRes.data.data[0].imageUrl;
                        }
                    } catch (err) {}
                }

                const rank = i + 1;
                
                return new EmbedBuilder()
                    .setColor('#ed4245')
                    .setTitle(`${rank}-${robloxUsername}`)
                    .setDescription(
                        `| ${robloxUsername} |\n` +
                        `> - ✨ <@${t.userId}> ✨ -\n` +
                        `• Stage: \`${t.stage} ${t.level} ${t.status}\`\n` +
                        `• Clan: \`LASHK\`\n` +
                        `• Status: \`Challengeable\``
                    )
                    .setThumbnail(avatarUrl);
            });

            const embeds = await Promise.all(embedPromises);

            return interaction.editReply({ 
                content: '📌 **LASHK OFFICIAL RANKINGS | TOP LIST**', 
                embeds: embeds 
            });

        } catch (error) {
            console.error('Leaderboard Error:', error);
            if (error.code === 10062) return;

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: '❌ An error occurred while loading the leaderboard.' }).catch(() => {});
                } else {
                    await interaction.reply({ content: '❌ An error occurred while loading the leaderboard.', ephemeral: true }).catch(() => {});
                }
            } catch (err) {}
        }
    }
};