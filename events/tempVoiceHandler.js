const { ChannelType, PermissionFlagsBits } = require('discord.js');

// Geçici odaları takip etmek için (Oda ID -> Sahip ID)
const tempRooms = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const guild = newState.guild;

        // Belirttiğin ses kanalına giriş yapıldığında (ID: 1558116546000195594)
        if (newState.channelId === '1558116546000195594') {
            try {
                // Belirttiğin kategori altında açılır (ID: 1556018447085871134)
                const targetCategoryId = '1556018447085871134';

                // Yeni özel kanal oluştur
                const customChannel = await guild.channels.create({
                    name: `✨ ${member.user.username} Odası`,
                    type: ChannelType.GuildVoice,
                    parent: targetCategoryId,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                        },
                        {
                            id: member.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel, 
                                PermissionFlagsBits.Connect, 
                                PermissionFlagsBits.Speak, 
                                PermissionFlagsBits.ManageChannels, 
                                PermissionFlagsBits.MuteMembers, 
                                PermissionFlagsBits.DeafenMembers
                            ],
                        }
                    ]
                });

                // Üyeyi otomatik olarak yeni açtığı odaya taşı
                await member.voice.setChannel(customChannel).catch(() => {});
                tempRooms.set(customChannel.id, member.id);

            } catch (err) {
                console.error('TempVoice Create Error:', err);
            }
        }

        // Boşalan geçici odayı otomatik sil
        if (oldState.channel && tempRooms.has(oldState.channelId)) {
            const channel = oldState.channel;
            if (channel.members.size === 0) {
                tempRooms.delete(channel.id);
                await channel.delete().catch(() => {});
            }
        }
    }
};