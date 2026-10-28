const { EmbedBuilder } = require('discord.js');
const { Ally, AllyConfig } = require('../models/Ally');

async function generateAllyEmbed(guild) {
    const allies = await Ally.find({ guildId: guild.id });

    const allyEmbed = new EmbedBuilder()
        .setTitle(`LASHK | Ally Servers`)
        .setColor('#2b2d31')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp();

    if (allies.length === 0) {
        allyEmbed.setDescription('*No allies added yet.*');
        return allyEmbed;
    }

    allies.forEach((ally, index) => {
        allyEmbed.addFields({
            name: `${index + 1}. ${ally.serverName}`,
            value: `**Owner:** ${ally.owner}\n**Invite Link:** [${ally.serverName}](${ally.link})`,
            inline: false
        });
    });

    return allyEmbed;
}

async function updateAllyListMessage(guild) {
    const config = await AllyConfig.findOne({ guildId: guild.id });
    if (!config || !config.channelId) return;

    try {
        const channel = await guild.channels.fetch(config.channelId);
        if (!channel) return;

        const embed = await generateAllyEmbed(guild);

        if (config.messageId) {
            try {
                const message = await channel.messages.fetch(config.messageId);
                await message.edit({ embeds: [embed] });
                return;
            } catch (err) {
                // Send a new message if the old one was deleted
            }
        }

        const newMessage = await channel.send({ embeds: [embed] });
        config.messageId = newMessage.id;
        await config.save();
    } catch (error) {
        console.error('Error updating ally list:', error);
    }
}

module.exports = { generateAllyEmbed, updateAllyListMessage };