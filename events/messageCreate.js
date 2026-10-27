const Level = require('../models/Level');
const { Groq } = require('groq-sdk');

// Groq istemcisini .env içerisindeki anahtar ile başlatıyoruz
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Belirttiğin Seviye Rol Haritası
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

// Spam engellemek için cooldown (60 saniye)
const cooldowns = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Botların kendi mesajlarına veya diğer botlara yanıt vermesini engelle
        if (message.author.bot || !message.guild) return;

        // --- LEVEL SİSTEMİ & XP KODU ---
        const userId = message.author.id;
        const guildId = message.guild.id;
        const cooldownKey = `${guildId}-${userId}`;

        if (!cooldowns.has(cooldownKey)) {
            const xpToAdd = Math.floor(Math.random() * 11) + 15; // 15 ile 25 arası rastgele XP
            try {
                let userLevel = await Level.findOne({ userId, guildId });
                if (!userLevel) {
                    userLevel = await Level.create({ userId, guildId, xp: xpToAdd, level: 0 });
                } else {
                    userLevel.xp += xpToAdd;
                }

                const neededXp = (userLevel.level + 1) * 150;
                if (userLevel.xp >= neededXp) {
                    userLevel.level += 1;
                    userLevel.xp = 0;
                    await userLevel.save();

                    // Seviye atlandığında mesaj gönderilecek kanal (`1556018597849997352`)
                    const levelChannelId = '1556018597849997352';
                    const levelChannel = message.guild.channels.cache.get(levelChannelId);
                    if (levelChannel) {
                        levelChannel.send(`🎉 Tebrikler <@${userId}>, **${userLevel.level}. Seviye**'ye ulaştın!`);
                    }

                    // Otomatik Rol Verme
                    if (levelRoles[userLevel.level]) {
                        const roleId = levelRoles[userLevel.level];
                        const role = message.guild.roles.cache.get(roleId);
                        const member = await message.guild.members.fetch(userId).catch(() => null);
                        if (role && member) {
                            await member.roles.add(role).catch(() => {});
                        }
                    }
                } else {
                    await userLevel.save();
                }

                cooldowns.add(cooldownKey);
                setTimeout(() => cooldowns.delete(cooldownKey), 60000);
            } catch (error) {
                console.error('Level Sistem Hatası:', error);
            }
        }

        // --- GROQ YAPAY ZEKA ETİKET YANITI ---
        if (message.mentions.has(message.client.user)) {
            const cleanContent = message.content
                .replace(`<@!${message.client.user.id}>`, '')
                .replace(`<@${message.client.user.id}>`, '')
                .trim();

            if (!cleanContent) {
                return message.reply('Efendim! Beni etiketledin, seni dinliyorum. Nasıl yardımcı olabilirim? 🤖');
            }

            try {
                await message.channel.sendTyping();

                const systemInstruction = "Sen LASHK klanının Discord botusun. Adın LASHK Bot. Discord, oyunlar ve klan kültürü hakkında bilgilisin. Samimi, yardımsever, bazen oyuncu dilinden anlayan bir tarzda Türkçe yanıtlar ver.";

                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: cleanContent }
                    ],
                    model: "llama-3.3-70b-versatile",
                    max_tokens: 500,
                });

                const replyText = completion.choices[0]?.message?.content || "Şu anda yanıt üretemiyorum, lütfen tekrar dene.";

                if (replyText.length > 2000) {
                    return message.reply(replyText.substring(0, 1997) + '...');
                }

                return message.reply(replyText);

            } catch (error) {
                console.error('Groq API Hatası:', error);
                return message.reply('Yapay zeka beynimde bir hata oluştu, şu an yanıt veremiyorum 😔');
            }
        }

        // --- MEVCUT MESAJ YANITLARI ---
        // Mesajı küçük harfe çevirip Türkçe karakterleri ve ekstra boşlukları düzeltelim
        const content = message.content
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .trim();

        // 1. MERHABA
        const merhabaRegex = /^(mrhb|mrb|mrh|meraba|merhaba|merhabalaar|merhabalar|merheba)$/i;
        if (merhabaRegex.test(content)) {
            return message.reply(`Merhaba, <@${message.author.id}> Hoşgeldin!`);
        }

        // 2. SELAM
        const selamRegex = /^(slm|selam|selamm|selamlar|slmlar)$/i;
        if (selamRegex.test(content)) {
            return message.reply(`Selam, Hoşgeldin <@${message.author.id}>`);
        }

        // 3. SELAMÜN ALEYKÜM
        const saRegex = /^(sa|s\.a\.|as|a\.s\.|selamunaleykum|selamun aleykum|selaminaleykum|selamin aleykum|selamun aleykuum|sa cumleten|sa hoke)$/i;
        if (saRegex.test(content)) {
            return message.reply(`Aleykümselam, Hoşgeldin <@${message.author.id}>`);
        }

        // 4. İYİ GECELER
        const iyiGecelerRegex = /^(iyi geceler|ii geceler|iyi gceler|iyi gcler|ii gckig|iyi geceler herkese|İyi geceler)$/i;
        if (iyiGecelerRegex.test(content)) {
            return message.reply(`Sanada iyigeceler, <@${message.author.id}>`);
        }

        // 5. GÜNAYDIN
        const gunaydinRegex = /^(gunaydin|gunaydın|gnydn|gn3ii|sabahlariyi|iyi sabahlar)$/i;
        if (gunaydinRegex.test(content)) {
            return message.reply(`Günaydın, <@${message.author.id}>`);
        }

        // 6. TÜNAYDIN
        const tunaydinRegex = /^(tunaydin|tunaydın|tnydn)$/i;
        if (tunaydinRegex.test(content)) {
            return message.reply(`Tünaydın, <@${message.author.id}>`);
        }
    },
};