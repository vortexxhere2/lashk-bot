const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../models/Level');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Kendi veya başkasının klan profilini ve seviye bilgilerini gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Profili görüntülenmek istenen kullanıcı (isteğe bağlı).')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false });
        }

        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        let userLevel = await Level.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
        
        const level = userLevel ? userLevel.level : 0;
        const xp = userLevel ? userLevel.xp : 0;
        const neededXp = (level + 1) * 150;

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${targetUser.username} • Clan Profile`)
            .setColor('#2b2d31')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '⭐ Level', value: `\`${level}\``, inline: true },
                { name: '✨ Current XP', value: `\`${xp} / ${neededXp}\``, inline: true },
                { name: '🛡️ Highest Role', value: member ? member.roles.highest.toString() : 'Unknown', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Profile System`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        await interaction.editReply({ embeds: [embed] });
    }
};