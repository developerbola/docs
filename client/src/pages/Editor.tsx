import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  MessageSquare,
  History as HistoryIcon,
  Share2,
  ChevronRight,
  Send,
  Clock,
  Check,
  X,
  Plus,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import debounce from "lodash/debounce";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collaborator {
  userId: string;
  username: string;
  socketId: string;
  email: string;
  color?: string;
}

interface Cursor {
  userId: string;
  username: string;
  color: string;
  position: { top: number; left: number };
}

const Editor: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Untitled Document");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [shareInput, setShareInput] = useState("");
  const [shareStatus, setShareStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [shareError, setShareError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Collaborator[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});

  const socketRef = useRef<Socket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log("Emitting changes:", html.substring(0, 20) + "...");
      debouncedEmit(html);
    },
    onSelectionUpdate: ({ editor }) => {
      updateCursor(editor);
    },
  });

  useEffect(() => {
    if (!documentId || !user || !editor) return;

    fetchDocument();
    console.log("Connecting socket for user:", user.username);
    
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5001",
    );
    socketRef.current = socket;

    socket.emit("join-document", {
      documentId,
      userId: user.id,
      username: user.username,
      userColor: user.color,
    });

    socket.on("receive-changes", ({ content: newContent }) => {
      if (newContent !== editor.getHTML()) {
        const { from, to } = editor.state.selection;
        const isFocused = editor.isFocused;

        editor.commands.setContent(newContent, { emitUpdate: false });
        
        if (isFocused) {
          const maxPos = editor.state.doc.content.size;
          editor.commands.setTextSelection({ 
            from: Math.min(from, maxPos), 
            to: Math.min(to, maxPos) 
          });
        }
      }
    });

    socket.on("update-users", (users) => {
      setOnlineUsers(users);
      
      // Cleanup cursors for users who are no longer online
      const onlineUserIds = users.map((u: Collaborator) => u.userId);
      setCursors(prev => {
        const next = { ...prev };
        let changed = false;
        for (const userId in next) {
          if (!onlineUserIds.includes(userId)) {
            delete next[userId];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    socket.on("receive-cursor", (cursorData: any) => {
      setCursors((prev) => ({
        ...prev,
        [cursorData.userId]: cursorData,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, user?.id, editor]);

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      // ALWAYS set content if the editor seems to be in its initial state or significantly different
      if (editor && (editor.isEmpty || editor.getHTML() === "<p></p>")) {
          editor.commands.setContent(response.data.content, { emitUpdate: false });
      }
      setTitle(response.data.title);
      setComments(response.data.comments || []);
      setHistory(response.data.versions || []);
      setCollaborators(response.data.collaborators || []);
    } catch (err) {
      navigate("/");
    }
  };

  const debouncedEmit = useMemo(
    () =>
      debounce((newContent: string) => {
        socketRef.current?.emit("send-changes", {
          documentId,
          content: newContent,
          senderId: user?.id,
        });
      }, 500),
    [documentId, user?.id],
  );



  const updateCursor = (editorInstance: any) => {
    if (!editorInstance || !user) return;
    
    // In TipTap/ProseMirror, getting coords is slightly different
    // For now we'll send a signal or just simplify
    const { selection } = editorInstance.state;
    const position = editorInstance.view.coordsAtPos(selection.from);
    const editorBounds = editorInstance.view.dom.getBoundingClientRect();

    socketRef.current?.emit("cursor-move", {
      documentId,
      userId: user.id,
      username: user.username,
      color: user.color,
      position: { 
        top: position.top - editorBounds.top,
        left: position.left - editorBounds.left
      }
    });
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareInput.trim()) return;
    setShareStatus("loading");
    setShareError("");
    try {
      await api.post(`/documents/${documentId}/share`, { identity: shareInput });
      setShareStatus("success");
      setShareInput("");
      fetchDocument();
      setTimeout(() => setShareStatus("idle"), 3000);
    } catch (err: any) {
      setShareStatus("error");
      setShareError(err.response?.data?.message || "Failed to share document");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      const response = await api.post(`/documents/${documentId}/comment`, {
        text: commentInput,
      });
      setComments([...comments, response.data]);
      setCommentInput("");
    } catch (err) {
      console.error("Error adding comment");
    }
  };

  const saveVersion = () => {
    if (!editor) return;
    socketRef.current?.emit("save-version", {
      documentId,
      userId: user?.id,
      content: editor.getHTML(),
    });
    alert("Version saved!");
    fetchDocument();
  };

  const handleTitleBlur = async () => {
    try {
      await api.patch(`/documents/${documentId}`, { title });
    } catch (err) {
      console.error("Failed to save title");
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-foreground" />
            </button>
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="bg-transparent text-lg font-bold border-none focus:outline-none focus:ring-0 text-foreground placeholder:text-gray-400 block w-full"
                placeholder="Name your document..."
              />
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                  Editing Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-3 border-r border-gray-200 pr-4">
            {onlineUsers.map((u) => (
                <div
                  key={u.socketId}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: u.userId === user?.id ? user.color : (u as any).userColor || '#ccc' }}
                  title={u.username}
                >
                  {u.username.substring(0, 1).toUpperCase()}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setShowShare(!showShare)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(!showComments)}
              className={showComments ? "bg-primary/10 text-primary" : "text-gray-500"}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className={showHistory ? "bg-primary/10 text-primary" : "text-gray-500"}
            >
              <HistoryIcon className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-1 sticky top-16 z-10 shadow-sm overflow-x-auto">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive('bold') ? 'bg-gray-100' : ''}
            >
                <span className="font-bold">B</span>
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive('italic') ? 'bg-gray-100' : ''}
            >
                <span className="italic">I</span>
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={editor?.isActive('underline') ? 'bg-gray-100' : ''}
            >
                <span className="underline">U</span>
            </Button>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={editor?.isActive('bulletList') ? 'bg-gray-100' : ''}
            >
                <Plus className="w-4 h-4" />
            </Button>
        </div>

        <main className="flex-1 overflow-auto bg-[#F8F9FA] p-8" ref={containerRef}>
          <div className="max-w-4xl mx-auto min-h-[11in] bg-white shadow-lg border border-gray-200 rounded-sm p-12 relative mb-20">
            {Object.values(cursors).map(cursor => {
              if (cursor.userId === user?.id) return null;
              return (
                <div 
                  key={cursor.userId}
                  className="absolute pointer-events-none z-10 transition-all duration-100"
                  style={{ top: cursor.position.top + 48, left: cursor.position.left + 48 }}
                >
                  <div className="w-[2px] h-5" style={{ backgroundColor: cursor.color }} />
                  <div 
                    className="absolute top-5 left-0 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap shadow-md z-20 font-bold"
                    style={{ backgroundColor: cursor.color }}
                  >
                    {cursor.username}
                  </div>
                </div>
              );
            })}
            <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none" />
          </div>
        </main>
      </div>

      {/* Right Side Panels */}
      {(showShare || showComments || showHistory) && (
        <aside className="w-96 border-l border-gray-200 bg-white flex flex-col z-30 shadow-2xl transition-transform duration-300">
            {showShare && (
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
                    <Share2 className="w-5 h-5 text-primary" />
                    Share Document
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowShare(false)}>
                    <X className="w-5 h-5 text-gray-400 hover:text-foreground" />
                  </Button>
                </div>
                <form onSubmit={handleShare} className="space-y-4 mb-8">
                  <div className="relative">
                    <Input
                      placeholder="Email or username..."
                      value={shareInput}
                      onChange={(e: any) => setShareInput(e.target.value)}
                      className="pr-12"
                    />
                    <Button
                      type="submit"
                      disabled={shareStatus === "loading"}
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {shareStatus === "success" && (
                    <p className="text-green-500 text-xs text-center font-bold">
                      Shared successfully!
                    </p>
                  )}
                  {shareStatus === "error" && (
                    <p className="text-red-500 text-xs text-center font-bold">
                      {shareError}
                    </p>
                  )}
                </form>

                <div className="mb-10">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Share Link
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={window.location.href}
                      className="flex-1 bg-gray-50 text-xs text-gray-500"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyLink}
                      variant="outline"
                      size="icon"
                      title="Copy Link"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Collaborators
                </h4>
                <div className="space-y-3 flex-1 overflow-auto">
                  {collaborators.map((c) => (
                    <div
                      key={c.userId}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: c.color || '#primary' }}
                      >
                        {c.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">
                          {c.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {c.email}
                        </div>
                      </div>
                    </div>
                  ))}
                  {collaborators.length === 0 && (
                    <p className="text-center text-gray-600 italic py-10 text-sm">
                      No collaborators yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {showComments && (
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Comments
                  </h3>
                  <button onClick={() => setShowComments(false)}>
                    <X className="w-5 h-5 text-gray-400 hover:text-foreground" />
                  </button>
                </div>
                <div className="space-y-6 flex-1 overflow-auto mb-6 pr-2">
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {c.author.username.substring(0, 2).toUpperCase()}
                      </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-1 relative group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-primary">
                            {c.author.username}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(c.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-20">
                      <MessageSquare className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
                      <p className="text-gray-600 text-sm">
                        Be the first to comment
                      </p>
                    </div>
                  )}
                </div>
                <form onSubmit={addComment} className="mt-auto relative">
                  <Input
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e: any) => setCommentInput(e.target.value)}
                    className="pr-14 h-12"
                  />
                  <Button 
                    type="submit"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}

            {showHistory && (
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
                    <HistoryIcon className="w-5 h-5 text-primary" />
                    History
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                    <X className="w-5 h-5 text-gray-400 hover:text-foreground" />
                  </Button>
                </div>
                <button
                  onClick={saveVersion}
                  className="w-full bg-gray-50 border border-gray-200 hover:border-primary/50 text-foreground py-4 rounded-2xl mb-8 flex items-center justify-center gap-2 group transition-all font-bold shadow-sm"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="font-bold text-sm">Save Snapshot</span>
                </button>
                <div className="space-y-4 flex-1 overflow-auto">
                  {history
                    .map((v, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-foreground mb-0.5">
                              {new Date(v.timestamp).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 italic">
                              Version {history.length - i}
                            </div>
                          </div>
                          <button className="p-2 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                    .reverse()}
                  {history.length === 0 && (
                    <div className="text-center py-20 italic text-gray-700 text-sm">
                      No saved versions.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
    </div>
  );
};

export default Editor;
