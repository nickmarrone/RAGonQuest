import { atom } from "jotai";
import type { Conversation, ConversationPart } from "../types";

export const conversationsAtom = atom<Conversation[]>([]);
export const activeConversationAtom = atom<Conversation | null>(null);
export const conversationPartsAtom = atom<ConversationPart[]>([]);
export const isContinuingConversationAtom = atom<boolean>(false);
export const newQueryInputAtom = atom<string>("");
