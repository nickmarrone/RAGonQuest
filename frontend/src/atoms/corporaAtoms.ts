import { atom } from "jotai";
import { Corpus } from "../components/Corpora";

export const corporaAtom = atom<Corpus[]>([]);
export const activeCorpusAtom = atom<Corpus | null>(null);

