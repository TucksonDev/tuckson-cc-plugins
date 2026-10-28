import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { EXERCISES } from './exercises'
import type { Exercise } from './exercises'
import type { Lifetime, Proposal, Preferences, Stats, Posture } from '../types'

const PANE = 'fitness'
const TRIGGER_MS = 10_000
const REST_MS = 30_000
const POSTURES: Posture[] = ['seated', 'standing', 'floor']
const POSTURE_HOTKEYS: Record<Posture, string> = { seated: 's', standing: 't', floor: 'f' }
const EMPTY_STATS: Stats = { done: 0, calories: 0, seconds: 0, byExercise: {} }
const EMPTY_LIFETIME: Lifetime = { ...EMPTY_STATS, days: [] }
const DEFAULT_SETTINGS: Preferences = { weightKg: 70, postures: POSTURES, isMuted: false }

const current = atom({ plugin: 'fitness', key: 'current' } as const, null)
const now = atom({ plugin: 'fitness', key: 'now' } as const, 0)
const isWorking = atom({ plugin: 'fitness', key: 'isWorking' } as const, false)
const settings = atom({ plugin: 'fitness', key: 'settings' } as const, DEFAULT_SETTINGS)
const sessionStats = atom({ plugin: 'fitness', key: 'session' } as const, EMPTY_STATS)
const lifetime = atom({ plugin: 'fitness', key: 'lifetime' } as const, EMPTY_LIFETIME)

let proposeTimer: Timer | undefined
let tick: Timer | undefined
let recentIds: string[] = []

function calories(exercise: Exercise, weightKg: number): number {
  return ((exercise.met * 3.5 * weightKg) / 200) * (exercise.seconds / 60)
}

function localDay(at: number): string {
  const date = new Date(at)
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(part => String(part).padStart(2, '0')).join('-')
}

