import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { conversationsAtom, activeConversationAtom, conversationPartsAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import type { Conversation } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ConversationsList: React.FC = () => {
  const [activeCorpus] = useAtom(activeCorpusAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
  const [, setConversationParts] = useAtom(conversationPartsAtom);

  useEffect(() => {
    if (!activeCorpus) {
      setConversations([]);
      setActiveConversation(null);
      setConversationParts([]);
      return;
    }
    fetch(`${API_BASE_URL}/corpora/${activeCorpus.id}/conversations`)
      .then((res) => res.json())
      .then((data: Conversation[]) => {
        // Sort by created_at descending
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setConversations(sorted);
      });
  }, [activeCorpus, setConversations, setActiveConversation, setConversationParts]);

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setConversationParts(conversation.parts);
  };

  if (!activeCorpus) {
    return <div className="mt-6 text-zinc-400">Select a corpus to see conversations.</div>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold mb-2">Conversations</h3>
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
