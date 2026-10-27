const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandNames = new Set();
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        const name = command.data.name;
        if (commandNames.has(name)) {
            console.error(`⚠️ ÇAKIŞMA UYARISI: "${file}" dosyasındaki "${name}" ismi başka bir dosyada da var!`);
        } else {
            commandNames.add(name);
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🚀 Toplam ${commands.length} adet benzersiz komut Discord'a yükleniyor...`);

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('✅ Bütün komutlar başarıyla yüklendi!');
        process.exit(0);
    } catch (error) {
        console.error('Yükleme Hatası:', error);
        process.exit(1);
    }
})();