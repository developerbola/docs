const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const VersionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const NoteSchema = new mongoose.Schema({
  title: { type: String, default: "Untitled Note" },
  content: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  versions: [VersionSchema]
}, { timestamps: true });

// Limit versions to 5 latest
NoteSchema.pre('save', function(next) {
  if (this.versions && this.versions.length > 5) {
    this.versions = this.versions.slice(-5);
  }
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
