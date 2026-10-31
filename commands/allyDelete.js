const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Ally } = require('../models/Ally'); //[cite: 7] Model dosyasının yolu

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ally-sil') // Komut adını kendi sistemine göre güncelleyebilirsin
        .setDescription('Müttefik (ally) kaydını veritabanından siler.')
        .addStringOption(option =>
            option.setName('isim')
                .setDescription('Silinecek müttefik sunucu adı')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const queryName = interaction.options.getString('isim');

        try {
            // Büyük/küçük harf duyarsız (case-insensitive) arama
            const ally = await Ally.findOne({
                guildId: interaction.guild.id,
                serverName: { $regex: new RegExp(`^${queryName}$`, 'i') }
            });

            if (!ally) {
                return interaction.editReply({ content: `❌ Ally named **${queryName}** was not found.` });
            }

            // Kaydı veritabanından sil
            await Ally.deleteOne({ _id: ally._id });

            return interaction.editReply({ content: `✅ Successfully deleted ally: **${ally.serverName}**` });
        } catch (error) {
            console.error('Ally delete error:', error);
            return interaction.editReply({ content: '❌ An error occurred while deleting the ally.' });
        }
    }
};