const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Sunucudan atılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('Atılma nedeni')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('neden') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
        }

        if (!member.kickable) {
            return interaction.reply({ content: 'Cannot kick this user. Check role hierarchy.', ephemeral: true });
        }

        try {
            await member.kick(reason);
            return interaction.reply({ content: `Successfully kicked ${target.tag}. Reason: ${reason}` });
        } catch (error) {
            console.error('Kick error:', error);
            return interaction.reply({ content: 'An error occurred while kicking the user.', ephemeral: true });
        }
    }
};