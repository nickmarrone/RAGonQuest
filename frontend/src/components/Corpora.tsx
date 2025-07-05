import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { corporaAtom, activeCorpusAtom } from "../atoms/corporaAtoms";
import type { Corpus } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Corpora: React.FC = () => {
  const [corpora, setCorpora] = useAtom(corporaAtom);
  const [activeCorpus, setActiveCorpus] = useAtom(activeCorpusAtom);

  useEffect(() => {
    fetch(`${API_BASE_URL}/corpora`)
      .then((res) => res.json())
      .then((data: Corpus[]) => {
        // Sort by updated_at descending
        const sorted = [...data].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setCorpora(sorted);
      });
  }, [setCorpora]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Corpora</h2>
      <ul>
        {corpora.map((corpus: Corpus) => (
          <li
            key={corpus.id}
            className={`p-2 rounded cursor-pointer mb-2 ${
              activeCorpus?.id === corpus.id
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            onClick={() => setActiveCorpus(corpus)}
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
