const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Ally } = require('../models/Ally');
const { generateAllyEmbed, updateAllyListMessage } = require('../utils/allyEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ally')
        .setDescription('Müttefik (Ally) sunucuları yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Yeni bir ally ekler.')
                .addUserOption(option => 
                    option.setName('owner')
                        .setDescription('Sunucu sahibini (Owner) etiketleyin.')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('isim')
                        .setDescription('Sunucu ismini girin.')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('link')
                        .setDescription('Sunucu davet linkini girin.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('Müttefik listesini anlık olarak gösterir.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sil')
                .setDescription('Bir ally listeden siler.')
                .addStringOption(option => 
                    option.setName('isim')
                        .setDescription('Silinecek sunucunun ismi.')
                        .setRequired(true))),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'ekle') {
                const owner = interaction.options.getUser('owner');
                const serverName = interaction.options.getString('isim');
                const link = interaction.options.getString('link');

                await Ally.create({
                    guildId: interaction.guild.id,
                    owner: `<@${owner.id}>`,
                    serverName: serverName,
                    link: link
                });

                await updateAllyListMessage(interaction.guild);

                return interaction.editReply({ 
                    content: `✅ **${serverName}** has been successfully added to the ally list!` 
                });
            }

            if (subcommand === 'sil') {
                const serverName = interaction.options.getString('isim');
                const deleted = await Ally.findOneAndDelete({ 
                    guildId: interaction.guild.id, 
                    serverName: { $regex: new RegExp(`^${serverName}$`, 'i') } 
                });

                if (!deleted) {
                    return interaction.editReply({ 
                        content: `❌ Ally named **${serverName}** was not found.` 
                    });
                }

                await updateAllyListMessage(interaction.guild);

                return interaction.editReply({ 
                    content: `🗑️ **${serverName}** has been removed from the ally list.` 
                });
            }

            if (subcommand === 'liste') {
                const embed = await generateAllyEmbed(interaction.guild);
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Ally command error:', error);
            return interaction.editReply({
                content: '❌ An error occurred during the process!'
            });
        }
    }
};