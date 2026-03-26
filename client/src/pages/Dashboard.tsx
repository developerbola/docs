import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, LogOut, Users, Clock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Document {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { _id: string; username: string };
  collaborators: string[];
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const response = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/document/${response.data._id}`);
    } catch (err) {
      alert('Error creating document');
    }
  };

  const deleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(n => n._id !== id));
    } catch (err) {
      alert('Cannot delete this document');
    }
  };

  const filteredDocuments = documents.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Workspace</h1>
            <p className="text-gray-500 font-medium">Welcome back, <span className="text-primary font-bold">{user?.username}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
                variant="outline"
                onClick={logout}
                className="gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
            <Button 
                onClick={createDocument}
                className="gap-2 font-semibold shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              <span>New Document</span>
            </Button>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
                <Input 
                    type="text"
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white shadow-sm"
                />
            </div>
            <div className="flex gap-4">
                <div className="glass-morphism rounded-2xl p-4 px-6 flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg"><FileText className="w-5 h-5 text-primary" /></div>
                    <div>
                        <div className="text-sm text-gray-500">Total Documents</div>
                        <div className="text-xl font-bold text-foreground">{documents.length}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-gray-200/50 animate-pulse" />)}
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <div
                  key={document._id}
                  onClick={() => navigate(`/document/${document._id}`)}
                  className="glass-morphism p-6 rounded-3xl cursor-pointer group hover:border-primary/50 transition-all bg-white hover:-translate-y-1 duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-gray-100 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <FileText className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>
                    {document.owner._id === user?.id && (
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => deleteDocument(document._id, e)}
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{document.title}</h3>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4" />
                        {new Date(document.updatedAt).toLocaleDateString()}
                    </div>
                    {document.collaborators.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />
                            {document.collaborators.length + 1}
                        </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-8 rounded-full mb-6 text-gray-400">
                <FileText className="w-16 h-16 opacity-30" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-8 max-w-xs font-medium">Start your first collaborative document today and invite your team.</p>
            <Button 
                onClick={createDocument}
                className="px-8 h-14 rounded-2xl font-semibold shadow-lg shadow-primary/20 gap-2"
            >
                <Plus className="w-5 h-5" />
                <span>Create Your First Document</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
