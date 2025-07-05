import { atom } from "jotai";
import type { Corpus } from "../types";

export const corporaAtom = atom<Corpus[]>([]);
export const activeCorpusAtom = atom<Corpus | null>(null);

