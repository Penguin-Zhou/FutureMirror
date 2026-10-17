"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Report } from "@/lib/ai/schema";
import type { ChatMessage } from "@/lib/ai/client";

interface InterviewState {
  profile: Profile | null;
  messages: ChatMessage[];
  report: Report | null;
  setProfile: (p: Profile | null) => void;
  appendMessage: (m: ChatMessage) => void;
  setMessages: (m: ChatMessage[]) => void;
  setReport: (r: Report | null) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      profile: null,
      messages: [],
      report: null,
      setProfile: (profile) => set({ profile }),
      appendMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      setMessages: (messages) => set({ messages }),
      setReport: (report) => set({ report }),
      reset: () => set({ profile: null, messages: [], report: null }),
    }),
    { name: "futuremirror-store" },
  ),
);
