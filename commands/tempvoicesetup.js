const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempvoicesetup')
        .setDescription('Özel ses odası yönetim panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎙️ LASHK | ÖZEL SES ODASI MERKEZİ')
            .setColor('#5865f2')
            .setDescription(
                `Kendi özel ses odanızı oluşturmak ve yönetmek çok kolay!\n\n` +
                `> 🔊 **Oda Oluşturmak İçin:** Ses kanallarındaki **Oda Oluştur** kanalına giriş yapmanız yeterlidir. Bot size özel oda açacaktır.\n\n` +
                `*Aşağıdaki butonları kendi odanızdayken hızlı işlem yapmak için kullanabilirsiniz.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Özel Ses Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tvoice_lock').setLabel('🔒 Kilitle').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('tvoice_unlock').setLabel('🔓 Kilidi Aç').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('tvoice_hide').setLabel('👁️ Gizle').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('tvoice_unhide').setLabel('👁️ Göster').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('tvoice_limit').setLabel('👥 Limit').setStyle(ButtonStyle.Primary)
        );

        // Doğrudan belirttiğin How-to kanalına (1558116547644624967) paneli gönderir
        const howToChannel = interaction.guild.channels.cache.get('1558116547644624967');
        if (howToChannel) {
            await howToChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Özel ses yönetim paneli başarıyla <#1558116547644624967> kanalına kuruldu!' });
        } else {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Panel bu kanala kuruldu (How-to kanalı önbellekte bulunamadı).' });
        }
    }
};