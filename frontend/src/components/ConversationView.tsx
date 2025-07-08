import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import type { ConversationPart } from "../types";

interface ConversationViewProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

// Dialog for showing context chunks
const ContextChunksDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chunks: string[];
}> = ({ isOpen, onClose, chunks }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Context Chunks</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {chunks.map((chunk, idx) => (
            <div key={idx} className="bg-zinc-800 rounded p-3 text-zinc-200 text-sm whitespace-pre-wrap">
              {chunk}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ConversationView: React.FC<ConversationViewProps> = ({ scrollContainerRef }) => {
  const [activeConversation] = useAtom(activeConversationAtom);
  const [conversationParts] = useAtom(conversationPartsAtom);
  const [isNewConversationMode] = useAtom(isNewConversationModeAtom);
  const [activeCorpus] = useAtom(activeCorpusAtom);
  const [openChunksPartId, setOpenChunksPartId] = useState<string | null>(null);

  // Scroll to top when conversation changes (when selecting a new conversation)
  useEffect(() => {
    if (scrollContainerRef.current && activeConversation) {
      // Add a small delay to ensure content is rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [activeConversation, scrollContainerRef]);

  // Show new conversation welcome message
  if (isNewConversationMode && !activeConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-4 text-zinc-400">New Conversation</h1>
          <p className="text-zinc-500 mb-4">
            You're starting a new conversation with the <span className="text-blue-400 font-semibold">{activeCorpus?.name}</span> corpus.
          </p>
          <p className="text-zinc-500">
            Ask your first question below to begin the conversation.
          </p>
        </div>
      </div>
    );
  }

  // Show select conversation message when no conversation is selected and not in new mode
  if (!activeConversation && !isNewConversationMode) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-zinc-400">Select a Conversation</h1>
          <p className="text-zinc-500">Choose a conversation from the sidebar to view its content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {activeConversation?.title || "Untitled Conversation"}
        </h1>
        <p className="text-zinc-400 text-sm">
          Created: {activeConversation ? new Date(activeConversation.created_at).toLocaleString() : ""}
        </p>
      </div>

      <div className="flex justify-center w-full">
        <div className="space-y-10 w-full max-w-4xl mx-auto">
          {conversationParts.map((part: ConversationPart) => (
            <div key={part.id} className="flex flex-col gap-8 py-2">
              {/* User Query Bubble (right aligned) */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl px-6 py-4 max-w-3xl w-full ml-auto shadow-md flex flex-col">
                  <div>{part.query}</div>
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-zinc-200 pr-2">
                      {new Date(part.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              {/* AI Response (left aligned) */}
              <div className="flex flex-col items-start">
                <div className="bg-zinc-700 text-white rounded-2xl px-6 py-4 max-w-3xl w-full mr-auto shadow whitespace-pre-wrap flex flex-col">
                  <div>{part.response}</div>
                  {part.context_chunks && part.context_chunks.length > 0 && (
                    <div className="flex justify-end mt-2">
                      <div
                        className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-600 transition-colors shadow cursor-pointer"
                        title="Show context chunks"
                        onClick={() => setOpenChunksPartId(part.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {/* Context Chunks Dialog */}
                {part.context_chunks && part.context_chunks.length > 0 && (
                  <ContextChunksDialog
                    isOpen={openChunksPartId === part.id}
                    onClose={() => setOpenChunksPartId(null)}
                    chunks={part.context_chunks}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {conversationParts.length === 0 && (
        <div className="text-center text-zinc-400">
          <p>No conversation parts found.</p>
        </div>
      )}
    </div>
  );
};

export default ConversationView;