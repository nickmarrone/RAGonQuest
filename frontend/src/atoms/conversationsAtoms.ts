import { atom } from "jotai";

export const conversationsAtom = atom<Conversation[]>([]);
export const activeConversationAtom = atom<Conversation | null>(null);
