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
        .setName('tryout-edit')
        .setDescription('Kullanıcının mevcut tryout sonucunu ve rollerini günceller.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Sonucu düzenlenecek kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('stage')
                .setDescription('Yeni Stage rolü.')
                .setRequired(true)
                .addChoices(
                    { name: 'Stage 0', value: 'Stage 0' },
                    { name: 'Stage 1', value: 'Stage 1' },
                    { name: 'Stage 2', value: 'Stage 2' },
                    { name: 'Stage 3', value: 'Stage 3' },
                    { name: 'Stage 4', value: 'Stage 4' },
                    { name: 'Stage 5', value: 'Stage 5' }
                ))
        .addStringOption(option =>
            option.setName('seviye')
                .setDescription('Yeni Seviye.')
                .setRequired(true)
                .addChoices(
                    { name: 'Low', value: 'Low' },
                    { name: 'Mid', value: 'Mid' },
                    { name: 'High', value: 'High' }
                ))
        .addStringOption(option =>
            option.setName('durum')
                .setDescription('Yeni Durum.')
                .setRequired(true)
                .addChoices(
                    { name: 'Weak', value: 'Weak' },
                    { name: 'Stable', value: 'Stable' },
                    { name: 'Strong', value: 'Strong' }
                )),

    async execute(interaction) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply();
            }

            const targetUser = interaction.options.getUser('kullanici');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return interaction.editReply({ content: '❌ User not found in the server!' });
            }

            const existingTryout = await Tryout.findOne({ userId: targetUser.id });
            if (!existingTryout) {
                return interaction.editReply({ content: `❌ No registered tryout result found for **${targetUser.username}**. You must create a record first using \`/tryout-results\`.` });
            }

            const selectedStage = interaction.options.getString('stage');
            const selectedLevel = interaction.options.getString('seviye');
            const selectedStatus = interaction.options.getString('durum');

            await Tryout.findOneAndUpdate(
                { userId: targetUser.id },
                { stage: selectedStage, level: selectedLevel, status: selectedStatus }
            );

            const allStageIds = Object.values(stageRoleMap);
            const allLevelIds = Object.values(levelRoleMap);
            const allStatusIds = Object.values(statusRoleMap);

            const rolesToRemove = targetMember.roles.cache.filter(r => 
                allStageIds.includes(r.id) || allLevelIds.includes(r.id) || allStatusIds.includes(r.id)
            );
            if (rolesToRemove.size > 0) {
                await targetMember.roles.remove(rolesToRemove).catch(() => {});
            }

            const newStageRole = interaction.guild.roles.cache.get(stageRoleMap[selectedStage]);
            const newLevelRole = interaction.guild.roles.cache.get(levelRoleMap[selectedLevel]);
            const newStatusRole = interaction.guild.roles.cache.get(statusRoleMap[selectedStatus]);

            let givenNames = [];
            if (newStageRole) { await targetMember.roles.add(newStageRole).catch(() => {}); givenNames.push(newStageRole.name); }
            if (newLevelRole) { await targetMember.roles.add(newLevelRole).catch(() => {}); givenNames.push(newLevelRole.name); }
            if (newStatusRole) { await targetMember.roles.add(newStatusRole).catch(() => {}); givenNames.push(newStatusRole.name); }

            return interaction.editReply({
                content: `✅ Tryout result updated for **${targetUser.username}**!\n📌 New Result: **${selectedStage} ${selectedLevel} ${selectedStatus}**\n🏷️ Updated Roles: **${givenNames.join(', ')}**`
            });

        } catch (error) {
            console.error('Tryout Edit Error:', error);
            if (error.code === 10062) return;

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: '❌ An error occurred during the update.' }).catch(() => {});
                } else {
                    await interaction.reply({ content: '❌ An error occurred during the update.', ephemeral: true }).catch(() => {});
                }
            } catch (err) {}
        }
    }
};