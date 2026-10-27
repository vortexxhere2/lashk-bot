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
            // 1. SLASH KOMUTLARINI ÇALIŞTIRMA
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    if (error.code === 10062 || error.code === 40060) return;
                    console.error('Komut çalıştırma hatası:', error);

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true }).catch(() => {});
                    } else {
                        await interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu!', ephemeral: true }).catch(() => {});
                    }
                }
            } 
            
            // 2. SELECT MENU (KATEGORİ SEÇİMİ)
            else if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'ticket_category_select') {
                    const selectedValue = interaction.values[0];
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_ticket_${selectedValue}`)
                        .setTitle('🎫 Destek Talep Formu');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('ticket_reason')
                        .setLabel('Talebiniz veya Başvuru Nedeniniz?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Lütfen detaylı şekilde açıklayınız...')
                        .setRequired(true);

                    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(firstActionRow);

                    await interaction.showModal(modal);
                }
            }

            // 3. MODAL SUBMIT (FORM GÖNDERİMİ - TİCKET & BLACKLİST)
            else if (interaction.isModalSubmit()) {
                
                // A) TİCKET AÇMA MODALI
                if (interaction.customId.startsWith('modal_ticket_')) {
                    await interaction.deferReply({ ephemeral: true });

                    const guild = interaction.guild;
                    const user = interaction.user;
                    const reason = interaction.fields.getTextInputValue('ticket_reason');
                    const categoryType = interaction.customId.replace('modal_ticket_', '');

                    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                    const existingChannel = guild.channels.cache.find(c => c.name === channelName);
                    if (existingChannel) {
                        return interaction.editReply({ content: `❌ Zaten açık bir destek talebiniz var: ${existingChannel}` });
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

                    let categoryTitle = '💬 Genel Destek';
                    if (categoryType === 'cat_apply') categoryTitle = '⚔️ Klan Başvurusu';
                    if (categoryType === 'cat_report') categoryTitle = '🚨 Şikayet / Bildirim';

                    const ticketEmbed = new EmbedBuilder()
                        .setTitle(`🎫 ${categoryTitle}`)
                        .setColor('#00a2ff')
                        .setDescription(`Hoş geldin <@${user.id}>!\nYetkililerimiz en kısa sürede seninle ilgilenecektir.`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
                            { name: '📂 Kategori', value: `\`${categoryTitle}\``, inline: true },
                            { name: '📝 Talep Detayı', value: `\`\`\`${reason}\`\`\``, inline: false },
                            { name: '🛡️ Sahiplenen Yetkili', value: '*Henüz yetkili sahiplenmedi*', inline: false }
                        )
                        .setTimestamp();

                    const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('btn_ticket_claim').setLabel('🖐️ Sahiplen').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('btn_ticket_close').setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger)
                    );

                    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [actionRow] });
                    return interaction.editReply({ content: `✅ Destek talebiniz başarıyla oluşturuldu: ${ticketChannel}` });
                }

                // B) BLACKLİST MODALI
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

                        // Blacklist Kanalı ID'si: 1556019007205670972
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

                        return interaction.editReply({ content: `✅ <@${targetUserId}> başarıyla kara listeye alındı ve kanala gönderildi!` });

                    } catch (err) {
                        console.error('Blacklist İşlem Hatası:', err);
                        return interaction.editReply({ content: '❌ Blacklist uygulanırken bir hata oluştu!' });
                    }
                }
            }

            // 4. BUTON TIKLAMALARI
            else if (interaction.isButton()) {
                
                // PİNG / ROL SEÇİM BUTONLARI
                if (interaction.customId.startsWith('ping_')) {
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => {});
                    }

                    const roleId = interaction.customId.replace('ping_', '');
                    const member = interaction.member;
                    const role = interaction.guild.roles.cache.get(roleId);

                    if (!role) {
                        return interaction.editReply({ content: '❌ Bu rol sistemde bulunamadı veya silinmiş!' });
                    }

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role).catch(() => {});
                        return interaction.editReply({ content: `✅ **${role.name}** rolü üzerinizden alındı!` });
                    } else {
                        await member.roles.add(role).catch(() => {});
                        return interaction.editReply({ content: `🎉 **${role.name}** rolü başarıyla verildi!` });
                    }
                }

                // A) ROBLOX DOĞRULAMA BUTONU
                else if (interaction.customId === 'btn_verify_check') {
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => {});
                    }

                    const discordUserId = interaction.user.id;
                    const pendingData = await PendingVerify.findOne({ userId: discordUserId });

                    if (!pendingData) {
                        return interaction.editReply({
                            content: '# ❌ SÜRESİ DOLMUŞ VEYA GEÇERSİZ İŞLEM\nAktif bir doğrulama kodunuz bulunamadı. Lütfen tekrar `/verify` komutunu çalıştırın.'
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
                            content: `# ✅ TEBRİKLER! HESABINIZ DOĞRULANDI\n` +
                                     `**Roblox Adınız:** \`${pendingData.robloxUsername}\`\n` +
                                     `${nicknameUpdated ? '✅ Rumuzunuz güncellendi!\n' : ''}` +
                                     `${roleAdded ? '✅ Verified rolü verildi!\n' : ''}` +
                                     `${roleRemoved ? '✅ Unverified rolü alındı!' : ''}`
                        });
                    } else {
                        return interaction.editReply({
                            content: '# ❌ KOD BİYOGRAFİDE BULUNAMADI\nBiyografinizde `' + pendingData.code + '` kodu tespit edilemedi.'
                        });
                    }
                }

                // B) KLAN MAÇI / VS KATILMA BUTONU
                else if (interaction.customId === 'btn_vs_join') {
                    const message = interaction.message;
                    const oldRow = message.components[0];
                    
                    let currentLabel = oldRow.components[0].data?.label || oldRow.components[0].label || '⚔️ Katıl (0)';
                    let match = currentLabel.match(/\d+/);
                    let count = match ? parseInt(match[0]) : 0;

                    count += 1;

                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('btn_vs_join')
                            .setLabel(`⚔️ Katıl (${count})`)
                            .setStyle(ButtonStyle.Success)
                    );

                    await interaction.update({ components: [newRow] });
                    return interaction.followUp({ content: '⚔️ Klan maçına başarıyla katıldın!', ephemeral: true });
                }

                // C) TİCKET SAHİPLENME (CLAIM)
                else if (interaction.customId === 'btn_ticket_claim') {
                    const embed = interaction.message.embeds[0];
                    if (!embed) return interaction.reply({ content: '❌ Embed bulunamadı!', ephemeral: true });

                    const updatedEmbed = EmbedBuilder.from(embed);
                    updatedEmbed.spliceFields(3, 1, { name: '🛡️ Sahiplenen Yetkili', value: `<@${interaction.user.id}>`, inline: false });

                    const newRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('btn_ticket_claimed').setLabel(`🛡️ Sahiplendi: ${interaction.user.username}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new ButtonBuilder().setCustomId('btn_ticket_close').setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger)
                    );

                    await interaction.update({ embeds: [updatedEmbed], components: [newRow] });
                    return interaction.followUp({ content: `✅ Bu destek talebi <@${interaction.user.id}> tarafından üstlenildi!`, ephemeral: false });
                }

                // D) TİCKET KAPATMA VE LOG KANALINA TRANSKRİPT GÖNDERME
                else if (interaction.customId === 'btn_ticket_close') {
                    await interaction.reply({ content: '🔒 Destek talebi kapatılıyor, transkript log kanalına gönderiliyor ve kanal siliniyor...' });

                    try {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const sorted = Array.from(messages.values()).reverse();

                        let html = `<!DOCTYPE html>
                        <html lang="tr">
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
                                <h2>🎫 LASHK - Destek Talebi Transkripti</h2>
                                <p><strong>Kanal Adı:</strong> #${interaction.channel.name}</p>
                                <p><strong>Talebi Kapatan:</strong> ${interaction.user.tag}</p>
                                <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                            </div>
                            <div class="chat-log">`;

                        for (const msg of sorted) {
                            const time = new Date(msg.createdTimestamp).toLocaleString('tr-TR');
                            const avatar = msg.author.displayAvatarURL({ extension: 'png', size: 128 });
                            html += `
                                <div class="message">
                                    <img class="avatar" src="${avatar}" alt="Avatar">
                                    <div class="content">
                                        <div>
                                            <span class="username">${msg.author.tag}</span>
                                            <span class="timestamp">${time}</span>
                                        </div>
                                        <div class="text">${msg.content || '[İçerik Yok / Embed veya Dosya]'}</div>
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
                                .setTitle('🔒 Destek Talebi Kapatıldı ve Arşivlendi')
                                .setColor('#e74c3c')
                                .addFields(
                                    { name: '📂 Kapatılan Kanal', value: `\`#${interaction.channel.name}\``, inline: true },
                                    { name: '👤 Kapatan Yetkili', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true }
                                )
                                .setTimestamp();

                            await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
                        }

                    } catch (transcriptErr) {
                        console.error('Transcript Log Hatası:', transcriptErr);
                    }

                    setTimeout(async () => {
                        await interaction.channel.delete().catch(() => {});
                    }, 5000);
                }
            }

        } catch (error) {
            console.error('InteractionCreate Genel Hata:', error);
        }
    }
};