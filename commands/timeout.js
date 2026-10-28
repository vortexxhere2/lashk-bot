const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Kullanıcıya zaman aşımı (mute) uygular.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Zaman aşımı uygulanacak kullanıcı')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('sure')
                .setDescription('Süre (dakika cinsinden)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('Zaman aşımı nedeni')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const target = interaction.options.getUser('kullanici');
        const durationMinutes = interaction.options.getInteger('sure');
        const reason = interaction.options.getString('neden') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.editReply({ content: 'User not found in the server.' });
        }

        try {
            const durationMs = durationMinutes * 60 * 1000;
            await member.timeout(durationMs, reason);
            return interaction.editReply({ content: `Successfully timed out ${target.tag} for ${durationMinutes} minutes. Reason: ${reason}` });
        } catch (error) {
            console.error('Timeout error:', error);
            return interaction.editReply({ content: 'An error occurred while timing out the user.' });
        }
    }
};