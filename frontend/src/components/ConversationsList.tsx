import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { conversationsAtom, activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import type { Conversation } from "../types";

const ConversationsList: React.FC = () => {
  const [activeCorpus] = useAtom(activeCorpusAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
  const [conversationParts, setConversationParts] = useAtom(conversationPartsAtom);
  const [, setIsNewConversationMode] = useAtom(isNewConversationModeAtom);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!activeCorpus) {
      setConversations([]);
      setActiveConversation(null);
      setConversationParts([]);
      return;
    }
    
    try {
      const response = await fetch(`/corpora/${activeCorpus.id}/conversations`);
      const data: Conversation[] = await response.json();
      
      // Sort by created_at descending
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setConversations(sorted);
      
      // Update active conversation if it exists
      if (activeConversation) {
        const updatedActive = sorted.find(conv => conv.id === activeConversation.id);
        if (updatedActive) {
          setActiveConversation(updatedActive);
          setConversationParts(updatedActive.parts);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeCorpus]);

  // Refresh conversations when conversation parts change (indicating a new part was added)
  useEffect(() => {
    if (conversationParts.length > 0) {
      fetchConversations();
    }
  }, [conversationParts.length]);

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setConversationParts(conversation.parts);
    setIsNewConversationMode(false); // Exit new conversation mode
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setConversationParts([]);
    setIsNewConversationMode(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const handleDeleteConversation = async (conversation: Conversation) => {
    setDeletingConversationId(conversation.id);
    setOpenDropdown(null);
    
    try {
      const response = await fetch(`/corpora/${activeCorpus!.id}/conversations/${conversation.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete conversation');
      }
      
      // Clear active conversation if it was the one being deleted
      if (activeConversation?.id === conversation.id) {
        setActiveConversation(null);
        setConversationParts([]);
        setIsNewConversationMode(true);
      }
      
      // Refresh conversations list
      fetchConversations();
      showToast('Conversation deleted successfully!');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showToast('Failed to delete conversation');
    } finally {
      setDeletingConversationId(null);
    }
  };

  if (!activeCorpus) {
    return <div className="mt-6 text-zinc-400">Select a corpus to see conversations.</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold">Conversations</h3>
        <button
          onClick={handleNewConversation}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          New
        </button>
      </div>
      <ul>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`p-2 rounded mb-2 relative transition-colors ${
              activeConversation?.id === conv.id 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div 
                className="font-medium cursor-pointer flex-1 min-w-0" 
                onClick={() => handleConversationSelect(conv)}
              >
                {conv.title || "Untitled"}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === conv.id ? null : conv.id);
                }}
                className="ml-2 p-0.5 text-xs text-zinc-400 hover:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ lineHeight: 1, height: '1.5em', width: '1.5em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '1em', display: 'block', lineHeight: 1 }}>▼</span>
              </button>
              {openDropdown === conv.id && (
                <div className="absolute right-2 top-8 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteConversation(conv);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors text-red-400 hover:text-red-300 flex items-center"
                    disabled={deletingConversationId === conv.id}
                  >
                    {deletingConversationId === conv.id ? (
                      <span className="animate-spin mr-2">⏳</span>
                    ) : null}
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-400">
              {new Date(conv.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">
              {conv.parts?.length || 0} parts
            </div>
          </li>
        ))}
        {conversations.length === 0 && (
          <li className="text-xs text-zinc-500">No conversations yet.</li>
        )}
      </ul>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-8 right-8 bg-green-600 border border-green-700 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center space-x-2 animate-fade-in">
          <span>{toast}</span>
          <span className="ml-2 text-base select-none">×</span>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
