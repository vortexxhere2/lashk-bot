const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingsetup')
        .setDescription('Ping (rol seçim) panelini belirtilen kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔔 LASHK | PING ROLES CENTER')
            .setColor('#5865f2')
            .setDescription(
                `You can use the buttons below to instantly stay updated with events and announcements in the server!\n\n` +
                `> ⚔️ **Raids:** For raid pings.\n` +
                `> 📢 **Announcements:** For important announcements.\n` +
                `> 🎯 **Tryouts:** For tryout announcements.\n` +
                `> 🛡️ **Backup:** For backup roster pings.\n` +
                `> 🏆 **Tournament:** For tournament announcements.\n` +
                `> 🎉 **Events:** For event announcements.\n` +
                `> 🏋️ **Trainings:** For training announcements.\n` +
                `> ⚔️ **FCW\'s:** For clan war (FCW) pings.\n\n` +
                `*Simply click the respective button to get or remove the role.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Ping System`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ping_1556017471302139954').setLabel('Raids').setStyle(ButtonStyle.Secondary).setEmoji('⚔️'),
            new ButtonBuilder().setCustomId('ping_1556017494760620032').setLabel('Announcements').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
            new ButtonBuilder().setCustomId('ping_1556018031744913449').setLabel('Tryouts').setStyle(ButtonStyle.Secondary).setEmoji('🎯'),
            new ButtonBuilder().setCustomId('ping_1556017506030981251').setLabel('Backup').setStyle(ButtonStyle.Secondary).setEmoji('🛡️')
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ping_1556017786411683851').setLabel('Tournament').setStyle(ButtonStyle.Secondary).setEmoji('🏆'),
            new ButtonBuilder().setCustomId('ping_1556017796050198590').setLabel('Events').setStyle(ButtonStyle.Secondary).setEmoji('🎉'),
            new ButtonBuilder().setCustomId('ping_1556018012778139659').setLabel('Trainings').setStyle(ButtonStyle.Secondary).setEmoji('🏋️'),
            new ButtonBuilder().setCustomId('ping_1556018022248878170').setLabel('FCW\'s').setStyle(ButtonStyle.Secondary).setEmoji('⚔️')
        );

        const targetChannel = interaction.guild.channels.cache.get('1558815903033073685');

        if (targetChannel) {
            const panelMessage = await targetChannel.send({ embeds: [embed], components: [row1, row2] });
            
            const collector = panelMessage.createMessageComponentCollector();

            collector.on('collect', async i => {
                if (!i.isButton()) return;
                if (!i.customId.startsWith('ping_')) return;

                const roleId = i.customId.replace('ping_', '');
                const member = i.member;
                const guild = i.guild;

                const bonusRoleId = '1560192220911632445';

                const targetRole = guild.roles.cache.get(roleId);
                const bonusRole = guild.roles.cache.get(bonusRoleId);

                if (!targetRole || !bonusRole) {
                    return i.reply({ content: '❌ Roles could not be found in the system.', ephemeral: true });
                }

                try {
                    await i.deferReply({ ephemeral: true });

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(targetRole);
                        await member.roles.remove(bonusRole).catch(() => {});
                        await i.editReply({ content: `❌ **${targetRole.name}** and **Notification** roles have been removed from you.` });
                    } else {
                        await member.roles.add(targetRole);
                        await member.roles.add(bonusRole).catch(() => {});
                        await i.editReply({ content: `✅ **${targetRole.name}** and **Notification** roles have been successfully added!` });
                    }
                } catch (error) {
                    console.error('Role assignment error:', error);
                    if (!i.replied && !i.deferred) {
                        await i.reply({ content: '❌ An error occurred while updating roles.', ephemeral: true }).catch(() => {});
                    } else {
                        await i.editReply({ content: '❌ An error occurred while updating roles.' }).catch(() => {});
                    }
                }
            });

            return interaction.editReply({ content: '✅ Ping panel successfully installed in <#1558815903033073685>!' });
        } else {
            return interaction.editReply({ content: '❌ Target channel not found! Please check the Channel ID.' });
        }
    }
};