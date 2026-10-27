const mongoose = require('mongoose');

const allySchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    owner: { type: String, required: true },
    serverName: { type: String, required: true },
    link: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const allyConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null }
});

const Ally = mongoose.models.Ally || mongoose.model('Ally', allySchema);
const AllyConfig = mongoose.models.AllyConfig || mongoose.model('AllyConfig', allyConfigSchema);

module.exports = {
    Ally,
    AllyConfig
};