import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { activeConversationAtom, conversationPartsAtom } from "../atoms/conversationsAtoms";
import { activeCorpusAtom } from "../atoms/corporaAtoms";

const ConversationInput: React.FC = () => {
  const [activeCorpus] = useAtom(activeCorpusAtom);
  const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
  const [, setConversationParts] = useAtom(conversationPartsAtom);
  const [isContinuing, setIsContinuing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Detect if this is a new conversation (no active conversation selected)
  const isNewConversation = !activeConversation;

  // Load conversation parts when active conversation changes
  useEffect(() => {
    if (activeConversation && activeConversation.parts) {
      setConversationParts(activeConversation.parts);
    } else {
      setConversationParts([]);
    }
  }, [activeConversation, setConversationParts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !activeCorpus || isContinuing) {
      return;
    }

    setIsContinuing(true);
    setError(null);

    try {
      let response;
      
      if (isNewConversation) {
        // Create a new conversation
        response = await fetch(
          `/corpora/${activeCorpus.id}/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: inputValue.trim(),
              title: inputValue.trim().substring(0, 100), // Use first 100 chars as title
              limit: 25,
            }),
          }
        );
      } else {
        // Continue existing conversation
        response = await fetch(
          `/corpora/${activeCorpus.id}/conversations/${activeConversation!.id}/continue`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: inputValue.trim(),
              limit: 25,
            }),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const updatedConversation = await response.json();
      
      // Update the conversation and parts
      setActiveConversation(updatedConversation);
      setConversationParts(updatedConversation.parts);
      
      // Clear the input
      setInputValue("");
      
    } catch (error) {
      console.error("Error processing conversation:", error);
      setError(error instanceof Error ? error.message : "An error occurred while processing your question");
    } finally {
      setIsContinuing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Show input if we have a corpus selected
  if (!activeCorpus) {
    return null;
  }

  return (
    <div className="border-t border-zinc-700 bg-zinc-800 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isNewConversation ? "Ask your first question..." : "Ask a follow-up question..."}
              disabled={isContinuing}
              className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isContinuing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isContinuing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Thinking...</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded p-2">
            {error}
          </div>
        )}
        
        {isContinuing && (
          <div className="flex items-center space-x-2 text-zinc-400 text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-zinc-400"></div>
            <span>Processing your question...</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ConversationInput; 