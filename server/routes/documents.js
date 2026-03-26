const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get all accessible documents (Owned or Collaborated)
router.get("/", auth, async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }],
    }).populate("owner", "username email color")
      .populate("collaborators", "username color");
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: "Error fetching documents" });
  }
});

// Create document
router.post("/", auth, async (req, res) => {
  try {
    const { title } = req.body;
    const newDocument = new Document({ title, owner: req.user.userId });
    await newDocument.save();
    res.json(newDocument);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating document", error: err.message });
  }
});

// Get single document
router.get("/:id", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("owner", "username color")
      .populate({ path: "collaborators", select: "username email" })
      .populate({ path: "comments.author", select: "username" });

    if (!document) return res.status(404).json({ message: "Document not found" });

    const isOwner = document.owner._id.toString() === req.user.userId;
    const isCollaborator = document.collaborators.some(
      (c) => c._id.toString() === req.user.userId,
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Permission denied" });
    }

    res.json(document);
  } catch (err) {
    res.status(500).json({ message: "Error fetching document" });
  }
});

// Update document details (e.g. title)
router.patch("/:id", auth, async (req, res) => {
    try {
        const { title } = req.body;
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: "Document not found" });

        if (document.owner.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Only owners can rename documents" });
        }

        document.title = title || document.title;
        await document.save();
        res.json(document);
    } catch (err) {
        res.status(500).json({ message: "Error updating document" });
    }
});

// Delete document
router.delete("/:id", auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (document.owner.toString() !== req.user.userId)
      return res.status(403).json({ message: "Only owners can delete documents" });

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting document" });
  }
});

// Share document (Add collaborator by email/username)
router.post("/:id/share", auth, async (req, res) => {
  try {
    const { identity } = req.body; // email or username
    const userToShare = await User.findOne({
      $or: [{ email: identity }, { username: identity }],
    });
    if (!userToShare)
      return res.status(404).json({ message: "User not found" });

    const document = await Document.findById(req.params.id);
    if (document.owner.toString() !== req.user.userId)
      return res.status(403).json({ message: "Only owners can share" });

    if (!document.collaborators.includes(userToShare._id)) {
      document.collaborators.push(userToShare._id);
      await document.save();
    }
    res.json({
      message: "Document shared successfully",
      collaborator: userToShare.username,
    });
  } catch (err) {
    res.status(500).json({ message: "Error sharing document" });
  }
});

// Add comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });

    document.comments.push({ author: req.user.userId, text });
    await document.save();

    const populatedDocument = await Document.findById(req.params.id).populate(
      "comments.author",
      "username",
    );
    res.json(populatedDocument.comments[populatedDocument.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

module.exports = router;
