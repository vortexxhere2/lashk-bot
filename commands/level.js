const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../models/Level');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Mevcut seviyenizi ve XP durumunuzu gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Seviyesine bakılacak kullanıcı (İsteğe bağlı).')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const guildId = interaction.guild.id;

        const userLevel = await Level.findOne({ userId: targetUser.id, guildId });

        const level = userLevel ? userLevel.level : 0;
        const xp = userLevel ? userLevel.xp : 0;
        const neededXp = (level + 1) * 150;

        // Görsel İlerleme Çubuğu Hesaplama
        const percentage = Math.min(Math.max(xp / neededXp, 0), 1);
        const progressBlocks = Math.round(percentage * 10);
        const emptyBlocks = 10 - progressBlocks;
        const progressBar = '🟩'.repeat(progressBlocks) + '⬛'.repeat(emptyBlocks);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: `${targetUser.username} - Seviye Kartı`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(
                `> 🌟 **Seviye:** \`${level}\`\n` +
                `> ✨ **XP Durumu:** \`${xp} / ${neededXp} XP\`\n\n` +
                `**İlerleme Çubuğu:**\n${progressBar} (%${Math.floor(percentage * 100)})`
            )
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        return interaction.editReply({ embeds: [embed] });
    }
};