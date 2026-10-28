const ServerStats = require('../models/ServerStats');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        // Server Stats Auto-Updater (Every 10 minutes)
        setInterval(async () => {
            try {
                const allStats = await ServerStats.find();

                for (const stats of allStats) {
                    const guild = client.guilds.cache.get(stats.guildId);
                    if (!guild) continue;

                    // Fetch all members to get fresh count
                    await guild.members.fetch();

                    const totalMembers = guild.memberCount;
                    const botCount = guild.members.cache.filter(m => m.user.bot).size;

                    const memberChannel = guild.channels.cache.get(stats.memberChannelId);
                    if (memberChannel && memberChannel.name !== `Members: ${totalMembers}`) {
                        await memberChannel.setName(`Members: ${totalMembers}`);
                    }

                    const botChannel = guild.channels.cache.get(stats.botChannelId);
                    if (botChannel && botChannel.name !== `Bots: ${botCount}`) {
                        await botChannel.setName(`Bots: ${botCount}`);
                    }
                }
            } catch (error) {
                console.error('Error updating server stats channels:', error);
            }
        }, 10 * 60 * 1000); // 10 minutes interval
    },
};