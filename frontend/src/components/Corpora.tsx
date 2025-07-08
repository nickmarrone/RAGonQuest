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
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCorpus, setEditingCorpus] = useState<Corpus | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    setDialogMode('create');
    setEditingCorpus(null);
    setIsDialogOpen(true);
  };

  const handleEditCorpus = (corpus: Corpus) => {
    setError(null);
    setDialogMode('edit');
    setEditingCorpus(corpus);
    setIsDialogOpen(true);
  };

  const handleSaveCorpus = async (corpusData: CorpusFormData) => {
    setIsCreating(true);
    try {
      const url = dialogMode === 'create' ? '/corpora' : `/corpora/${editingCorpus?.id}`;
      const method = dialogMode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${dialogMode} corpus`);
      }

      const updatedCorpus = await response.json();
      
      // Close dialog and refresh corpora list
      setIsDialogOpen(false);
      fetchCorpora();
      
      // Update active corpus if it was the one being edited
      if (dialogMode === 'edit' && activeCorpus?.id === editingCorpus?.id) {
        setActiveCorpus(updatedCorpus);
      } else if (dialogMode === 'create') {
        // Optionally select the newly created corpus
        setActiveCorpus(updatedCorpus);
      }
    } catch (error) {
      console.error(`Error ${dialogMode}ing corpus:`, error);
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
          {isCreating ? (dialogMode === 'create' ? "Creating..." : "Updating...") : "New"}
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
            className={`p-2 rounded mb-2 relative ${
              activeCorpus?.id === corpus.id
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold truncate cursor-pointer flex-1 min-w-0" onClick={() => handleCorpusSelect(corpus)}>
                {corpus.name}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === corpus.id ? null : corpus.id);
                }}
                className="ml-2 p-0.5 text-xs text-zinc-400 hover:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ lineHeight: 1, height: '1.5em', width: '1.5em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '1em', display: 'block', lineHeight: 1 }}>▼</span>
              </button>
              {openDropdown === corpus.id && (
                <div className="absolute right-2 top-8 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleEditCorpus(corpus);
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-400 whitespace-pre-line break-words mt-1">{corpus.description}</div>
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
        mode={dialogMode}
        initialData={editingCorpus ? {
          name: editingCorpus.name,
          description: editingCorpus.description || "",
          default_prompt: editingCorpus.default_prompt,
          qdrant_collection_name: editingCorpus.qdrant_collection_name,
          path: editingCorpus.path,
          embedding_model: editingCorpus.embedding_model,
          completion_model: editingCorpus.completion_model,
        } : undefined}
      />
    </div>
  );
};

export default Corpora;
