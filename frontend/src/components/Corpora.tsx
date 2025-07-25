import React, { useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useToast } from "../hooks/useToast";
import ListContainer from "./ListContainer";
import DropdownMenu from "./DropdownMenu";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import { openDialogAtom, closeDialogAtom } from "../atoms/dialogAtom";
import type { Corpus } from "../types";
import type { CostEstimateData } from "./EstimateCostDialog";
import api from "../utils/api";
import { activeConversationAtom } from "../atoms/conversationsAtoms";

const Corpora: React.FC = () => {
  const [corpora, setCorpora] = useAtom(corporaAtom);
  const [activeCorpus, setActiveCorpus] = useAtom(activeCorpusAtom);
  const setActiveConversation = useSetAtom(activeConversationAtom);
  const openDialog = useSetAtom(openDialogAtom);
  const closeDialog = useSetAtom(closeDialogAtom);
  const [error, setError] = useState<string | null>(null);
  const [scanningCorpusId, setScanningCorpusId] = useState<string | null>(null);
  const [ingestingCorpusId, setIngestingCorpusId] = useState<string | null>(null);
  const [deletingCorpusId, setDeletingCorpusId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { showSuccess } = useToast();

  const fetchCorpora = async () => {
    try {
      const response = await api.get('/corpora/');
      setCorpora(response.data);
    } catch (error) {
      setError('Failed to fetch corpora');
    }
  };

  useEffect(() => {
    fetchCorpora();
  }, []);

  const handleCorpusSelect = (corpus: Corpus) => {
    setActiveCorpus(corpus);
    setActiveConversation(null);
  };

  const openCorpusDialog = (corpus?: Corpus) => {
    openDialog({
      type: 'create-corpus',
      props: {
        editingCorpus: corpus,
        onSuccess: (updatedCorpus: Corpus) => {
          closeDialog();
          fetchCorpora();
          // Update active corpus if it was the one being edited or just created
          if (corpus?.id && activeCorpus?.id === corpus.id) {
            setActiveCorpus(updatedCorpus);
          } else if (!corpus?.id) {
            setActiveCorpus(updatedCorpus);
          }
        }
      }
    });
  };

  const handleScanCorpus = async (corpus: Corpus) => {
    setScanningCorpusId(corpus.id);
    setError(null);
    try {
      await api.post(`/corpora/${corpus.id}/scan`);
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
    setError(null);
    try {
      const response = await api.get(`/corpora/${corpus.id}/cost_estimate`);
      const costData: CostEstimateData = response.data;
      
      openDialog({
        type: 'estimate-cost',
        props: {
          corpus,
          costData,
          loading: false,
          error: null
        }
      });
    } catch (error) {
      openDialog({
        type: 'estimate-cost',
        props: {
          corpus,
          costData: undefined,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  const handleIngestCorpus = async (corpus: Corpus) => {
    setIngestingCorpusId(corpus.id);
    setError(null);
    try {
      await api.post(`/corpora/${corpus.id}/ingest`);
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
    openDialog({
      type: 'delete-corpus',
      props: {
        corpus,
        isLoading: deletingCorpusId === corpus.id,
        onCommit: async () => {
          setDeletingCorpusId(corpus.id);
          setError(null);
          try {
            await api.delete(`/corpora/${corpus.id}`);
            
            // Close dialog and refresh corpora list
            closeDialog();
            fetchCorpora();
            
            // Clear active corpus if it was the one being deleted
            if (activeCorpus?.id === corpus.id) {
              setActiveCorpus(null);
            }
            
            showSuccess('Corpus deleted successfully!');
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setDeletingCorpusId(null);
          }
        }
      }
    });
    setOpenDropdown(null);
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
        newButtonText="New"
        emptyMessage="No corpora yet."
      />
    </div>
  );
};

export default Corpora;