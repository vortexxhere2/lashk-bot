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
            .setTitle('⚔️ NEW CLAN MATCH / VS ANNOUNCEMENT!')
            .setColor('#e74c3c')
            .setDescription(
                `A clan match/VS has been organized! If you want to participate, you can click the **Join** button below.\n\n` +
                `> 🎯 **Game:** \`${oyun}\`\n` +
                `> 🛡️ **Opponent:** \`${rakip}\`\n` +
                `> 📅 **Date / Time:** \`${tarih}\`\n` +
                `> 👤 **Organizer:** <@${interaction.user.id}>`
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Match Participation System`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_vs_join')
                .setLabel('⚔️ Join (0)')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        await interaction.editReply({ content: '✅ VS announcement and participation button have been successfully created!' });
    }
};