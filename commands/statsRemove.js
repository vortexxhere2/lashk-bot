const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerStats = require('../models/ServerStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('istatistik-sil')
        .setDescription('Sunucu istatistik kanallarını ve kategorisini siler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const { guild } = interaction;

        try {
            const statsData = await ServerStats.findOne({ guildId: guild.id });
            if (!statsData) {
                return interaction.editReply({ content: 'Server statistics channels are not set up on this server.' });
            }

            // Delete channels if they exist
            const memberChannel = guild.channels.cache.get(statsData.memberChannelId);
            const totalChannel = guild.channels.cache.get(statsData.totalChannelId);
            const voiceChannel = guild.channels.cache.get(statsData.voiceChannelId);
            const category = guild.channels.cache.get(statsData.categoryId);

            if (memberChannel) await memberChannel.delete().catch(() => {});
            if (totalChannel) await totalChannel.delete().catch(() => {});
            if (voiceChannel) await voiceChannel.delete().catch(() => {});
            if (category) await category.delete().catch(() => {});

            // Remove from database
            await ServerStats.deleteOne({ guildId: guild.id });

            return interaction.editReply({ content: 'Successfully deleted server statistics channels and data.' });
        } catch (error) {
            console.error('Stats remove error:', error);
            return interaction.editReply({ content: 'An error occurred while deleting stats channels.' });
        }
    }
};