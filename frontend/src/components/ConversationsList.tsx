import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { conversationsAtom, activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import type { Conversation } from "../types";

const ConversationsList: React.FC = () => {
  const [activeCorpus] = useAtom(activeCorpusAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
  const [conversationParts, setConversationParts] = useAtom(conversationPartsAtom);
  const [isNewConversationMode, setIsNewConversationMode] = useAtom(isNewConversationModeAtom);

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
            className={`p-2 rounded mb-2 cursor-pointer transition-colors ${
              activeConversation?.id === conv.id 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            onClick={() => handleConversationSelect(conv)}
          >
            <div className="font-medium">{conv.title || "Untitled"}</div>
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
    </div>
  );
};

export default ConversationsList;
