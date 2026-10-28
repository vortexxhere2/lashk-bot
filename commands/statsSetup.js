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
            // Check if stats are already set up
            let statsData = await ServerStats.findOne({ guildId: guild.id });
            if (statsData) {
                return interaction.editReply({ content: 'Server statistics channels are already set up.' });
            }

            // Create Stats Category (locked for @everyone)
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

            // Calculate current counts
            const totalMembers = guild.memberCount;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;

            // Create Member Count Channel
            const memberChannel = await guild.channels.create({
                name: `Members: ${totalMembers}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.Connect],
                    },
                ],
            });

            // Create Bot Count Channel
            const botChannel = await guild.channels.create({
                name: `Bots: ${botCount}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.Connect],
                    },
                ],
            });

            // Save settings to Database
            await ServerStats.create({
                guildId: guild.id,
                categoryId: category.id,
                memberChannelId: memberChannel.id,
                botChannelId: botChannel.id
            });

            return interaction.editReply({ content: 'Successfully set up server statistics channels.' });
        } catch (error) {
            console.error('Stats setup error:', error);
            return interaction.editReply({ content: 'An error occurred while creating stats channels.' });
        }
    }
};