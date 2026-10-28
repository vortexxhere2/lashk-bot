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
            .setTitle('🎙️ LASHK | PRIVATE VOICE CENTER')
            .setColor('#5865f2')
            .setDescription(
                `Creating and managing your own private voice channel is very easy!\n\n` +
                `> 🔊 **To Create a Room:** Simply join the **Create Room** channel in the voice channels category. The bot will create a private room for you.\n\n` +
                `*You can use the buttons below for quick actions while you are in your own room.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Private Voice System`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tvoice_lock').setLabel('🔒 Lock').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('tvoice_unlock').setLabel('🔓 Unlock').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('tvoice_hide').setLabel('👁️ Hide').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('tvoice_unhide').setLabel('👁️ Unhide').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('tvoice_limit').setLabel('👥 Limit').setStyle(ButtonStyle.Primary)
        );

        const howToChannel = interaction.guild.channels.cache.get('1558116547644624967');
        if (howToChannel) {
            await howToChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Private voice management panel successfully installed in <#1558116547644624967>!' });
        } else {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.editReply({ content: '✅ Panel installed in this channel (How-to channel not found in cache).' });
        }
    }
};