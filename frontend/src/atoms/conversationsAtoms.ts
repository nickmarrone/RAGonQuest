import { atom } from "jotai";
import type { Conversation } from "../types";

export const conversationsAtom = atom<Conversation[]>([]);
export const activeConversationAtom = atom<Conversation | null>(null);
