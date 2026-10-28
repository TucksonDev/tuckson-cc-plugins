export type Posture = 'seated' | 'standing' | 'floor'
export type Phase = 'proposed' | 'timing' | 'rest'
export type Proposal = { exerciseId: string; phase: Phase; endsAt: number | null }
export type Stats = { done: number; calories: number; seconds: number; byExercise: Record<string, number> }
export type Lifetime = Stats & { days: string[] }
export type Preferences = { weightKg: number; postures: Posture[]; isMuted: boolean }

declare module 'claude-code' {
  interface PluginState {
    fitness: {
      current: Proposal | null
      now: number
      isWorking: boolean
      settings: Preferences
      session: Stats
      lifetime: Lifetime
    }
  }
}
