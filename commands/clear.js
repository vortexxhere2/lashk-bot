const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Kanaldan belirtilen miktarda mesajı siler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)),

    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar');

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            return interaction.reply({ content: `Successfully deleted ${deleted.size} messages.`, ephemeral: true });
        } catch (error) {
            console.error('Clear command error:', error);
            return interaction.reply({ content: 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.', ephemeral: true });
        }
    }
};