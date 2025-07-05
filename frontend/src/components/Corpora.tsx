import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import { activeConversationAtom, conversationPartsAtom, isNewConversationModeAtom } from "../atoms/conversationsAtoms";
import type { Corpus } from "../types";

const Corpora: React.FC = () => {
  const [corpora, setCorpora] = useAtom(corporaAtom);
  const [activeCorpus, setActiveCorpus] = useAtom(activeCorpusAtom);
  const [, setActiveConversation] = useAtom(activeConversationAtom);
  const [, setConversationParts] = useAtom(conversationPartsAtom);
  const [, setIsNewConversationMode] = useAtom(isNewConversationModeAtom);

  useEffect(() => {
    fetch(`/corpora`)
      .then((res) => res.json())
      .then((data: Corpus[]) => {
        // Sort by updated_at descending
        const sorted = [...data].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setCorpora(sorted);
      });
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
    // TODO: Implement new corpus creation
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold mb-4">Corpora</h2>
        <button
            onClick={handleNewCorpus}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
          New
        </button>
      </div>
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
    </div>
  );
};

export default Corpora;
