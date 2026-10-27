const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingsetup')
        .setDescription('Ping (rol seçim) panelini belirtilen kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔔 LASHK | PING ROLLERİ MERKEZİ')
            .setColor('#5865f2')
            .setDescription(
                `Sunucudaki etkinliklerden ve duyurulardan anında haberdar olmak için aşağıdaki butonları kullanabilirsin!\n\n` +
                `> ⚔️ **Raids:** Raid pingleri için.\n` +
                `> 📢 **Announcements:** Önemli duyurular için.\n` +
                `> 🎯 **Tryouts:** Denemeler / Tryout duyuruları için.\n` +
                `> 🛡️ **Backup:** Yedek kadro pingleri için.\n` +
                `> 🏆 **Tournament:** Turnuva duyuruları için.\n` +
                `> 🎉 **Events:** Etkinlik duyuruları için.\n` +
                `> 🏋️ **Trainings:** Antrenman duyuruları için.\n` +
                `> ⚔️ **FCW\'s:** Klan maçları (FCW) için.\n\n` +
                `*Rolü almak veya bırakmak için ilgili butona tıklaman yeterlidir.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Ping Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        // 1. Satır Butonlar
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ping_1556017471302139954').setLabel('Raids').setStyle(ButtonStyle.Secondary).setEmoji('⚔️'),
            new ButtonBuilder().setCustomId('ping_1556017494760620032').setLabel('Announcements').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
            new ButtonBuilder().setCustomId('ping_1556018031744913449').setLabel('Tryouts').setStyle(ButtonStyle.Secondary).setEmoji('🎯'),
            new ButtonBuilder().setCustomId('ping_1556017506030981251').setLabel('Backup').setStyle(ButtonStyle.Secondary).setEmoji('🛡️')
        );

        // 2. Satır Butonlar
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ping_1556017786411683851').setLabel('Tournament').setStyle(ButtonStyle.Secondary).setEmoji('🏆'),
            new ButtonBuilder().setCustomId('ping_1556017796050198590').setLabel('Events').setStyle(ButtonStyle.Secondary).setEmoji('🎉'),
            new ButtonBuilder().setCustomId('ping_1556018012778139659').setLabel('Trainings').setStyle(ButtonStyle.Secondary).setEmoji('🏋️'),
            new ButtonBuilder().setCustomId('ping_1556018022248878170').setLabel('FCW\'s').setStyle(ButtonStyle.Secondary).setEmoji('⚔️')
        );

        // Belirttiğin Kanal ID: 1558815903033073685
        const targetChannel = interaction.guild.channels.cache.get('1558815903033073685');

        if (targetChannel) {
            await targetChannel.send({ embeds: [embed], components: [row1, row2] });
            return interaction.editReply({ content: '✅ Ping paneli başarıyla <#1558815903033073685> kanalına kuruldu!' });
        } else {
            return interaction.editReply({ content: '❌ Hedef kanal bulunamadı! Lütfen Kanal ID\'sini kontrol edin.' });
        }
    }
};