function streak(days: string[], at: number): number {
  const cursor = new Date(at)
  if (!days.includes(localDay(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.includes(localDay(cursor.getTime()))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

function summary(stats: Stats): string {
  return `${stats.done} done · ${Math.round(stats.calories)} kcal · ${Math.round(stats.seconds / 60)} min`
}

function pick(allowed: Posture[]): Exercise | undefined {
  const pool = EXERCISES.filter(one => allowed.includes(one.posture))
  const fresh = pool.filter(one => !recentIds.includes(one.id))
  const candidates = fresh.length > 0 ? fresh : pool
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  if (chosen) recentIds = [...recentIds, chosen.id].slice(-6)
  return chosen
}

async function propose($: EngineInterface) {
  const { isMuted, postures } = await read($, settings)
  if (isMuted || !(await read($, isWorking))) return
  const exercise = pick(postures)
  if (!exercise) return
  await update($, current, (): Proposal => ({ exerciseId: exercise.id, phase: 'proposed', endsAt: null }))
}

async function nextExercise($: EngineInterface) {
  tick?.cancel()
  await update($, current, () => null)
  await propose($)
}

async function countdown($: EngineInterface, phase: 'timing' | 'rest', ms: number) {
  const at = await $.clock.now()
  await update($, now, () => at)
  await update($, current, one => one && { ...one, phase, endsAt: at + ms })
  tick?.cancel()
  tick = $.clock.every(1000, () => void onTick($))
}

async function onTick($: EngineInterface) {
  const at = await $.clock.now()
  await update($, now, () => at)
  const one = await read($, current)
  if (one === null || one.endsAt === null || at < one.endsAt) return
  if (one.phase === 'timing') await finish($, one.exerciseId)
  else await nextExercise($)
}

async function finish($: EngineInterface, exerciseId: string) {
  tick?.cancel()
  const exercise = EXERCISES.find(one => one.id === exerciseId)
  if (!exercise) return
  const { weightKg } = await read($, settings)
  const kcal = calories(exercise, weightKg)
  const at = await $.clock.now()
  const add = (stats: Stats): Stats => ({
    done: stats.done + 1,
    calories: stats.calories + kcal,
    seconds: stats.seconds + exercise.seconds,
    byExercise: { ...stats.byExercise, [exercise.id]: (stats.byExercise[exercise.id] ?? 0) + 1 },
  })
  const session = await update($, sessionStats, add)
  const life = await update($, lifetime, one => ({ ...add(one), days: [...new Set([...one.days, localDay(at)])].slice(-400) }))
  await $.store.set('lifetime', life)
  $.ui.toast(`${exercise.name} done, +${kcal.toFixed(1)} kcal`)
  $.ui.status(`Fitness: ${summary(session)}`)
  if (await read($, isWorking)) await countdown($, 'rest', REST_MS)
  else await update($, current, () => null)
}

async function saveSettings($: EngineInterface, change: (one: Preferences) => Preferences) {
  await $.store.set('settings', await update($, settings, change))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'fitness', description: 'Exercise stats and settings', argumentHint: '[weight <kg>]' })
    const saved = (await $.store.get('settings')) as Partial<Preferences> | undefined
    const life = (await $.store.get('lifetime')) as Lifetime | undefined
    await update($, settings, one => ({ ...one, ...saved }))
    if (life) await update($, lifetime, () => life)
    await update($, current, () => null)
    await update($, isWorking, () => false)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await update($, isWorking, () => true)
    proposeTimer?.cancel()
    if ((await read($, current)) === null) proposeTimer = $.clock.after(TRIGGER_MS, () => void propose($))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    proposeTimer?.cancel()
    await update($, isWorking, () => false)
    return next(e)
  })

  on('command.run', { command: 'fitness' }, async ($, e) => {
    const weight = /^weight\s+(\d+(?:\.\d+)?)$/.exec(e.args.trim())
    if (weight) {
      const weightKg = Number(weight[1])
      await saveSettings($, one => ({ ...one, weightKg }))
      return { text: `Weight set to ${weightKg} kg.` }
    }
    await $.ui.open({ id: PANE, title: 'Fitness' })
    return { text: 'Fitness pane opened.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const one = await read($, current)
    const exercise = EXERCISES.find(each => each.id === one?.exerciseId)
    if (e.props.hasSurvey || one === null || !exercise) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const left = one.endsAt === null ? 0 : Math.max(0, Math.ceil((one.endsAt - (await read($, now))) / 1000))

    if (one.phase === 'rest') {
      return (
        <Box gap={1}>
          <Text dimColor>Nice. Rest {left} s</Text>
          <Button key="next" plain hotkey="1" onPress={() => void nextExercise($)}>Next</Button>
        </Box>
      )
    }
    return (
      <Box gap={1}>
        <Text bold>Fitness</Text>
        <Text>{exercise.reps ? `${exercise.name} × ${exercise.reps}` : `${exercise.name} · ${exercise.seconds} s`}</Text>
        <Text dimColor>{one.phase === 'timing' ? `${left} s left` : exercise.posture}</Text>
        <Button key="done" plain hotkey="1" onPress={() => void finish($, exercise.id)}>Done</Button>
        <Button key="skip" plain hotkey="2" onPress={() => void nextExercise($)}>Skip</Button>
        {one.phase === 'proposed' && !exercise.reps && (
          <Button key="start" plain hotkey="3" onPress={() => void countdown($, 'timing', exercise.seconds * 1000)}>Start timer</Button>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const [session, life, prefs, at] = await Promise.all([read($, sessionStats), read($, lifetime), read($, settings), $.clock.now()])
    const top = Object.entries(life.byExercise).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const togglePosture = (posture: Posture) => (one: Preferences): Preferences => ({
      ...one,
      postures: one.postures.includes(posture) ? one.postures.filter(each => each !== posture) : [...one.postures, posture],
    })

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>This session</Text>
          <Text>{summary(session)}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold>All time</Text>
          <Text>{summary(life)} · {streak(life.days, at)}-day streak</Text>
          {top.map(([id, count]) => (
            <Text dimColor>{EXERCISES.find(one => one.id === id)?.name ?? id} × {count}</Text>
          ))}
        </Box>
        <Box flexDirection="column">
          <Text bold>Preferences</Text>
          <Text>{prefs.weightKg} kg (change with /fitness weight {'<kg>'})</Text>
          <Box gap={1}>
            {POSTURES.map(posture => (
              <Button key={posture} plain hotkey={POSTURE_HOTKEYS[posture]} dimColor={!prefs.postures.includes(posture)} onPress={() => void saveSettings($, togglePosture(posture))}>
                {prefs.postures.includes(posture) ? '[x]' : '[ ]'} {posture}
              </Button>
            ))}
            <Button key="mute" plain hotkey="m" onPress={() => void saveSettings($, one => ({ ...one, isMuted: !one.isMuted }))}>
              {prefs.isMuted ? 'Unmute' : 'Mute'}
            </Button>
          </Box>
        </Box>
      </Box>
    )
  })
}
