import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { 
    type: String, 
    enum: ['user', 'assistant'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  rawQuery: { 
    type: String // Original user query before enhancement
  },
  enhancedQuery: { 
    type: String // Enhanced query used for embeddings
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  messages: {
    type: [MessageSchema],
    default: []
  },
  inputs: {
    textSnippets: [{
      content: String,
      addedAt: { type: Date, default: Date.now }
    }],
    uploadedUrls: [{
      url: String,
      title: String, // Scraped page title
      addedAt: { type: Date, default: Date.now }
    }],
    uploadedFiles: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      addedAt: { type: Date, default: Date.now }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient user session queries
SessionSchema.index({ userId: 1, createdAt: -1 });
SessionSchema.index({ userId: 1, lastActivityAt: -1 });

// Virtual for total input count
SessionSchema.virtual('totalInputs').get(function() {
  return (this.inputs?.textSnippets?.length || 0) + 
         (this.inputs?.uploadedUrls?.length || 0) + 
         (this.inputs?.uploadedFiles?.length || 0);
});

// Virtual for message count
SessionSchema.virtual('messageCount').get(function() {
  return this.messages?.length || 0;
});

// Pre-save middleware to update lastActivityAt
SessionSchema.pre('save', function(next) {
  if (this.isModified('messages') || this.isModified('inputs')) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Static method to generate unique session ID
SessionSchema.statics.generateSessionId = function() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Static method to generate session name from content
SessionSchema.statics.generateSessionName = function(content) {
  if (!content || typeof content !== 'string') {
    return `Session ${new Date().toLocaleDateString()}`;
  }
  
  // Clean and truncate content for session name
  const cleaned = content
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length <= 50) {
    return cleaned || `Session ${new Date().toLocaleDateString()}`;
  }
  
  return cleaned.substring(0, 47) + '...';
};

// Instance method to add text snippet
SessionSchema.methods.addTextSnippet = function(content) {
  if (!this.inputs) this.inputs = { textSnippets: [], uploadedUrls: [], uploadedFiles: [] };
  if (!this.inputs.textSnippets) this.inputs.textSnippets = [];
  
  this.inputs.textSnippets.push({
    content,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to add URL
SessionSchema.methods.addUrl = function(url, title = '') {
  if (!this.inputs) this.inputs = { textSnippets: [], uploadedUrls: [], uploadedFiles: [] };
  if (!this.inputs.uploadedUrls) this.inputs.uploadedUrls = [];
  
  this.inputs.uploadedUrls.push({
    url,
    title,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to add file
SessionSchema.methods.addFile = function(filename, originalName, mimeType, size) {
  if (!this.inputs) this.inputs = { textSnippets: [], uploadedUrls: [], uploadedFiles: [] };
  if (!this.inputs.uploadedFiles) this.inputs.uploadedFiles = [];
  
  this.inputs.uploadedFiles.push({
    filename,
    originalName,
    mimeType,
    size,
    addedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove file
SessionSchema.methods.removeFile = function(filenameOrOriginalName) {
  if (!this.inputs || !this.inputs.uploadedFiles) return this.save();
  this.inputs.uploadedFiles = this.inputs.uploadedFiles.filter(
    f => f.filename !== filenameOrOriginalName && f.originalName !== filenameOrOriginalName
  );
  return this.save();
};

// Instance method to add a message (user or assistant)
SessionSchema.methods.addMessage = function(sender, content, rawQuery = undefined, enhancedQuery = undefined) {
  if (!this.messages) this.messages = [];
  const msg = { sender, content };
  if (sender === 'user') {
    if (rawQuery !== undefined) msg.rawQuery = rawQuery;
    if (enhancedQuery !== undefined) msg.enhancedQuery = enhancedQuery;
  }
  this.messages.push(msg);
  return this.save();
};

export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
