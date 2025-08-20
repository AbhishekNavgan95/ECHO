import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const ChatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    datasetId: { type: String, default: 'default', index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

ChatHistorySchema.index({ user: 1, datasetId: 1 }, { unique: true });

export const ChatHistory =
  mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);
