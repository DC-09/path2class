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
  /**
   * 1-based step index when the guided navigation flow is active.
   * null means free-form chat (or no flow started). When the user reaches
   * the arrived state we set it back to null to leave guided mode.
   */
  guidedStep: number | null;

  openSheet: () => void;
  closeSheet: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setIsTyping: (value: boolean) => void;
  setStreaming: (value: string) => void;
  setGuidedStep: (step: number | null) => void;
  reset: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  open: false,
  messages: [],
  isTyping: false,
  streaming: '',
  guidedStep: null,

  openSheet: () => set({ open: true }),
  closeSheet: () => set({ open: false }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setStreaming: (streaming) => set({ streaming }),
  setGuidedStep: (guidedStep) => set({ guidedStep }),
  reset: () =>
    set({ open: false, messages: [], isTyping: false, streaming: '', guidedStep: null }),
}));
