import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import { activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import type { Corpus } from "../types";
import CreateCorpusDialog from "./CreateCorpusDialog";
import type { CorpusFormData } from "./CreateCorpusDialog";
import EstimateCostDialog from "./EstimateCostDialog";
import type { CostEstimateData } from "./EstimateCostDialog";
import DeleteCorpusDialog from "./DeleteCorpusDialog";
import DropdownMenu from "./DropdownMenu";

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
  const [scanningCorpusId, setScanningCorpusId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [costDialogLoading, setCostDialogLoading] = useState(false);
  const [costDialogError, setCostDialogError] = useState<string | null>(null);
  const [costDialogData, setCostDialogData] = useState<CostEstimateData | undefined>(undefined);
  const [ingestingCorpusId, setIngestingCorpusId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCorpus, setDeletingCorpus] = useState<Corpus | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleScanCorpus = async (corpus: Corpus) => {
    setScanningCorpusId(corpus.id);
    setError(null);
    try {
      const response = await fetch(`/corpora/${corpus.id}/scan`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to scan corpus');
      }
      fetchCorpora();
      showToast('Scan complete!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setScanningCorpusId(null);
      setOpenDropdown(null);
    }
  };

  const handleEstimateCost = async (corpus: Corpus) => {
    setCostDialogOpen(true);
    setCostDialogLoading(true);
    setCostDialogError(null);
    setCostDialogData(undefined);
    setOpenDropdown(null);
    try {
      const response = await fetch(`/corpora/${corpus.id}/cost_estimate`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch cost estimate');
      }
      const data = await response.json();
      setCostDialogData(data);
    } catch (error) {
      setCostDialogError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCostDialogLoading(false);
    }
  };

  const handleIngestCorpus = async (corpus: Corpus) => {
    setIngestingCorpusId(corpus.id);
    setError(null);
    try {
      const response = await fetch(`/corpora/${corpus.id}/ingest`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to ingest corpus files');
      }
      fetchCorpora();
      showToast('Ingestion complete!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIngestingCorpusId(null);
      setOpenDropdown(null);
    }
  };

  const handleDeleteCorpus = (corpus: Corpus) => {
    setDeletingCorpus(corpus);
    setDeleteDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCorpus) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/corpora/${deletingCorpus.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete corpus');
      }
      
      // Close dialog and refresh corpora list
      setDeleteDialogOpen(false);
      setDeletingCorpus(null);
      fetchCorpora();
      
      // Clear active corpus if it was the one being deleted
      if (activeCorpus?.id === deletingCorpus.id) {
        setActiveCorpus(null);
        setActiveConversation(null);
        setConversationParts([]);
        setIsNewConversationMode(true);
      }
      
      showToast('Corpus deleted successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingCorpus(null);
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
              <DropdownMenu
                isOpen={openDropdown === corpus.id}
                onToggle={e => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === corpus.id ? null : corpus.id);
                }}
                items={[
                  {
                    label: "Edit",
                    onClick: e => {
                      e.stopPropagation();
                      handleEditCorpus(corpus);
                      setOpenDropdown(null);
                    }
                  },
                  {
                    label: "Scan for Files",
                    onClick: e => {
                      e.stopPropagation();
                      handleScanCorpus(corpus);
                    },
                    loading: scanningCorpusId === corpus.id,
                    disabled: scanningCorpusId === corpus.id
                  },
                  {
                    label: "Estimate Cost",
                    onClick: e => {
                      e.stopPropagation();
                      handleEstimateCost(corpus);
                    }
                  },
                  {
                    label: "Ingest Files",
                    onClick: e => {
                      e.stopPropagation();
                      handleIngestCorpus(corpus);
                    },
                    loading: ingestingCorpusId === corpus.id,
                    disabled: ingestingCorpusId === corpus.id
                  },
                  {
                    label: "Delete",
                    onClick: e => {
                      e.stopPropagation();
                      handleDeleteCorpus(corpus);
                    },
                    variant: 'danger'
                  }
                ]}
                menuClassName="min-w-[180px]"
              />
            </div>
            <div className={`text-xs whitespace-pre-line break-words mt-1 ${
              activeCorpus?.id === corpus.id ? "text-blue-100" : "text-zinc-400"
            }`}>{corpus.description}</div>
            <div className={`text-xs ${
              activeCorpus?.id === corpus.id ? "text-blue-200" : "text-zinc-500"
            }`}>
              {new Date(corpus.updated_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
          similarity_threshold: editingCorpus.similarity_threshold,
        } : undefined}
      />

      <EstimateCostDialog
        isOpen={costDialogOpen}
        onClose={() => setCostDialogOpen(false)}
        costData={costDialogData}
        loading={costDialogLoading}
        error={costDialogError}
      />

      <DeleteCorpusDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        corpus={deletingCorpus}
        isLoading={isDeleting}
      />

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

export default Corpora;
