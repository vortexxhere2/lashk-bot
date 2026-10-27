const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vs')
        .setDescription('Klan maçı veya VS duyurusu yapar ve katılım butonu oluşturur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('rakip')
                .setDescription('Rakip klan veya takım adı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tarih')
                .setDescription('Maç tarihi ve saati (Örn: Bugün 21:00)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('oyun')
                .setDescription('Oynanacak oyun (Örn: Valorant / CS2)')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const rakip = interaction.options.getString('rakip');
        const tarih = interaction.options.getString('tarih');
        const oyun = interaction.options.getString('oyun');

        const embed = new EmbedBuilder()
            .setTitle('⚔️ YENİ KLAN MAÇI / VS DUYURUSU!')
            .setColor('#e74c3c')
            .setDescription(
                `Bir klan maçı/VS organize edildi! Katılmak istiyorsan aşağıdaki **Katıl** butonuna basabilirsin.\n\n` +
                `> 🎯 **Oyun:** \`${oyun}\`\n` +
                `> 🛡️ **Rakip:** \`${rakip}\`\n` +
                `> 📅 **Tarih / Saat:** \`${tarih}\`\n` +
                `> 👤 **Yetkili:** <@${interaction.user.id}>`
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Maç Katılım Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_vs_join')
                .setLabel('⚔️ Katıl (0)')
                .setStyle(ButtonStyle.Success)
        );

        // Duyuruyu komutun çalıştırıldığı kanala gönderir
        await interaction.channel.send({ embeds: [embed], components: [row] });

        await interaction.editReply({ content: '✅ VS duyurusu ve katılım butonu başarıyla oluşturuldu!' });
    }
};