const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının yasaklamasını (ban) kaldırır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('kullanici_id')
                .setDescription('Yasaklaması kaldırılacak kullanıcının ID numarası')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('Yasak kaldırma nedeni')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const userId = interaction.options.getString('kullanici_id');
        const reason = interaction.options.getString('neden') || 'No reason provided';

        try {
            await interaction.guild.members.unban(userId, reason);
            return interaction.editReply({ content: `Successfully unbanned user ID: ${userId}. Reason: ${reason}` });
        } catch (error) {
            console.error('Unban error:', error);
            return interaction.editReply({ content: 'Failed to unban the user. Please check if the ID is correct and the user is banned.' });
        }
    }
};