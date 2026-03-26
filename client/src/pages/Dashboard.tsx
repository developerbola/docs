import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, LogOut, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button } from "@/components/ui/button";

interface Document {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { _id: string; username: string; color?: string };
  collaborators: { _id: string; username: string; color?: string }[];
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
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
        title: "Untitled",
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124]">
      <header className="h-16 bg-[#F8F9FA] flex items-center justify-end px-6 border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="w-5 h-5 text-gray-500" />
          </Button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: user?.color || "#ccc" }}
          >
            {user?.username.substring(0, 1)}
          </div>
        </div>
      </header>

      <div className="flex px-[20%]">
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-normal text-[#202124]">
              Welcome to Docs
            </h1>
            <Button
              onClick={createDocument}
              className="bg-white text-[#3C4043] flex items-center gap-3 justify-start px-5"
            >
              <Plus className="w-6 h-6" />
              <span className="font-medium text-sm">New</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-[13px] font-medium text-gray-600">
              <div className="col-span-6 flex items-center gap-2">Title</div>
              <div className="col-span-3">Shared with</div>
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
                {documents.map((doc) => (
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
                    </div>
                    <div className="col-span-3 flex items-center -space-x-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-gray-100"
                        style={{ backgroundColor: doc.owner.color || "#ccc" }}
                        title={`Owner: ${doc.owner.username}`}
                      >
                        {doc.owner.username.charAt(0).toUpperCase()}
                      </div>
                      {doc.collaborators.slice(0, 3).map((collab) => (
                        <div
                          key={collab._id}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-gray-100"
                          style={{ backgroundColor: collab.color || "#ccc" }}
                          title={collab.username}
                        >
                          {collab.username.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {doc.collaborators.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm ring-1 ring-gray-100">
                          +{doc.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-7 bg-destructive/10 text-destructive shadow-none hover:bg-destructive/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc._id, e);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
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
