import React, { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { activeConversationAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";
import { openDialogAtom } from "../atoms/dialogAtom";
import type { ConversationPart } from "../types";

interface ConversationViewProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ConversationView: React.FC<ConversationViewProps> = ({ scrollContainerRef }) => {
  const activeCorpus = useAtomValue(activeCorpusAtom);
  const activeConversation = useAtomValue(activeConversationAtom);
  const openDialog = useSetAtom(openDialogAtom);

  // Detect if this is a new conversation (no active conversation selected)
  const isNewConversation = !activeConversation;

  // Scroll to bottom when conversation parts change (new part added)
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (activeConversation?.parts && activeConversation.parts.length > 0) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        }, 50);
      } else {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }, 50);
      }
      return;
    }
  }, [activeConversation, activeConversation?.parts?.length, scrollContainerRef]);
  
  // Show new conversation welcome message
  if (isNewConversation) {
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

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {activeConversation?.title || "Untitled Conversation"}
        </h1>
      </div>

      <div className="flex justify-center w-full">
        <div className="space-y-10 w-full max-w-4xl mx-auto">
          {activeConversation.parts.map((part: ConversationPart) => (
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
                        title="Show context"
                        onClick={() => {
                          openDialog({
                            type: 'context-chunks',
                            props: {
                              chunks: part.context_chunks
                            }
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeConversation && activeConversation.parts.length === 0 && (
        <div className="text-center text-zinc-400">
          <p>No conversation parts found.</p>
        </div>
      )}
    </div>
  );
};

export default ConversationView;