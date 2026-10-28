const ServerStats = require('../models/ServerStats');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        setInterval(async () => {
            try {
                const allStats = await ServerStats.find();

                for (const stats of allStats) {
                    const guild = client.guilds.cache.get(stats.guildId);
                    if (!guild) continue;

                    await guild.members.fetch();

                    const humanCount = guild.members.cache.filter(m => !m.user.bot).size;
                    const totalCount = guild.memberCount;
                    const voiceCount = guild.members.cache.filter(m => m.voice && m.voice.channel).size;

                    const memberChannel = guild.channels.cache.get(stats.memberChannelId);
                    if (memberChannel && memberChannel.name !== `Members: ${humanCount}`) {
                        await memberChannel.setName(`Members: ${humanCount}`);
                    }

                    const totalChannel = guild.channels.cache.get(stats.totalChannelId);
                    if (totalChannel && totalChannel.name !== `Total: ${totalCount}`) {
                        await totalChannel.setName(`Total: ${totalCount}`);
                    }

                    const voiceChannel = guild.channels.cache.get(stats.voiceChannelId);
                    if (voiceChannel && voiceChannel.name !== `Voice: ${voiceCount}`) {
                        await voiceChannel.setName(`Voice: ${voiceCount}`);
                    }
                }
            } catch (error) {
                console.error('Error updating server stats channels:', error);
            }
        }, 10 * 60 * 1000);
    },
};