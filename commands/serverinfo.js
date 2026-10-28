const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Sunucu hakkındaki bilgileri ve istatistikleri gösterir.'),

    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Server Information`)
            .setColor('#2b2d31')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Server Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
                { name: 'Boost Level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount} Boosts)`, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};