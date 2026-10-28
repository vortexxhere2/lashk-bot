const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const ServerStats = require('../models/ServerStats');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('istatistik-kur')
        .setDescription('Sunucu istatistik ses kanallarını kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const { guild } = interaction;

        try {
            let statsData = await ServerStats.findOne({ guildId: guild.id });
            if (statsData) {
                return interaction.editReply({ content: 'Server statistics channels are already set up.' });
            }

            const category = await guild.channels.create({
                name: 'SERVER STATS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.Connect],
                    },
                ],
            });

            // Calculate initial counts (excluding bots for members, including total for total)
            const humanCount = guild.members.cache.filter(m => !m.user.bot).size;
            const totalCount = guild.memberCount;
            const voiceCount = guild.guild.members.cache.filter(m => m.voice.channel).size;

            const memberChannel = await guild.channels.create({
                name: `Members: ${humanCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionFlagsBits.Connect] }],
            });

            const totalChannel = await guild.channels.create({
                name: `Total: ${totalCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionFlagsBits.Connect] }],
            });

            const voiceChannel = await guild.channels.create({
                name: `Voice: ${voiceCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [{ id: guild.roles.everyone, deny: [PermissionFlagsBits.Connect] }],
            });

            await ServerStats.create({
                guildId: guild.id,
                categoryId: category.id,
                memberChannelId: memberChannel.id,
                totalChannelId: totalChannel.id,
                voiceChannelId: voiceChannel.id
            });

            return interaction.editReply({ content: 'Successfully set up server statistics channels.' });
        } catch (error) {
            console.error('Stats setup error:', error);
            return interaction.editReply({ content: 'An error occurred while creating stats channels.' });
        }
    }
};