const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Gelişmiş klan destek ve başvuru panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 LASHK | SUPPORT & APPLICATION CENTER')
            .setColor('#2b2d31')
            .setDescription(
                `You can create a support ticket instantly by selecting the appropriate category from the menu below.\n\n` +
                `> 💬 **General Support:** Your questions and general help requests.\n` +
                `> ⚔️ **Clan Application:** Clan join requirements and applications.\n` +
                `> 🚨 **Report / Feedback:** Rule violations or staff complaints.\n\n` +
                `*All your requests are reviewed confidentially by our staff team.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Support System`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('📂 Select a support category...')
            .addOptions([
                {
                    label: 'General Support',
                    description: 'General questions and help requests.',
                    value: 'cat_support',
                    emoji: '💬'
                },
                {
                    label: 'Clan Application',
                    description: 'Application to join LASHK clan.',
                    value: 'cat_apply',
                    emoji: '⚔️'
                },
                {
                    label: 'Report / Feedback',
                    description: 'Rule violations and report submissions.',
                    value: 'cat_report',
                    emoji: '🚨'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Advanced support ticket panel has been successfully installed!' });
    }
};