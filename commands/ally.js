const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Ally } = require('../models/Ally'); // { Ally } şeklinde süslü parantez içinde olmalı
const { generateAllyEmbed, updateAllyListMessage } = require('../utils/allyEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ally')
        .setDescription('Müttefik (Ally) sunucuları yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Yeni bir müttefik ekler.')
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
                .setDescription('Bir müttefiki listeden siler.')
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
                    content: `✅ **${serverName}** müttefik listesine başarıyla eklendi!` 
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
                        content: `❌ **${serverName}** isimli müttefik bulunamadı.` 
                    });
                }

                await updateAllyListMessage(interaction.guild);

                return interaction.editReply({ 
                    content: `🗑️ **${serverName}** müttefik listesinden silindi.` 
                });
            }

            if (subcommand === 'liste') {
                const embed = await generateAllyEmbed(interaction.guild);
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Ally komut hatası:', error);
            return interaction.editReply({
                content: '❌ İşlem sırasında bir hata oluştu!'
            });
        }
    }
};