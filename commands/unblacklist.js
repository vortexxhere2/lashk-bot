const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription('Bir kullanıcının klan kara listesini (blacklist) kaldırır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Kara listeden çıkarılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('Unblacklist nedeni nedir?')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('neden');
        const guild = interaction.guild;
        const moderator = interaction.user;

        try {
            await guild.members.unban(targetUser.id, { reason: `Unblacklist: ${reason}` }).catch(() => {});

            // Unblacklist Kanalı ID'si: 1563842674111545415
            const unblacklistChannel = guild.channels.cache.get('1563842674111545415');

            const logEmbed = new EmbedBuilder()
                .setTitle('User Unblacklisted')
                .setColor('#57f287')
                .addFields(
                    { name: 'Unblacklisted by', value: `${moderator}`, inline: false },
                    { name: 'Offender', value: `${targetUser}`, inline: false },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            if (unblacklistChannel) {
                await unblacklistChannel.send({ embeds: [logEmbed] });
            }

            return interaction.editReply({ content: `✅ ${targetUser} başarıyla unblacklist edildi ve kanala gönderildi!` });

        } catch (err) {
            console.error('Unblacklist İşlem Hatası:', err);
            return interaction.editReply({ content: '❌ Unblacklist uygulanırken bir hata oluştu!' });
        }
    }
};