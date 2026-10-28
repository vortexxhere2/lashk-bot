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
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply().catch(() => {});
            }

            const targetUser = interaction.options.getUser('kullanici');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            const existingTryout = await Tryout.findOne({ userId: targetUser.id });
            if (!existingTryout) {
                return interaction.editReply({ 
                    content: `❌ No registered tryout result found for **${targetUser.username}**.` 
                });
            }

            await Tryout.deleteOne({ userId: targetUser.id });

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
                content: `✅ Tryout record for **${targetUser.username}** has been deleted from the database and associated roles have been removed.`
            });

        } catch (error) {
            console.error('Tryout Delete Error:', error);
            if (error.code === 10062) return;

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: '❌ An error occurred during the deletion process.' }).catch(() => {});
                } else {
                    await interaction.reply({ content: '❌ An error occurred during the deletion process.', ephemeral: true }).catch(() => {});
                }
            } catch (err) {}
        }
    }
};