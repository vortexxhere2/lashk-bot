const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Kanalı mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const channel = interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            return interaction.editReply({ content: 'Successfully locked this channel.' });
        } catch (error) {
            console.error('Lock error:', error);
            return interaction.editReply({ content: 'Failed to lock the channel.' });
        }
    }
};