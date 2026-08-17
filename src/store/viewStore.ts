import { create } from 'zustand'

export const Views = {
  Architect: 'architect',
  FullStack: 'fullstack',
} as const

export type ViewId = (typeof Views)[keyof typeof Views]

const STORAGE_KEY = 'hyperflow:view'

interface ViewState {
  view: ViewId
  setView: (view: ViewId) => void
}

function initialView(): ViewId {
  if (typeof window === 'undefined') return Views.Architect
  return window.localStorage.getItem(STORAGE_KEY) === Views.FullStack
    ? Views.FullStack
    : Views.Architect
}

export const useViewStore = create<ViewState>((set) => ({
  view: initialView(),
  setView: (view) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, view)
    }
    set({ view })
  },
}))
