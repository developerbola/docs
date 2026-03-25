import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, LogOut, Users, Clock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Note {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { _id: string; username: string };
  collaborators: string[];
}

const Dashboard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
    } catch (err) {
      console.error('Error fetching notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const response = await api.post('/notes', { title: 'Untitled Note' });
      navigate(`/note/${response.data._id}`);
    } catch (err) {
      alert('Error creating note');
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      alert('Cannot delete this note');
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Workspace</h1>
            <p className="text-gray-400">Welcome back, <span className="text-primary font-medium">{user?.username}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="glass-morphism px-5 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
            <button 
              onClick={createNote}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text"
                    placeholder="Search notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
            </div>
            <div className="flex gap-4">
                <div className="glass-morphism rounded-2xl p-4 px-6 flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg"><FileText className="w-5 h-5 text-primary" /></div>
                    <div>
                        <div className="text-sm text-gray-400">Total Notes</div>
                        <div className="text-xl font-bold text-white">{notes.length}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/note/${note._id}`)}
                  className="glass-morphism p-6 rounded-3xl cursor-pointer group hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    {note.owner._id === user?.id && (
                        <button 
                            onClick={(e) => deleteNote(note._id, e)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{note.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 h-12">
                    {note.content || 'Empty note...'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4" />
                        {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                    {note.collaborators.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />
                            {note.collaborators.length + 1}
                        </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white/5 p-8 rounded-full mb-6 text-gray-500">
                <FileText className="w-16 h-16 opacity-20" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No notes yet</h3>
            <p className="text-gray-400 mb-8 max-w-xs">Start your first collaborative document today and invite your team.</p>
            <button 
                onClick={createNote}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
            >
                <Plus className="w-5 h-5" />
                <span>Create Your First Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
