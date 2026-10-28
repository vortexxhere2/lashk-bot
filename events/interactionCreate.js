const axios = require('axios');
const { PendingVerify, VerifiedUser } = require('../models/Verify');
const { 
    ChannelType, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    AttachmentBuilder 
} = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            // 1. SLASH COMMANDS
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    if (error.code === 10062 || error.code === 40060) return;
                    console.error('Command execution error:', error);

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ An error occurred while executing this command!', ephemeral: true }).catch(() => {});
                    } else {
                        await interaction.reply({ content: '❌ An error occurred while executing this command!', ephemeral: true }).catch(() => {});
                    }
                }
            } 
            
            // 2. SELECT MENU (CATEGORY SELECTION)
            else if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_category_select') {
                    const selectedValue = interaction.values[0];
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_ticket_${selectedValue}`)
                        .setTitle('🎫 Support Request Form');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('ticket_reason')
                        .setLabel('Your Request or Application Reason?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Please explain in detail...')
                        .setRequired(true);

                    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(firstActionRow);

                    await interaction.showModal(modal);
                }
            }

            // 3. MODAL SUBMIT (TICKET & BLACKLIST)
            else if (interaction.isModalSubmit()) {
                
                // A) TICKET MODAL
                if (interaction.customId.startsWith('modal_ticket_')) {
                    await interaction.deferReply({ ephemeral: true });

                    const guild = interaction.guild;
                    const user = interaction.user;
                    const reason = interaction.fields.getTextInputValue('ticket_reason');
                    const categoryType = interaction.customId.replace('modal_ticket_', '');

                    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                    const existingChannel = guild.channels.cache.find(c => c.name === channelName);
                    if (existingChannel) {
                        return interaction.editReply({ content: `❌ You already have an open support request: ${existingChannel}` });
                    }

                    const ticketChannel = await guild.channels.create({
                        name: `ticket-${user.username}`,
                        type: ChannelType.GuildText,
                        parent: '1556018337560141894',
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                            { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                        ]
                    });

                    let categoryTitle = '💬 General Support';
                    if (categoryType === 'cat_apply') categoryTitle = '⚔️ Clan Application';
                    if (categoryType === 'cat_report') categoryTitle = '🚨 Report / Feedback';

                    const ticketEmbed = new EmbedBuilder()
                        .setTitle(`🎫 ${categoryTitle}`)
                        .setColor('#00a2ff')
                        .setDescription(`Welcome <@${user.id}>!\nOur staff will assist you as soon as possible.`)
                        .addFields(
                            { name: '👤 User', value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
                            { name: '📂 Category', value: `\`${categoryTitle}\``, inline: true },
                            { name: '📝 Request Details', value: `\`\`\`${reason}\`\`\``, inline: false },
                            { name: '🛡️ Claimed By', value: '*Not claimed yet*', inline: false }
                        )
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('btn_ticket_claim').setLabel('🖐️ Claim').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('btn_ticket_close').setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
                    );

                    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [actionRow] });
                    return interaction.editReply({ content: `✅ Your support request has been successfully created: ${ticketChannel}` });
                }

                // B) BLACKLIST MODAL
                else if (interaction.customId.startsWith('modal_blacklist_')) {
                    await interaction.deferReply({ ephemeral: true });

                    const targetUserId = interaction.customId.replace('modal_blacklist_', '');
                    const reason = interaction.fields.getTextInputValue('blacklist_reason');
                    const guild = interaction.guild;
                    const moderator = interaction.user;

                    try {
                        const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
                        
                        if (targetMember) {
                            await guild.members.ban(targetUserId, { reason: `Blacklist: ${reason}` }).catch(() => {});
                        }

                        const blacklistChannel = guild.channels.cache.get('1556019007205670972');

                        const logEmbed = new EmbedBuilder()
                            .setTitle('🚫 User Blacklisted')
                            .setColor('#ed4245')
                            .addFields(
                                { name: 'Blacklisted by', value: `${moderator}`, inline: false },
                                { name: 'Offender', value: `<@${targetUserId}>`, inline: false },
                                { name: 'Reason', value: reason, inline: false }
                            )
                            .setTimestamp();

                        if (blacklistChannel) {
                            await blacklistChannel.send({ embeds: [logEmbed] });
                        }

                        return interaction.editReply({ content: `✅ <@${targetUserId}> has been successfully blacklisted and logged!` });

                    } catch (err) {
                        console.error('Blacklist Error:', err);
                        return interaction.editReply({ content: '❌ An error occurred while applying the blacklist!' });
                    }
                }
            }

            // 4. BUTTON INTERACTIONS
            else if (interaction.isButton()) {
                
                // PING / ROLE SELECTION BUTTONS
                if (interaction.customId.startsWith('ping_')) {
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => {});
                    }

                    const roleId = interaction.customId.replace('ping_', '');
                    const bonusRoleId = '1560192220911632445';
                    const member = interaction.member;
                    const guild = interaction.guild;

                    const role = guild.roles.cache.get(roleId);
                    const bonusRole = guild.roles.cache.get(bonusRoleId);

                    if (!role || !bonusRole) {
                        return interaction.editReply({ content: '❌ Ping roles or bonus role could not be found or have been deleted!' });
                    }

                    const allPingRoleIds = [
                        '1556017471302139954',
                        '1556017494760620032',
                        '1556018031744913449',
                        '1556017506030981251',
                        '1556017786411683851',
                        '1556017796050198590',
                        '1556018012778139659',
                        '1556018022248878170'
                    ];

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role).catch(() => {});

                        const hasOtherPingRole = allPingRoleIds.some(id => id !== roleId && member.roles.cache.has(id));

                        if (!hasOtherPingRole) {
                            await member.roles.remove(bonusRole).catch(() => {});
                            return interaction.editReply({ content: `✅ **${role.name}** role removed. Since you have no other ping roles left, the **Notification** role has also been removed from you!` });
                        } else {
                            return interaction.editReply({ content: `✅ **${role.name}** role has been removed! Your Notification role remains active because you still have other ping roles.` });
                        }
                    } else {
                        await member.roles.add(role).catch(() => {});
                        await member.roles.add(bonusRole).catch(() => {});
                        return interaction.editReply({ content: `🎉 **${role.name}** and **Notification** roles successfully added!` });
                    }
                }

                // A) ROBLOX VERIFICATION BUTTON
                else if (interaction.customId === 'btn_verify_check') {
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => {});
                    }

                    const discordUserId = interaction.user.id;
                    const pendingData = await PendingVerify.findOne({ userId: discordUserId });

                    if (!pendingData) {
                        return interaction.editReply({
                            content: '# ❌ EXPIRED OR INVALID ACTION\nNo active verification code found. Please run `/verify` again.'
                        });
                    }

                    const bioRes = await axios.get(`https://users.roblox.com/v1/users/${pendingData.robloxId}`, { timeout: 4000 });
                    const userBio = bioRes.data.description || '';

                    if (userBio.includes(pendingData.code)) {
                        await VerifiedUser.create({
                            userId: discordUserId,
                            robloxUsername: pendingData.robloxUsername,
                            robloxId: pendingData.robloxId
                        });

                        await PendingVerify.deleteOne({ userId: discordUserId });

                        let nicknameUpdated = true;
                        let roleAdded = true;
                        let roleRemoved = true;

                        try {
                            if (interaction.guild.ownerId !== interaction.user.id) {
                                const currentDisplayName = interaction.member.displayName;
                                const robloxTag = ` (@${pendingData.robloxUsername})`;
                                let newNickname = `${currentDisplayName}${robloxTag}`;
                                
                                if (newNickname.length > 32) {
                                    const allowedBaseLength = 32 - robloxTag.length;
                                    if (allowedBaseLength > 0) {
                                        newNickname = `${currentDisplayName.substring(0, allowedBaseLength)}${robloxTag}`;
                                    } else {
                                        newNickname = `@${pendingData.robloxUsername}`.substring(0, 32);
                                    }
                                }
                                await interaction.member.setNickname(newNickname);
                            } else {
                                nicknameUpdated = false;
                            }
                        } catch (err) {
                            nicknameUpdated = false;
                        }

                        const verifiedRole = interaction.guild.roles.cache.get('1563468536033316944');
                        if (verifiedRole) {
                            try { await interaction.member.roles.add(verifiedRole); } catch (err) { roleAdded = false; }
                        } else { roleAdded = false; }

                        const unverifiedRole = interaction.guild.roles.cache.get('1563468570921402429');
                        if (unverifiedRole) {
                            try { await interaction.member.roles.remove(unverifiedRole); } catch (err) { roleRemoved = false; }
                        }

                        return interaction.editReply({
                            content: `# ✅ CONGRATULATIONS! YOUR ACCOUNT IS VERIFIED\n` +
                                     `**Roblox Username:** \`${pendingData.robloxUsername}\`\n` +
                                     `${nicknameUpdated ? '✅ Nickname updated!\n' : ''}` +
                                     `${roleAdded ? '✅ Verified role given!\n' : ''}` +
                                     `${roleRemoved ? '✅ Unverified role removed!' : ''}`
                        });
                    } else {
                        return interaction.editReply({
                            content: '# ❌ CODE NOT FOUND IN BIO\nThe code `' + pendingData.code + '` could not be found in your bio.'
                        });
                    }
                }

                // B) CLAN MATCH / VS JOIN BUTTON
                else if (interaction.customId === 'btn_vs_join') {
                    const message = interaction.message;
                    const oldRow = message.components[0];
                    
                    let currentLabel = oldRow.components[0].data?.label || oldRow.components[0].label || '⚔️ Join (0)';
                    let match = currentLabel.match(/\d+/);
                    let count = match ? parseInt(match[0]) : 0;

                    count += 1;

                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('btn_vs_join')
                            .setLabel(`⚔️ Join (${count})`)
                            .setStyle(ButtonStyle.Success)
                    );

                    await interaction.update({ components: [newRow] });
                    return interaction.followUp({ content: '⚔️ You have successfully joined the clan match!', ephemeral: true });
                }

                // C) TICKET CLAIM
                else if (interaction.customId === 'btn_ticket_claim') {
                    const embed = interaction.message.embeds[0];
                    if (!embed) return interaction.reply({ content: '❌ Embed not found!', ephemeral: true });

                    const updatedEmbed = EmbedBuilder.from(embed);
                    updatedEmbed.spliceFields(3, 1, { name: '🛡️ Claimed By', value: `<@${interaction.user.id}>`, inline: false });

                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('btn_ticket_claimed').setLabel(`🛡️ Claimed: ${interaction.user.username}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new ButtonBuilder().setCustomId('btn_ticket_close').setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
                    );

                    await interaction.update({ embeds: [updatedEmbed], components: [newRow] });
                    return interaction.followUp({ content: `✅ This support ticket has been claimed by <@${interaction.user.id}>!`, ephemeral: false });
                }

                // D) TICKET CLOSE & TRANSCRIPT
                else if (interaction.customId === 'btn_ticket_close') {
                    await interaction.reply({ content: '🔒 Closing ticket, sending transcript to log channel, and deleting channel...' });

                    try {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const sorted = Array.from(messages.values()).reverse();

                        let html = `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <title>Transcript - ${interaction.channel.name}</title>
                            <style>
                                body { background-color: #313338; color: #dbdee1; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
                                .header { background: #2b2d31; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #5865f2; }
                                .message { display: flex; margin-bottom: 15px; background: #2b2d31; padding: 12px; border-radius: 6px; }
                                .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; }
                                .content { flex-grow: 1; }
                                .username { font-weight: bold; color: #fff; }
                                .timestamp { font-size: 11px; color: #949ba4; margin-left: 8px; }
                                .text { color: #dbdee1; word-break: break-word; white-space: pre-wrap; margin-top: 5px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>🎫 LASHK - Support Ticket Transcript</h2>
                                <p><strong>Channel Name:</strong> #${interaction.channel.name}</p>
                                <p><strong>Closed By:</strong> ${interaction.user.tag}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            <div class="chat-log">`;

                        for (const msg of sorted) {
                            const time = new Date(msg.createdTimestamp).toLocaleString();
                            const avatar = msg.author.displayAvatarURL({ extension: 'png', size: 128 });
                            html += `
                                <div class="message">
                                    <img class="avatar" src="${avatar}" alt="Avatar">
                                    <div class="content">
                                        <div>
                                            <span class="username">${msg.author.tag}</span>
                                            <span class="timestamp">${time}</span>
                                        </div>
                                        <div class="text">${msg.content || '[No Content / Embed or File]'}</div>
                                    </div>
                                </div>`;
                        }

                        html += `</div></body></html>`;

                        const buffer = Buffer.from(html, 'utf-8');
                        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.html` });

                        const logChannelId = '1556018720026140732';
                        const logChannel = interaction.guild.channels.cache.get(logChannelId);

                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('🔒 Support Ticket Closed and Archived')
                                .setColor('#e74c3c')
                                .addFields(
                                    { name: '📂 Closed Channel', value: `\`#${interaction.channel.name}\``, inline: true },
                                    { name: '👤 Closed By', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true }
                                )
                                .setTimestamp();

                            await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
                        }

                    } catch (transcriptErr) {
                        console.error('Transcript Log Error:', transcriptErr);
                    }

                    setTimeout(async () => {
                        await interaction.channel.delete().catch(() => {});
                    }, 5000);
                }
            }

        } catch (error) {
            console.error('InteractionCreate General Error:', error);
        }
    }
};