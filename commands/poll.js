const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Sunucuda anket oluşturur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('soru')
                .setDescription('Anket sorusu')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const question = interaction.options.getString('soru');

        const embed = new EmbedBuilder()
            .setTitle('Server Poll')
            .setColor('#5865F2')
            .setDescription(question)
            .setTimestamp()
            .setFooter({ text: `Poll created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        const pollMessage = await interaction.channel.send({ embeds: [embed] });
        await pollMessage.react('👍');
        await pollMessage.react('👎');

        return interaction.editReply({ content: 'Successfully created the poll.' });
    }
};