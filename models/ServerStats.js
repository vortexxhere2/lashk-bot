const mongoose = require('mongoose');

const serverStatsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    memberChannelId: { type: String, required: true },
    totalChannelId: { type: String, required: true },
    voiceChannelId: { type: String, required: true }
});

module.exports = mongoose.model('ServerStats', serverStatsSchema);