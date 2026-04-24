/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL of the deployed Supabase Edge Function `chat-assistant`.
   * Example: https://<project-ref>.functions.supabase.co/chat-assistant
   */
  readonly VITE_ASSISTANT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
