const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Gelişmiş klan destek ve başvuru panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 LASHK | DESTEK & BAŞVURU MERKEZİ')
            .setColor('#2b2d31')
            .setDescription(
                `Aşağıdaki açılır menüden ihtiyacınıza uygun kategori seçerek anında destek talebi oluşturabilirsiniz.\n\n` +
                `> 💬 **Genel Destek:** Sorularınız ve genel yardım talepleri.\n` +
                `> ⚔️ **Klan Başvurusu:** Klanımıza katılım şartları ve başvurular.\n` +
                `> 🚨 **Şikayet & Bildirim:** Kural ihlali veya yetkili şikayetleri.\n\n` +
                `*Tüm talepleriniz yetkili ekibimiz tarafından gizlilikle incelenir.*`
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} • Destek Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('📂 Bir destek kategorisi seçin...')
            .addOptions([
                {
                    label: 'Genel Destek',
                    description: 'Genel sorular ve yardım talepleri.',
                    value: 'cat_support',
                    emoji: '💬'
                },
                {
                    label: 'Klan Başvurusu',
                    description: 'LASHK klanına katılım başvurusu.',
                    value: 'cat_apply',
                    emoji: '⚔️'
                },
                {
                    label: 'Şikayet / Bildirim',
                    description: 'Kural ihlali ve şikayet bildirimleri.',
                    value: 'cat_report',
                    emoji: '🚨'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Dünya standartlarında gelişmiş Ticket paneli kuruldu!' });
    }
};