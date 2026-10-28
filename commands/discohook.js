const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discohook')
        .setDescription('Discohook üzerinden hazırlanan JSON verisini kanala gönderir.')
        .addStringOption(option =>
            option.setName('json')
                .setDescription('Discohook\'tan kopyaladığınız JSON verisini buraya yapıştırın')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const jsonString = interaction.options.getString('json');

        try {
            const data = JSON.parse(jsonString);

            await interaction.channel.send({
                content: data.content || undefined,
                embeds: data.embeds || [],
                components: data.components || []
            });

            return interaction.editReply({ content: '✅ Discohook content has been successfully sent to the channel!' });

        } catch (err) {
            console.error('Discohook JSON Error:', err);
            return interaction.editReply({ content: '❌ Invalid JSON format! Please make sure you copied the correct JSON data from Discohook.' });
        }
    }
};