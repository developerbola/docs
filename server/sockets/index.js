const Document = require('../models/Document');

module.exports = (io) => {
  const usersInDocuments = {}; // { documentId: { userId: { username, socketId, userColor } } }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-document', async ({ documentId, userId, username, userColor }) => {
      socket.join(documentId);
      
      if (!usersInDocuments[documentId]) usersInDocuments[documentId] = {};
      usersInDocuments[documentId][userId] = { username, socketId: socket.id, userColor };
      
      // Update everyone in the room about online users
      io.to(documentId).emit('update-users', Object.values(usersInDocuments[documentId]));
      
      console.log(`${username} joined document ${documentId}`);
    });

    // To handle per-character updates gracefully, we'll broadcast instantly 
    // but debounce the database write.
    const dbUpdateQueue = {}; // { documentId: timeout }

    socket.on('send-changes', ({ documentId, content, senderId }) => {
      // Broadcast changes to others in the same document INSTANTLY
      socket.to(documentId).emit('receive-changes', { content, senderId });
      
      // Debounce DB save to once every 2 seconds per document
      if (dbUpdateQueue[documentId]) {
        clearTimeout(dbUpdateQueue[documentId]);
      }

      dbUpdateQueue[documentId] = setTimeout(async () => {
        try {
          await Document.findByIdAndUpdate(documentId, { content });
          io.to(documentId).emit('document-saved');
          delete dbUpdateQueue[documentId];
        } catch (err) {
          console.error('Error saving changes to DB:', err);
        }
      }, 2000);
    });

    socket.on('cursor-move', ({ documentId, userId, username, color, position }) => {
      socket.to(documentId).emit('receive-cursor', { userId, username, color, position });
    });

    socket.on('send-comment', ({ documentId, comment }) => {
      socket.to(documentId).emit('receive-comment', comment);
    });

    socket.on('save-version', async ({ documentId, userId, content }) => {
        try {
            const document = await Document.findById(documentId);
            if (document) {
                document.versions.push({ content, author: userId });
                if (document.versions.length > 5) document.versions.shift();
                await document.save();
                io.to(documentId).emit('version-saved', { timestamp: new Date(), author: userId });
            }
        } catch (err) {
            console.error('Error saving version:', err);
        }
    });

    socket.on('disconnect', () => {
      // Remove user from all documents they were in
      for (const documentId in usersInDocuments) {
        for (const userId in usersInDocuments[documentId]) {
          if (usersInDocuments[documentId][userId].socketId === socket.id) {
            const username = usersInDocuments[documentId][userId].username;
            delete usersInDocuments[documentId][userId];
            io.to(documentId).emit('update-users', Object.values(usersInDocuments[documentId]));
            console.log(`${username} left document ${documentId}`);
          }
        }
      }
    });
  });
};
