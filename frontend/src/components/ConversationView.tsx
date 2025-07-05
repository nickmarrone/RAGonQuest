import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { activeConversationAtom, conversationPartsAtom } from "../atoms/conversationsAtoms";
import type { ConversationPart } from "../types";

interface ConversationViewProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ConversationView: React.FC<ConversationViewProps> = ({ scrollContainerRef }) => {
  const [activeConversation] = useAtom(activeConversationAtom);
  const [conversationParts] = useAtom(conversationPartsAtom);

  // Scroll to bottom when conversation or parts change
  useEffect(() => {
    if (scrollContainerRef.current && conversationParts.length > 0) {
      // Try multiple approaches to ensure scrolling works
      const scrollToBottom = () => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          // Method 1: Direct scrollTop assignment
          container.scrollTop = container.scrollHeight;
          // Method 2: Smooth scroll as fallback
          setTimeout(() => {
            if (container.scrollTop !== container.scrollHeight) {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 50);
        }
      };
      // Try immediate scroll
      scrollToBottom();
      // Try delayed scroll to ensure content is rendered
      setTimeout(scrollToBottom, 100);
      // Try another delayed scroll as backup
      setTimeout(scrollToBottom, 300);
    }
  }, [activeConversation, conversationParts, scrollContainerRef]);

  if (!activeConversation) {
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
          {activeConversation.title || "Untitled Conversation"}
        </h1>
        <p className="text-zinc-400 text-sm">
          Created: {new Date(activeConversation.created_at).toLocaleString()}
        </p>
      </div>

      <div className="space-y-6">
        {conversationParts.map((part: ConversationPart) => (
          <div key={part.id} className="bg-zinc-800 rounded-lg p-6">
            {/* User Query */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">User Query:</h3>
              <div className="bg-zinc-700 rounded p-3">
                <p className="text-white">{part.query}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-green-400">AI Response:</h3>
              <div className="bg-zinc-700 rounded p-3">
                <p className="text-white whitespace-pre-wrap">{part.response}</p>
              </div>
            </div>

            {/* Context Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-400">Chunks Retrieved: </span>
                <span className="text-white">{part.chunks_retrieved}</span>
              </div>
              <div>
                <span className="text-zinc-400">Embedding Model: </span>
                <span className="text-white">{part.embedding_model_used}</span>
              </div>
              <div>
                <span className="text-zinc-400">Completion Model: </span>
                <span className="text-white">{part.completion_model_used}</span>
              </div>
              <div>
                <span className="text-zinc-400">Created: </span>
                <span className="text-white">
                  {new Date(part.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sources */}
            {part.sources && part.sources.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2 text-yellow-400">Sources:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {part.sources.map((source, index) => (
                    <li key={index} className="text-zinc-300 text-sm">{source}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Context Chunks (collapsible) */}
            {part.context_chunks && part.context_chunks.length > 0 && (
              <details className="mt-4">
                <summary className="text-md font-semibold mb-2 text-purple-400 cursor-pointer hover:text-purple-300">
                  Context Chunks ({part.context_chunks.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {part.context_chunks.map((chunk, index) => (
                    <div key={index} className="bg-zinc-700 rounded p-2 text-sm">
                      <p className="text-zinc-300">{chunk}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
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