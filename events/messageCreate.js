const Level = require('../models/Level');
const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const cooldowns = new Set();
const userHistories = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        if (message.content.includes('@everyone') || message.content.includes('@here')) {
            return;
        }

        const userId = message.author.id;
        const guildId = message.guild.id;
        const cooldownKey = `${guildId}-${userId}`;

        if (!cooldowns.has(cooldownKey)) {
            const xpToAdd = Math.floor(Math.random() * 11) + 15;
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

                    const levelChannelId = '1556018597849997352';
                    const levelChannel = message.guild.channels.cache.get(levelChannelId);
                    if (levelChannel) {
                        levelChannel.send(`Tebrikler <@${userId}>, ${userLevel.level}. Seviye'ye ulaştın.`);
                    }

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
                console.error('Level System Error:', error);
            }
        }

        if (message.mentions.has(message.client.user)) {
            const cleanContent = message.content
                .replace(`<@!${message.client.user.id}>`, '')
                .replace(`<@${message.client.user.id}>`, '')
                .trim();

            if (!cleanContent) {
                return message.reply('Efendim. Dinliyorum.');
            }

            try {
                await message.channel.sendTyping();

                const systemInstruction = "You are a concise, plain, and straightforward AI assistant. Keep all responses short and directly to the point. Never use any emojis. Do not output unnecessary text or overcomplicate answers. Use the context of the user's recent messages to maintain a natural conversation flow.";

                if (!userHistories.has(userId)) {
                    userHistories.set(userId, []);
                }
                const history = userHistories.get(userId);

                history.push({ role: "user", content: cleanContent });

                if (history.length > 10) {
                    history.shift();
                }

                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemInstruction },
                        ...history
                    ],
                    model: "openai/gpt-oss-20b",
                    max_tokens: 500,
                });

                const replyText = completion.choices[0]?.message?.content || "Yanit uretilemedi.";

                history.push({ role: "assistant", content: replyText });

                if (replyText.length > 2000) {
                    return message.reply(replyText.substring(0, 1997) + '...');
                }

                return message.reply(replyText);

            } catch (error) {
                console.error('Groq API Error:', error);
                return message.reply('Hata olustu.');
            }
        }

        const content = message.content
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .trim();

        if (content === 'as' || content === 'a.s.' || content === 'a.s') {
            return;
        }

        const merhabaRegex = /^(mrhb|mrb|mrh|meraba|merhaba|merhabalaar|merhabalar|merheba)$/i;
        if (merhabaRegex.test(content)) {
            return message.reply(`Merhaba, <@${message.author.id}> Hosgeldin.`);
        }

        const selamRegex = /^(slm|selam|selamm|selamlar|slmlar)$/i;
        if (selamRegex.test(content)) {
            return message.reply(`Selam, Hosgeldin <@${message.author.id}>`);
        }

        const saRegex = /^(sa|s\.a\.|selamunaleykum|selamun aleykum|selaminaleykum|selamin aleykum|selamun aleykuum|sa cumleten|sa hoke)$/i;
        if (saRegex.test(content)) {
            return message.reply(`Aleykümselam, Hosgeldin <@${message.author.id}>`);
        }

        const iyiGecelerRegex = /^(iyi geceler|ii geceler|iyi gceler|iyi gcler|ii gckig|iyi geceler herkese|İyi geceler)$/i;
        if (iyiGecelerRegex.test(content)) {
            return message.reply(`Sanada iyigeceler, <@${message.author.id}>`);
        }

        const gunaydinRegex = /^(gunaydin|gunaydın|gnydn|gn3ii|sabahlariyi|iyi sabahlar)$/i;
        if (gunaydinRegex.test(content)) {
            return message.reply(`Günaydın, <@${message.author.id}>`);
        }

        const tunaydinRegex = /^(tunaydin|tunaydın|tnydn)$/i;
        if (tunaydinRegex.test(content)) {
            return message.reply(`Tünaydın, <@${message.author.id}>`);
        }
    },
};