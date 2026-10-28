const { SlashCommandBuilder } = require('discord.js');

const afkUsers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('AFK moduna geçer.')
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('AFK olma nedeni')
                .setRequired(false)),

    async execute(interaction) {
        const reason = interaction.options.getString('neden') || 'No reason provided';
        
        afkUsers.set(interaction.user.id, {
            reason,
            timestamp: Date.now()
        });

        try {
            if (interaction.member.manageable) {
                const nick = interaction.member.nickname || interaction.user.username;
                if (!nick.startsWith('[AFK]')) {
                    await interaction.member.setNickname(`[AFK] ${nick}`).catch(() => {});
                }
            }
        } catch (e) {}

        return interaction.reply({ content: `You are now AFK. Reason: ${reason}`, ephemeral: true });
    },
    afkUsers
};