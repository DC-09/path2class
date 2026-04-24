import { create } from 'zustand';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AssistantState {
  open: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  streaming: string;

  openSheet: () => void;
  closeSheet: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setIsTyping: (value: boolean) => void;
  setStreaming: (value: string) => void;
  reset: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  open: false,
  messages: [],
  isTyping: false,
  streaming: '',

  openSheet: () => set({ open: true }),
  closeSheet: () => set({ open: false }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setStreaming: (streaming) => set({ streaming }),
  reset: () =>
    set({ open: false, messages: [], isTyping: false, streaming: '' }),
}));
