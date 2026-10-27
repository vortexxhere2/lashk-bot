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
            // JSON verisini parse et
            const data = JSON.parse(jsonString);

            // Bulunduğu kanala mesajı gönder
            await interaction.channel.send({
                content: data.content || undefined,
                embeds: data.embeds || [],
                components: data.components || []
            });

            return interaction.editReply({ content: '✅ Discohook içeriği başarıyla kanala gönderildi!' });

        } catch (err) {
            console.error('Discohook JSON Hatası:', err);
            return interaction.editReply({ content: '❌ Geçersiz JSON formatı! Lütfen Discohook üzerinden doğru JSON verisini kopyaladığınızdan emin olun.' });
        }
    }
};