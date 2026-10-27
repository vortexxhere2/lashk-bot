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

        // Veritabanından kullanıcının seviye ve XP bilgilerini çek
        let userLevel = await Level.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
        
        const level = userLevel ? userLevel.level : 0;
        const xp = userLevel ? userLevel.xp : 0;
        const neededXp = (level + 1) * 150;

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${targetUser.username} • Klan Profili`)
            .setColor('#2b2d31')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '⭐ Seviye', value: `\`${level}\``, inline: true },
                { name: '✨ Mevcut XP', value: `\`${xp} / ${neededXp}\``, inline: true },
                { name: '🛡️ En Yüksek Rol', value: member ? member.roles.highest.toString() : 'Bilinmiyor', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Profil Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        await interaction.editReply({ embeds: [embed] });
    }
};