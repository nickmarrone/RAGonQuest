import { atom } from "jotai";

export const corporaAtom = atom<Corpus[]>([]);
export const activeCorpusAtom = atom<Corpus | null>(null);

export const conversationsAtom = atom<Conversation[]>([]);
export const activeConversationAtom = atom<Conversation | null>(null);

export const conversationPartsAtom = atom<ConversationPart[]>([]);
export const activeConversationPartAtom = atom<ConversationPart | null>(null);

