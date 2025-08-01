import React, { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { conversationsAtom, activeConversationAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import type { Conversation } from "../types";
import DropdownMenu from "./DropdownMenu";
import ListContainer from "./ListContainer";
import { useToast } from "../hooks/useToast";
import api from "../utils/api";

const ConversationsList: React.FC = () => {
  const activeCorpus = useAtomValue(activeCorpusAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();


  const clearActiveConversation = () => {
    setActiveConversation(null);
  }

  const fetchConversations = async () => {
    if (!activeCorpus) {
      setConversations([]);
      clearActiveConversation();
      return;
    }
    
    try {
      const response = await api.get(`/corpora/${activeCorpus.id}/conversations`);
      const data: Conversation[] = response.data;
      
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
  // TODO: Do we need to refresh if we have the updated part as a response? Do we need to refresh all conversations?
  useEffect(() => {
    if (activeConversation?.parts && activeConversation.parts.length > 0) {
      fetchConversations();
    }
  }, [activeConversation?.parts?.length]);

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    setDeletingConversationId(conversation.id);
    setOpenDropdown(null);
    
    try {
      await api.delete(`/corpora/${activeCorpus!.id}/conversations/${conversation.id}`);
      
      // Clear active conversation if it was the one being deleted
      if (activeConversation?.id === conversation.id) {
        clearActiveConversation();
      }
      
      // Refresh conversations list
      fetchConversations();
      showSuccess('Conversation deleted successfully!');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showError('Failed to delete conversation');
    } finally {
      setDeletingConversationId(null);
    }
  };

  if (!activeCorpus) {
    return <div className="mt-6 text-zinc-400">Select a corpus to see conversations.</div>;
  }

  const renderConversationItem = (conv: Conversation) => (
    <div
      className={`p-2 rounded mb-2 relative transition-colors cursor-pointer ${
        activeConversation?.id === conv.id 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
      onClick={() => handleConversationSelect(conv)}
    >
      <div className="flex items-center justify-between">
        <div 
          className="text-sm font-medium flex-1 min-w-0" 
        >
          {conv.title || "Untitled"}
        </div>
        <DropdownMenu
          isOpen={openDropdown === conv.id}
          onToggle={e => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === conv.id ? null : conv.id);
          }}
          items={[
            {
              label: "Delete",
              onClick: e => {
                e.stopPropagation();
                handleDeleteConversation(conv);
              },
              loading: deletingConversationId === conv.id,
              variant: 'danger'
            }
          ]}
        />
      </div>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-zinc-400">
          {new Date(conv.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </span>
        <span className="text-zinc-500">
          {conv.parts?.length || 0} parts
        </span>
      </div>
    </div>
  );

  return (
    <>
      <ListContainer
        title="Conversations"
        items={conversations}
        renderItem={renderConversationItem}
        getItemKey={(conv) => conv.id}
        onNewClick={clearActiveConversation}
        className="mt-6"
        titleClassName="text-md font-semibold"
        emptyMessage="No conversations yet."
      />
    </>
  );
};

export default ConversationsList;
