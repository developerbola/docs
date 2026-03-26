import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  History,
  Share2,
  ChevronRight,
  Send,
  User as UserIcon,
  Clock,
  Check,
  X,
  MoreVertical,
  Plus,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import debounce from "lodash/debounce";
import getCaretCoordinates from "textarea-caret";

interface Collaborator {
  userId: string;
  username: string;
  socketId: string;
  email: string;
}

interface Cursor {
  userId: string;
  username: string;
  position: { top: number; left: number };
}

const Editor: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Note");
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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNote();
    setupSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${noteId}`);
      setContent(response.data.content);
      setTitle(response.data.title);
      setComments(response.data.comments || []);
      setHistory(response.data.versions || []);
      setCollaborators(response.data.collaborators || []);
    } catch (err) {
      navigate("/");
    }
  };

  const setupSocket = () => {
    socketRef.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5001",
    );

    socketRef.current.emit("join-note", {
      noteId,
      userId: user?.id,
      username: user?.username,
    });

    socketRef.current.on("receive-changes", ({ content: newContent }) => {
      setContent(newContent);
    });

    socketRef.current.on("update-users", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("receive-cursor", (cursorData: any) => {
      setCursors((prev) => ({
        ...prev,
        [cursorData.userId]: cursorData,
      }));
    });
  };

  const debouncedEmit = useMemo(
    () =>
      debounce((newContent: string) => {
        socketRef.current?.emit("send-changes", {
          noteId,
          content: newContent,
          senderId: user?.id,
        });
      }, 500),
    [noteId, user?.id],
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedEmit(newContent);
    updateCursor();
  };

  const updateCursor = () => {
    if (!textAreaRef.current || !user) return;
    const { selectionEnd } = textAreaRef.current;
    const caret = getCaretCoordinates(textAreaRef.current, selectionEnd);
    socketRef.current?.emit("cursor-move", {
      noteId,
      userId: user.id,
      username: user.username,
      position: { top: caret.top, left: caret.left }
    });
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareInput.trim()) return;
    setShareStatus("loading");
    setShareError("");
    try {
      await api.post(`/notes/${noteId}/share`, { identity: shareInput });
      setShareStatus("success");
      setShareInput("");
      fetchNote();
      setTimeout(() => setShareStatus("idle"), 3000);
    } catch (err: any) {
      setShareStatus("error");
      setShareError(err.response?.data?.message || "Failed to share note");
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
      const response = await api.post(`/notes/${noteId}/comment`, {
        text: commentInput,
      });
      setComments([...comments, response.data]);
      setCommentInput("");
    } catch (err) {
      console.error("Error adding comment");
    }
  };

  const saveVersion = () => {
    socketRef.current?.emit("save-version", {
      noteId,
      userId: user?.id,
      content,
    });
    alert("Version saved!");
    fetchNote();
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="p-3 hover:bg-white/5 rounded-2xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent text-xl font-bold border-none focus:outline-none focus:ring-0 text-white placeholder:text-gray-600 block w-full"
                placeholder="Name your note..."
              />
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Autosaved
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 mr-4">
              {onlineUsers.map((u, i) => (
                <div
                  key={u.socketId}
                  className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-xs font-bold ring-2 ring-primary/20"
                  title={u.username}
                >
                  {u.username.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-2.5 rounded-xl transition-all ${showComments ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-400"}`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl transition-all ${showHistory ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-gray-400"}`}
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-12 bg-neo-blur relative" ref={containerRef}>
          <div className="max-w-4xl mx-auto h-full flex flex-col relative">
            {Object.values(cursors).map(cursor => {
              if (cursor.userId === user?.id) return null;
              return (
                <div 
                  key={cursor.userId}
                  className="absolute pointer-events-none z-10 transition-all duration-100"
                  style={{ top: cursor.position.top, left: cursor.position.left }}
                >
                  <div className="w-[2px] h-5 bg-green-500 animate-pulse" />
                  <div className="absolute top-5 left-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap shadow-md z-20">
                    {cursor.username}
                  </div>
                </div>
              );
            })}
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={handleContentChange}
              onKeyUp={updateCursor}
              onClick={updateCursor}
              placeholder="Start writing your thoughts..."
              className="flex-1 w-full bg-transparent border-none focus:outline-none resize-none text-lg leading-relaxed text-gray-300 placeholder:text-gray-600 font-serif relative z-0"
              autoFocus
            />
          </div>
        </main>
      </div>

      {/* Right Side Panels */}
      <AnimatePresence>
        {(showShare || showComments || showHistory) && (
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-96 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col z-30"
          >
            {showShare && (
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                    <Share2 className="w-5 h-5 text-primary" />
                    Share Note
                  </h3>
                  <button onClick={() => setShowShare(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleShare} className="space-y-4 mb-8">
                  <div className="relative">
                    <input
                      placeholder="Email or username..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-white"
                      value={shareInput}
                      onChange={(e) => setShareInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={shareStatus === "loading"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-primary rounded-lg text-gray-400 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
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
                    <input
                      readOnly
                      value={window.location.href}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-gray-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center min-w-[48px]"
                      title="Copy Link"
                    >
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Collaborators
                </h4>
                <div className="space-y-3 flex-1 overflow-auto">
                  {collaborators.map((c) => (
                    <div
                      key={c.userId}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {c.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
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
                  <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Comments
                  </h3>
                  <button onClick={() => setShowComments(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-6 flex-1 overflow-auto mb-6 pr-2">
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {c.author.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex-1 relative group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-primary">
                            {c.author.username}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(c.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
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
                  <input
                    placeholder="Add a comment..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-white"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {showHistory && (
              <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                    <History className="w-5 h-5 text-primary" />
                    History
                  </h3>
                  <button onClick={() => setShowHistory(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <button
                  onClick={saveVersion}
                  className="w-full bg-white/5 border border-white/10 hover:border-primary/50 text-white py-4 rounded-2xl mb-8 flex items-center justify-center gap-2 group transition-all"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="font-bold text-sm">Save Snapshot</span>
                </button>
                <div className="space-y-4 flex-1 overflow-auto">
                  {history
                    .map((v, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/20 p-2.5 rounded-xl">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white mb-0.5">
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
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Editor;
