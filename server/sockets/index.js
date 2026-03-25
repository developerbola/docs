const Note = require('../models/Note');

module.exports = (io) => {
  const usersInNotes = {}; // { noteId: { userId: username } }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-note', async ({ noteId, userId, username }) => {
      socket.join(noteId);
      
      if (!usersInNotes[noteId]) usersInNotes[noteId] = {};
      usersInNotes[noteId][userId] = { username, socketId: socket.id };
      
      // Update everyone in the room about online users
      io.to(noteId).emit('update-users', Object.values(usersInNotes[noteId]));
      
      console.log(`${username} joined note ${noteId}`);
    });

    socket.on('send-changes', async ({ noteId, content, delta, senderId }) => {
      // Broadcast changes to others in the same note
      socket.to(noteId).emit('receive-changes', { content, delta, senderId });
      
      // Periodically (or on major events) save to DB to ensure persistence
      // For this mini version, we'll update DB on every change (debounced on client side)
      // or at least when we receive changes here.
      try {
        await Note.findByIdAndUpdate(noteId, { content });
      } catch (err) {
        console.error('Error saving changes to DB:', err);
      }
    });

    socket.on('cursor-move', ({ noteId, userId, username, position }) => {
      socket.to(noteId).emit('receive-cursor', { userId, username, position });
    });

    socket.on('save-version', async ({ noteId, userId, content }) => {
        try {
            const note = await Note.findById(noteId);
            if (note) {
                note.versions.push({ content, author: userId });
                if (note.versions.length > 5) note.versions.shift();
                await note.save();
                io.to(noteId).emit('version-saved', { timestamp: new Date(), author: userId });
            }
        } catch (err) {
            console.error('Error saving version:', err);
        }
    });

    socket.on('disconnect', () => {
      // Remove user from all notes they were in
      for (const noteId in usersInNotes) {
        for (const userId in usersInNotes[noteId]) {
          if (usersInNotes[noteId][userId].socketId === socket.id) {
            const username = usersInNotes[noteId][userId].username;
            delete usersInNotes[noteId][userId];
            io.to(noteId).emit('update-users', Object.values(usersInNotes[noteId]));
            console.log(`${username} left note ${noteId}`);
          }
        }
      }
    });
  });
};
