import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  Trash2,
  LogOut,
  Users,
  Clock,
  Search,
  LayoutGrid,
  Info,
  MoreVertical,
  ChevronDown,
  Star,
  Folder,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Document {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { _id: string; username: string; color?: string };
  collaborators: string[];
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (err) {
      console.error("Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const response = await api.post("/documents", {
        title: "Untitled Document",
      });
      navigate(`/document/${response.data._id}`);
    } catch (err) {
      alert("Error creating document");
    }
  };

  const deleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter((n) => n._id !== id));
    } catch (err) {
      alert("Cannot delete this document");
    }
  };

  const filteredDocuments = documents.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124]">
      {/* Header Bar */}
      <header className="h-16 bg-[#F8F9FA] flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors z-10" />
            <Input
              type="text"
              placeholder="Search in Drive"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-full bg-[#EAF1FB] border-none focus:bg-white focus:ring-1 focus:ring-primary shadow-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="w-5 h-5 text-gray-500" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer hover:opacity-90 transition-opacity">
            {user?.username.substring(0, 1)}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Navigation - Simple sidebar for Drive feel */}
        <aside className="w-64 p-4 hidden lg:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <Button
            onClick={createDocument}
            className="w-40 h-14 rounded-2xl bg-white text-[#3C4043] border border-gray-200 hover:shadow-lg transition-shadow flex items-center gap-3 justify-start px-5 mb-6 shadow-sm"
          >
            <Plus className="w-6 h-6 text-primary" />
            <span className="font-medium text-sm">New</span>
          </Button>

          <nav className="space-y-1">
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer transition-colors bg-[#EAF1FB] text-primary font-medium",
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-sm tracking-wide">My Drive</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors text-gray-700">
              <Users className="w-5 h-5" />
              <span className="text-sm tracking-wide">Shared with me</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors text-gray-700">
              <Clock className="w-5 h-5" />
              <span className="text-sm tracking-wide">Recent</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors text-gray-700">
              <Star className="w-5 h-5" />
              <span className="text-sm tracking-wide">Starred</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors text-gray-700">
              <Trash2 className="w-5 h-5" />
              <span className="text-sm tracking-wide">Trash</span>
            </div>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-normal text-[#202124]">
                Welcome to Drive
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Suggested Section */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 cursor-pointer group">
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-800" />
              <h2 className="text-base font-medium text-[#202124]">
                Suggested files
              </h2>
            </div>

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="min-w-[280px] h-48 rounded-xl bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {filteredDocuments.slice(0, 4).map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/document/${doc._id}`)}
                    className="min-w-[280px] bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-[#F1F3F4] transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-10">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-medium truncate">
                        {doc.title}
                      </h3>
                    </div>
                    <div className="text-[11px] text-gray-500 mb-2">
                      You opened •{" "}
                      {new Date(doc.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        {doc.owner.username}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* List/Grid View */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-[13px] font-medium text-gray-600">
              <div className="col-span-6 flex items-center gap-2">Name</div>
              <div className="col-span-3">Reason suggested</div>
              <div className="col-span-2">Location</div>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-full rounded bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/document/${doc._id}`)}
                    className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-[#F1F3F4] cursor-pointer transition-colors group"
                  >
                    <div className="col-span-6 flex items-center gap-4 overflow-hidden">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-800 truncate font-medium">
                        {doc.title}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.collaborators.length > 0 && (
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <Star className="w-3.5 h-3.5 text-gray-400 hover:text-yellow-500 cursor-pointer" />
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-500 truncate">
                      You modified •{" "}
                      {new Date(doc.updatedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        My Drive
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc._id, e);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="p-12 text-center text-gray-500 italic">
                    No files found.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
