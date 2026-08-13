import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function Chat() {
  const { id } = useParams();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  async function markRead() {
    try {
      await api.post(`/conversations/${id}/read`);
    } catch (err) {
      // not critical
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${id}`),
          api.get(`/conversations/${id}/messages`),
        ]);
        setConversation(convRes.data);
        setMessages(msgRes.data);
        markRead();
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const socket = getSocket();
    socket.emit("join_conversation", id);

    function handleReceive(message) {
      setMessages((prev) => [...prev, message]);
      markRead();
    }
    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImageError("");
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function removeImagePreview() {
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const socket = getSocket();
    socket.emit("send_message", {
      conversationId: id,
      text,
      imageUrl: imagePreview,
    });

    setText("");
    removeImagePreview();
  }

  const otherPerson = conversation?.participants.find((p) => p._id !== user.id);

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <Link to="/inbox" className="text-sm text-ink/60 hover:underline">
        &larr; Back to inbox
      </Link>

      <div className="bg-white border border-line rounded-lg mt-4 flex flex-col h-[550px]">
        {conversation && (
          <div className="border-b border-line px-4 py-3">
            <p className="font-semibold">{otherPerson?.name || "Chat"}</p>

            <div className="flex flex-col gap-1 mt-1">
              {conversation.item && (
                <Link to={`/items/${conversation.item._id}`} className="flex items-center gap-2 hover:underline w-fit">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                      conversation.item.type === "lost" ? "bg-clay" : "bg-teal"
                    }`}
                  >
                    {conversation.item.type?.toUpperCase()}
                  </span>
                  <p className="text-xs text-ink/60">{conversation.item.title}</p>
                </Link>
              )}
              {conversation.relatedItem && (
                <Link to={`/items/${conversation.relatedItem._id}`} className="flex items-center gap-2 hover:underline w-fit">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                      conversation.relatedItem.type === "lost" ? "bg-clay" : "bg-teal"
                    }`}
                  >
                    {conversation.relatedItem.type?.toUpperCase()}
                  </span>
                  <p className="text-xs text-ink/60">{conversation.relatedItem.title}</p>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-ink/50 text-sm">Loading messages...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-ink/50 text-sm">No messages yet. Say hello!</p>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender._id === user.id;
            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-amber text-navy" : "bg-paper border border-line"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-semibold text-ink/50 mb-1">{msg.sender.name}</p>
                  )}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Shared" className="rounded-md max-w-full mb-1 max-h-60 object-cover" />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {imagePreview && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-line" />
            <button type="button" onClick={removeImagePreview} className="text-xs text-clay font-semibold hover:underline">
              Remove
            </button>
          </div>
        )}
        {imageError && <p className="px-3 pt-1 text-xs text-clay">{imageError}</p>}

        <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-line items-center">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} className="text-ink/60 hover:text-ink px-2" title="Attach image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-line rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber"
          />
          <button type="submit" className="bg-amber text-navy font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;