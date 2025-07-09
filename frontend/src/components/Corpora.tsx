import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import { activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import type { Corpus } from "../types";
import CreateCorpusDialog from "./CreateCorpusDialog";
import EstimateCostDialog from "./EstimateCostDialog";
import type { CostEstimateData } from "./EstimateCostDialog";
import DeleteCorpusDialog from "./DeleteCorpusDialog";
import DropdownMenu from "./DropdownMenu";
import ListContainer from "./ListContainer";
import { useToast } from "../hooks/useToast";

type DialogState = 
  | { type: 'none' }
  | { type: 'create'; editingCorpus?: Corpus }
  | { type: 'cost'; corpus: Corpus; data?: CostEstimateData; loading: boolean; error?: string }
  | { type: 'delete'; corpus: Corpus; loading: boolean };

const Corpora: React.FC = () => {
  const [corpora, setCorpora] = useAtom(corporaAtom);
  const [activeCorpus, setActiveCorpus] = useAtom(activeCorpusAtom);
  const setActiveConversation = useSetAtom(activeConversationAtom);
  const setConversationParts = useSetAtom(conversationPartsAtom);
  const setIsNewConversationMode = useSetAtom(isNewConversationModeAtom);
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scanningCorpusId, setScanningCorpusId] = useState<string | null>(null);
  const [ingestingCorpusId, setIngestingCorpusId] = useState<string | null>(null);
  const { showSuccess } = useToast();

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


  const clearConversation = () => {
    setActiveConversation(null);
    setConversationParts([]);
    setIsNewConversationMode(true);
  };

  const handleCorpusSelect = (corpus: Corpus) => {
    // Only clear conversations if the corpus actually changes
    if (activeCorpus?.id !== corpus.id) {
      setActiveCorpus(corpus);
      clearConversation();
    }
  };

  const openCorpusDialog = (corpus?: Corpus) => {
    setError(null);
    setDialogState({ type: 'create', editingCorpus: corpus || undefined });
  };

  const closeDialog = () => {
    setDialogState({ type: 'none' });
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
      showSuccess('Scan complete!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setScanningCorpusId(null);
      setOpenDropdown(null);
    }
  };

  const handleEstimateCost = async (corpus: Corpus) => {
    setDialogState({ type: 'cost', corpus, loading: true, error: undefined, data: undefined });
    setOpenDropdown(null);
    try {
      const response = await fetch(`/corpora/${corpus.id}/cost_estimate`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch cost estimate');
      }
      const data = await response.json();
      setDialogState({ type: 'cost', corpus, loading: false, data });
    } catch (error) {
      setDialogState({ 
        type: 'cost', 
        corpus, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
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
      showSuccess('Ingestion complete!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIngestingCorpusId(null);
      setOpenDropdown(null);
    }
  };

  const handleDeleteCorpus = (corpus: Corpus) => {
    setDialogState({ type: 'delete', corpus, loading: false });
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (dialogState.type !== 'delete') return;
    
    setDialogState({ ...dialogState, loading: true });
    setError(null);
    try {
      const response = await fetch(`/corpora/${dialogState.corpus.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete corpus');
      }
      
      // Close dialog and refresh corpora list
      closeDialog();
      fetchCorpora();
      
      // Clear active corpus if it was the one being deleted
      if (activeCorpus?.id === dialogState.corpus.id) {
        setActiveCorpus(null);
        clearConversation();
      }
      
      showSuccess('Corpus deleted successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setDialogState({ ...dialogState, loading: false });
    }
  };

  const handleCancelDelete = () => {
    closeDialog();
  };

  const renderCorpusItem = (corpus: Corpus) => (
    <div
      className={`p-2 rounded mb-2 relative cursor-pointer ${
        activeCorpus?.id === corpus.id
          ? "bg-blue-600 text-white"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
      onClick={() => handleCorpusSelect(corpus)}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold truncate flex-1 min-w-0">
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
                openCorpusDialog(corpus);
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
    </div>
  );

  return (
    <div>
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
      
      <ListContainer
        title="Corpora"
        items={corpora}
        renderItem={renderCorpusItem}
        getItemKey={(corpus) => corpus.id}
        onNewClick={() => openCorpusDialog()}
        newButtonDisabled={isCreating}
        newButtonLoading={isCreating}
        newButtonText={isCreating ? (dialogState.type === 'create' && dialogState.editingCorpus?.id ? "Updating..." : "Creating...") : "New"}
      />

      {dialogState.type === 'create' && (
        <CreateCorpusDialog
          isOpen={dialogState.type === 'create'}
          onClose={closeDialog}
          onSuccess={(updatedCorpus) => {
            closeDialog();
            fetchCorpora();
            // Update active corpus if it was the one being edited or just created
            if (dialogState.editingCorpus?.id && activeCorpus?.id === dialogState.editingCorpus.id) {
              setActiveCorpus(updatedCorpus);
            } else if (!dialogState.editingCorpus?.id) {
              setActiveCorpus(updatedCorpus);
            }
          }}
          initialData={dialogState.editingCorpus || undefined}
        />
      )}

      {dialogState.type === 'cost' && (
        <EstimateCostDialog
          isOpen={dialogState.type === 'cost'}
          onClose={closeDialog}
          costData={dialogState.data}
          loading={dialogState.loading}
          error={dialogState.error}
        />
      )}

      {dialogState.type === 'delete' && (
        <DeleteCorpusDialog
          isOpen={dialogState.type === 'delete'}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          corpus={dialogState.corpus}
          isLoading={dialogState.loading}
        />
      )}
    </div>
  );
};

export default Corpora;
