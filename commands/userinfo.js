const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Kullanıcının sunucu içindeki bilgilerini gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Bilgileri gösterilecek kullanıcı')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
        }

        const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString())
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle(`User Information: ${targetUser.tag}`)
            .setColor('#2b2d31')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User ID', value: targetUser.id, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>`, inline: true },
                { name: `Roles (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(', ') : 'None', inline: false }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
