import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import { activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import type { Corpus } from "../types";
import CreateCorpusDialog from "./CreateCorpusDialog";
import type { CorpusFormData } from "./CreateCorpusDialog";

const Corpora: React.FC = () => {
  const [corpora, setCorpora] = useAtom(corporaAtom);
  const [activeCorpus, setActiveCorpus] = useAtom(activeCorpusAtom);
  const [, setActiveConversation] = useAtom(activeConversationAtom);
  const [, setConversationParts] = useAtom(conversationPartsAtom);
  const [, setIsNewConversationMode] = useAtom(isNewConversationModeAtom);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCorpora = () => {
    fetch(`/corpora`)
      .then((res) => res.json())
      .then((data: Corpus[]) => {
        // Sort by updated_at descending
        const sorted = [...data].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setCorpora(sorted);
      });
  };

  useEffect(() => {
    fetchCorpora();
  }, [setCorpora]);

  const handleCorpusSelect = (corpus: Corpus) => {
    // Only clear conversations if the corpus actually changes
    if (activeCorpus?.id !== corpus.id) {
      setActiveCorpus(corpus);
      setActiveConversation(null);
      setConversationParts([]);
      setIsNewConversationMode(true); // Start new conversation mode
    }
  };

  const handleNewCorpus = () => {
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSaveCorpus = async (corpusData: CorpusFormData) => {
    setIsCreating(true);
    try {
      const response = await fetch('/corpora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create corpus');
      }

      const newCorpus = await response.json();
      
      // Close dialog and refresh corpora list
      setIsDialogOpen(false);
      fetchCorpora();
      
      // Optionally select the newly created corpus
      setActiveCorpus(newCorpus);
    } catch (error) {
      console.error('Error creating corpus:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold mb-4">Corpora</h2>
        <button
            onClick={handleNewCorpus}
            disabled={isCreating}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          >
          {isCreating ? "Creating..." : "New"}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
          <div className="flex items-center justify-between">
            <span>Error: {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <ul>
        {corpora.map((corpus: Corpus) => (
          <li
            key={corpus.id}
            className={`p-2 rounded cursor-pointer mb-2 ${
              activeCorpus?.id === corpus.id
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            onClick={() => handleCorpusSelect(corpus)}
          >
            <div className="font-semibold">{corpus.name}</div>
            <div className="text-xs text-zinc-400">{corpus.description}</div>
            <div className="text-xs text-zinc-500">
              Updated: {new Date(corpus.updated_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>

      <CreateCorpusDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveCorpus}
        isLoading={isCreating}
      />
    </div>
  );
};

export default Corpora;
