const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cekilis')
        .setDescription('Yeni bir çekiliş başlatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('odul')
                .setDescription('Çekiliş ödülü nedir?')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('sure')
                .setDescription('Çekiliş süresi (dakika olarak)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('kazanan_sayisi')
                .setDescription('Kaç kişi kazanacak?')
                .setRequired(false)),

    async execute(interaction) {
        const prize = interaction.options.getString('odul');
        const durationMinutes = interaction.options.getInteger('sure');
        const winnerCount = interaction.options.getInteger('kazanan_sayisi') || 1;

        const endTime = Date.now() + durationMinutes * 60 * 1000;
        const participants = new Set();

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle(`🎉 GIVEAWAY: ${prize}`)
            .setDescription(`Click the **Join** button below to participate!\n\n⏱️ **Ends:** <t:${~~(endTime / 1000)}:R>\n👑 **Winner Count:** ${winnerCount}`)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('giveaway_join')
                .setLabel('Join (0)')
                .setEmoji('🎉')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '🎉 Giveaway successfully started!', ephemeral: true });
        const giveawayMsg = await interaction.channel.send({ embeds: [embed], components: [row] });

        const collector = giveawayMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: durationMinutes * 60 * 1000
        });

        collector.on('collect', async i => {
            if (i.customId === 'giveaway_join') {
                if (participants.has(i.user.id)) {
                    return i.reply({ content: 'You have already joined the giveaway!', ephemeral: true });
                }
                participants.add(i.user.id);

                const updatedRow = new ActionRowBuilder().addComponents(
                    ButtonBuilder.from(i.message.components[0].components[0]).setLabel(`Join (${participants.size})`)
                );
                await i.message.edit({ components: [updatedRow] });
                await i.reply({ content: 'Successfully joined the giveaway! Good luck 🍀', ephemeral: true });
            }
        });

        collector.on('end', async () => {
            const participantArray = Array.from(participants);
            if (participantArray.length === 0) {
                return interaction.channel.send(`🎉 The giveaway for **${prize}** has ended, but there were not enough participants.`);
            }

            const winners = [];
            for (let i = 0; i < Math.min(winnerCount, participantArray.length); i++) {
                const randomIndex = Math.floor(Math.random() * participantArray.length);
                winners.push(participantArray.splice(randomIndex, 1)[0]);
            }

            const winnerMentions = winners.map(w => `<@${w}>`).join(', ');
            const endEmbed = EmbedBuilder.from(giveawayMsg.embeds[0])
                .setColor(0x57F287)
                .setDescription(`🎉 **Giveaway Ended!**\n🎁 **Prize:** ${prize}\n👑 **Winners:** ${winnerMentions}`);

            await giveawayMsg.edit({ embeds: [endEmbed], components: [] });
            await interaction.channel.send(`🎉 Congratulations ${winnerMentions}! You won the **${prize}** giveaway!`);
        });
    }
};