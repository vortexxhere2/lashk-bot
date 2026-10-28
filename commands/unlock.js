const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Kanalı mesaj gönderimine açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const channel = interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            });

            return interaction.editReply({ content: 'Successfully unlocked this channel.' });
        } catch (error) {
            console.error('Unlock error:', error);
            return interaction.editReply({ content: 'Failed to unlock the channel.' });
        }
    }
};