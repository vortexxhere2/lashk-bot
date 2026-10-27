const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Tryout = require('../models/Tryout');

const stageRoleMap = {
    'Stage 0': '1556017526155120772',
    'Stage 1': '1556017535663480893',
    'Stage 2': '1556017545495052428',
    'Stage 3': '1556017554982441012',
    'Stage 4': '1556017564407046224',
    'Stage 5': '1556017573961793577'
};

const levelRoleMap = {
    'Low': '1556017602206109869',
    'Mid': '1556017593041817720',
    'High': '1556017583222693941'
};

const statusRoleMap = {
    'Strong': '1556017612327227432',
    'Stable': '1556017622318063697',
    'Weak': '1556017632375742607'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tryout-delete')
        .setDescription('Kullanıcının tryout kaydını siler ve üzerindeki ilgili rolleri alır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Kaydı silinecek kullanıcı.')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Etkileşimin durumunu kontrol ederek güvenli şekilde defer et
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply().catch(() => {});
            }

            const targetUser = interaction.options.getUser('kullanici');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            const existingTryout = await Tryout.findOne({ userId: targetUser.id });
            if (!existingTryout) {
                return interaction.editReply({ 
                    content: `❌ **${targetUser.username}** adlı kullanıcıya ait kayıtlı bir tryout sonucu bulunamadı.` 
                });
            }

            // 1. Veritabanından kaydı sil
            await Tryout.deleteOne({ userId: targetUser.id });

            // 2. Kullanıcı sunucudaysa tryout rollerini üzerinden al
            if (targetMember) {
                const allStageIds = Object.values(stageRoleMap);
                const allLevelIds = Object.values(levelRoleMap);
                const allStatusIds = Object.values(statusRoleMap);

                const rolesToRemove = targetMember.roles.cache.filter(r => 
                    allStageIds.includes(r.id) || allLevelIds.includes(r.id) || allStatusIds.includes(r.id)
                );
                
                if (rolesToRemove.size > 0) {
                    await targetMember.roles.remove(rolesToRemove).catch(() => {});
                }
            }

            return interaction.editReply({
                content: `✅ **${targetUser.username}** adlı kullanıcının tryout kaydı veritabanından silindi ve ilgili rolleri üzerinden alındı.`
            });

        } catch (error) {
            console.error('Tryout Delete Hatası:', error);
            if (error.code === 10062) return; // Zaman aşımı hatalarını yut

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: '❌ Silme işlemi sırasında bir hata oluştu.' }).catch(() => {});
                } else {
                    await interaction.reply({ content: '❌ Silme işlemi sırasında bir hata oluştu.', ephemeral: true }).catch(() => {});
                }
            } catch (err) {}
        }
    }
};