process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Options, ActivityType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Level = require('./models/Level'); // Veritabanı modeli[cite: 2]

// Seviye Rolleri[cite: 2]
const levelRoles = {
    5: '1556017805759877251',
    10: '1556017815478210741',
    15: '1556017825104011374',
    20: '1556017834629271614',
    25: '1556017845870272512',
    30: '1556017855999377498',
    35: '1556017866015375370',
    40: '1556017876387889152',
    45: '1556017886101905428',
    50: '1556017895618781345'
};

// Render.com için mini Express sunucusu[cite: 2]
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord Bot aktif ve çalışıyor!');
});

app.listen(PORT, () => {
    console.log(`Web sunucusu ${PORT} portunda çalışıyor.`);
});

// Discord Bot İstemcisi ve RAM Tasarruflu Önbellek Yapılandırması [RENDER OPTİMİZASYONU & AUTOMOD][cite: 2]
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Ses kanalı durumları için[cite: 2]
        GatewayIntentBits.AutoModerationExecution // AutoMod rozeti ve olayları için eklenen yetki[cite: 2]
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: 30,     // Kanallarda tutulan mesaj önbelleğini sınırlar[cite: 2]
        PresenceManager: 0,     // Üye durumlarını (aktiviteleri) bellekte tutmayarak büyük RAM tasarrufu sağlar[cite: 2]
        ThreadManager: 10,
        VoiceStateManager: 20
    })
});

// --- KOMUT YÜKLEYİCİ (COMMANDS) ---[cite: 2]
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// --- OLAY (EVENTS) YÜKLEYİCİ ---[cite: 2]
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// --- MONGODB BAĞLANTISI ---[cite: 2]
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB veritabanına başarıyla bağlanıldı!');
    })
    .catch((err) => {
        console.error('❌ MongoDB bağlantı hatası:', err);
    });

// --- 7/24 SES KANALI BAĞLANTI FONKSİYONU ---[cite: 2]
async function connectToVoiceChannel() {
    const channelId = process.env.VOICE_CHANNEL_ID;
    if (!channelId) return;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                connection.destroy();
                connectToVoiceChannel();
            }
        });

        console.log(`🔊 Ses kanalına 7/24 bağlanıldı: ${channel.name}`);
    } catch (error) {
        console.error('Ses kanalına bağlanırken hata oluştu:', error);
    }
}

// --- SES KANALINDAKİLERE XP VERME SİSTEMİ (Her 60 saniyede 4 XP) ---[cite: 2]
function startVoiceXpInterval() {
    setInterval(async () => {
        try {
            for (const [guildId, guild] of client.guilds.cache) {
                const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());
                
                for (const [channelId, channel] of voiceChannels) {
                    const members = channel.members.filter(m => !m.user.bot);
                    
                    for (const [memberId, member] of members) {
                        const xpToAdd = 4; // Ses kanalından dakikada kazanılacak XP[cite: 2]
                        
                        let userLevel = await Level.findOne({ userId: memberId, guildId });
                        if (!userLevel) {
                            userLevel = await Level.create({ userId: memberId, guildId, xp: xpToAdd, level: 0 });
                        } else {
                            userLevel.xp += xpToAdd;
                        }

                        const neededXp = (userLevel.level + 1) * 150;
                        if (userLevel.xp >= neededXp) {
                            userLevel.level += 1;
                            userLevel.xp = 0;
                            await userLevel.save();

                            const levelChannelId = '1556018597849997352';
                            const levelChannel = guild.channels.cache.get(levelChannelId);
                            if (levelChannel) {
                                levelChannel.send(`🎙️ Ses kanalında aktif kalarak seviye atladın <@${memberId}>! Yeni seviyen: **${userLevel.level}** 🎉`);
                            }

                            if (levelRoles[userLevel.level]) {
                                const roleId = levelRoles[userLevel.level];
                                const role = guild.roles.cache.get(roleId);
                                if (role && member) {
                                    await member.roles.add(role).catch(() => {});
                                }
                            }
                        } else {
                            await userLevel.save();
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Ses XP Dağıtım Hatası:', err);
        }
    }, 60000);
}

// --- BOT HAZIR OLDUĞUNDA ---[cite: 2]
client.once('ready', async () => {
    console.log(`Bot aktif: ${client.user.tag}`);

    // Botun durumu (DND) ve aktivitesi[cite: 2]
    client.user.setPresence({
        activities: [{ name: "A bot for LASHK'S community", type: ActivityType.Playing }],
        status: 'dnd'
    });

    connectToVoiceChannel();
    startVoiceXpInterval();
});

client.login(process.env.TOKEN);