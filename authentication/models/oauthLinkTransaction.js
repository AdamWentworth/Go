const mongoose = require('../middlewares/mongoose');

const oauthLinkTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['google', 'discord', 'facebook'],
    required: true
  },
  deviceId: { type: String, required: true, maxlength: 128 },
  stateHash: { type: String, required: true, unique: true },
  nonce: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending',
    required: true
  },
  resultHash: { type: String, default: null },
  resultStatus: {
    type: String,
    enum: ['linked', 'link-conflict', 'failed'],
    default: null
  },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null }
}, {
  timestamps: true
});

oauthLinkTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
oauthLinkTransactionSchema.index({ resultHash: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('OAuthLinkTransaction', oauthLinkTransactionSchema);
