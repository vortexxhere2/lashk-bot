const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Yasaklanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('neden')
                .setDescription('Yasaklama nedeni')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('neden') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: 'User not found in the server.', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: 'Cannot ban this user. Check role hierarchy.', ephemeral: true });
        }

        try {
            await member.ban({ reason });
            return interaction.reply({ content: `Successfully banned ${target.tag}. Reason: ${reason}` });
        } catch (error) {
            console.error('Ban error:', error);
            return interaction.reply({ content: 'An error occurred while banning the user.', ephemeral: true });
        }
    }
};