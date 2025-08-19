import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  avatarUrl: { type: String },
  provider: { type: String, default: 'google' },
  providerId: { type: String },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);


