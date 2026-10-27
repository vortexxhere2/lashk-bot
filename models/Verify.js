const mongoose = require('mongoose');

// Geçici doğrulama kodlarını tutan şema (10 dakika sonra otomatik silinir)
const pendingVerificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Discord User ID
    robloxUsername: { type: String, required: true },
    robloxId: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } 
});

// Doğrulanmış kullanıcıları tutan şema
const verifiedUserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    robloxUsername: { type: String, required: true },
    robloxId: { type: String, required: true },
    verifiedAt: { type: Date, default: Date.now }
});

module.exports = {
    PendingVerify: mongoose.model('PendingVerify', pendingVerificationSchema),
    VerifiedUser: mongoose.model('VerifiedUser', verifiedUserSchema)
};