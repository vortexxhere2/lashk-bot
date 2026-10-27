const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Tryout = require('../models/Tryout');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tryout')
        .setDescription('Bir kullanıcının kayıtlı tryout sonucunu gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Sonucuna bakılacak kullanıcıyı seçin.')
                .setRequired(true)),

    async execute(interaction) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply();
            }

            const targetUser = interaction.options.getUser('kullanici');
            const tryoutData = await Tryout.findOne({ userId: targetUser.id });

            if (!tryoutData) {
                return interaction.editReply({
                    content: `❌ **${targetUser.username}** adlı kullanıcıya ait kayıtlı bir tryout sonucu bulunamadı.`
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 Tryout Bilgi Kartı')
                .setColor('#00a2ff')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Kullanıcı', value: `${targetUser}`, inline: true },
                    { name: '🏷️ Stage Seviyesi', value: `\`${tryoutData.stage}\``, inline: true },
                    { name: '📈 Performans / Durum', value: `\`${tryoutData.level} ${tryoutData.status}\``, inline: false }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Tryout Sorgu Hatası:', error);
            if (error.code === 10062) return;

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: '❌ Komut işlenirken bir hata oluştu.' }).catch(() => {});
                } else {
                    await interaction.reply({ content: '❌ Komut işlenirken bir hata oluştu.', ephemeral: true }).catch(() => {});
                }
            } catch (err) {}
        }
    }
};