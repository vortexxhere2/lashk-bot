const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { AllyConfig } = require('../models/Ally');
const { updateAllyListMessage } = require('../utils/allyEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allysetup')
        .setDescription('Canlı müttefik (Ally) listesinin yayınlanacağı kanalı ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Müttefik listesinin gönderileceği kanalı seçin.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('kanal');

        let config = await AllyConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = new AllyConfig({ guildId: interaction.guild.id, channelId: channel.id });
        } else {
            config.channelId = channel.id;
            config.messageId = null;
        }

        await config.save();

        await interaction.editReply({
            content: `✅ Müttefik listesi kanalı ${channel} olarak ayarlandı! Liste mesajı gönderiliyor...`
        });

        await updateAllyListMessage(interaction.guild);
    }
};