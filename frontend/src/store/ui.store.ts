import { create } from 'zustand'

type ModalKey =
  | 'deleteWorkout'
  | 'deleteExercise'
  | 'addExercise'
  | 'confirmComplete'
  | null

interface UIState {
  sidebarOpen:  boolean
  activeModal:  ModalKey
  modalPayload: Record<string, unknown> | null
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (key: ModalKey, payload?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  /* ── State ──────────────────────────────────────────── */
  sidebarOpen:  typeof window !== 'undefined' && window.innerWidth >= 1024,
  activeModal:  null,
  modalPayload: null,

  /* ── Actions ────────────────────────────────────────── */
  toggleSidebar:  () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openModal: (key, payload = {}) =>
    set({ activeModal: key, modalPayload: payload }),

  closeModal: () => set({ activeModal: null, modalPayload: null }),
}))
