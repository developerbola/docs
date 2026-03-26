const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get all accessible notes (Owned or Collaborated)
router.get("/", auth, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }],
    }).populate("owner", "username email");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes" });
  }
});

// Create note
router.post("/", auth, async (req, res) => {
  try {
    const { title } = req.body;
    const newNote = new Note({ title, owner: req.user.userId });
    await newNote.save();
    res.json(newNote);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating note", error: err.message });
  }
});

// Get single note
router.get("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("owner", "username")
      .populate({ path: "collaborators", select: "username email" })
      .populate({ path: "comments.author", select: "username" });

    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.owner._id.toString() === req.user.userId;
    const isCollaborator = note.collaborators.some(
      (c) => c._id.toString() === req.user.userId,
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Permission denied" });
    }

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error fetching note" });
  }
});

// Delete note
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.owner.toString() !== req.user.userId)
      return res.status(403).json({ message: "Only owners can delete notes" });

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting note" });
  }
});

// Share note (Add collaborator by email/username)
router.post("/:id/share", auth, async (req, res) => {
  try {
    const { identity } = req.body; // email or username
    const userToShare = await User.findOne({
      $or: [{ email: identity }, { username: identity }],
    });
    if (!userToShare)
      return res.status(404).json({ message: "User not found" });

    const note = await Note.findById(req.params.id);
    if (note.owner.toString() !== req.user.userId)
      return res.status(403).json({ message: "Only owners can share" });

    if (!note.collaborators.includes(userToShare._id)) {
      note.collaborators.push(userToShare._id);
      await note.save();
    }
    res.json({
      message: "Note shared successfully",
      collaborator: userToShare.username,
    });
  } catch (err) {
    res.status(500).json({ message: "Error sharing note" });
  }
});

// Add comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.comments.push({ author: req.user.userId, text });
    await note.save();

    const populatedNote = await Note.findById(req.params.id).populate(
      "comments.author",
      "username",
    );
    res.json(populatedNote.comments[populatedNote.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

module.exports = router;
