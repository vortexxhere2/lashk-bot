const { EmbedBuilder } = require('discord.js');

// Üyelerin ses kanalına giriş zamanlarını tutmak için bellek
const voiceTimestamps = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        try {
            const member = newState.member || oldState.member;
            if (!member || member.user.bot) return;

            const guild = newState.guild;
            const userId = member.id;

            // 1. MEVCUT LOG KANALI SİSTEMİ (Hiç dokunulmadı, aynen korundu)
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    // Odaya Katılma
                    if (!oldState.channelId && newState.channelId) {
                        const embed = new EmbedBuilder()
                            .setColor(0x57F287)
                            .setTitle('🔊 Sese Katıldı')
                            .addFields(
                                { name: '👤 Üye', value: `${member} (\`${member.user.tag}\`)`, inline: true },
                                { name: '📌 Kanal', value: `${newState.channel}`, inline: true }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    // Odadan Ayrılma
                    else if (oldState.channelId && !newState.channelId) {
                        const embed = new EmbedBuilder()
                            .setColor(0xED4245)
                            .setTitle('🔇 Sesten Ayrıldı')
                            .addFields(
                                { name: '👤 Üye', value: `${member} (\`${member.user.tag}\`)`, inline: true },
                                { name: '📌 Ayrıldığı Kanal', value: `${oldState.channel}`, inline: true }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    // Oda Değiştirme
                    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFEE75C)
                            .setTitle('🔀 Ses Kanalı Değiştirdi')
                            .addFields(
                                { name: '👤 Üye', value: `${member} (\`${member.user.tag}\`)`, inline: true },
                                { name: '❌ Eski Kanal', value: `${oldState.channel}`, inline: true },
                                { name: '✅ Yeni Kanal', value: `${newState.channel}`, inline: true }
                            )
                            .setTimestamp();
                        await logChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            }

            // 2. YENİ EKLENEN SAYAÇ VE DM BİLGİLENDİRME SİSTEMİ
            // Sese ilk giriş anını kaydet
            if (!oldState.channelId && newState.channelId) {
                voiceTimestamps.set(userId, {
                    joinTime: Date.now(),
                    channelName: newState.channel.name
                });
            }
            
            // Sesten tamamen çıkış yaptığında süreyi hesapla ve DM gönder
            else if (oldState.channelId && !newState.channelId) {
                const sessionData = voiceTimestamps.get(userId);
                if (!sessionData) return;

                const leaveTime = Date.now();
                const durationMs = leaveTime - sessionData.joinTime;

                // Süreyi saat, dakika, saniye olarak hesapla
                const totalSeconds = Math.floor(durationMs / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                let durationString = '';
                if (hours > 0) durationString += `${hours} saat `;
                if (minutes > 0 || hours > 0) durationString += `${minutes} dakika `;
                durationString += `${seconds} saniye`;

                // Tarih formatları (Türkiye Saati)
                const joinDateStr = new Date(sessionData.joinTime).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
                const leaveDateStr = new Date(leaveTime).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

                // Sunucu Logolu Şık Embed
                const guildIcon = guild.iconURL({ dynamic: true, size: 512 });

                const dmEmbed = new EmbedBuilder()
                    .setTitle(`🎙️ ${guild.name} • Ses Kanalı Özet Raporu`)
                    .setColor('#5865f2')
                    .setDescription(`Ses kanalındaki oturumun sona erdi. İşte detaylı istatistiklerin:`)
                    .addFields(
                        { name: '🔊 Ses Kanalı', value: `\`#${sessionData.channelName}\``, inline: false },
                        { name: '📥 Giriş Zamanı', value: `\`${joinDateStr}\``, inline: true },
                        { name: '📤 Çıkış Zamanı', value: `\`${leaveDateStr}\``, inline: true },
                        { name: '⏱️ Toplam Kalış Süresi', value: `**${durationString}**`, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: `${guild.name} Ses İstatistik Sistemi`, iconURL: guildIcon });

                if (guildIcon) {
                    dmEmbed.setThumbnail(guildIcon);
                }

                // Kullanıcıya özel mesaj gönder (DM kapalıysa hata vermez)
                await member.send({ embeds: [dmEmbed] }).catch(() => {});

                // Bellekten temizle
                voiceTimestamps.delete(userId);
            }

        } catch (error) {
            console.error('VoiceStateUpdate Hatası:', error);
        }
    }
};