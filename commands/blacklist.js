const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Bir kullanıcıyı klan kara listesine (blacklist) alır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Kara listeye eklenecek kullanıcı')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');

        const modal = new ModalBuilder()
            .setCustomId(`modal_blacklist_${targetUser.id}`)
            .setTitle('🚫 Blacklist Procedure');

        const reasonInput = new TextInputBuilder()
            .setCustomId('blacklist_reason')
            .setLabel('What is the reason for blacklist?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Please provide a detailed reason...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};