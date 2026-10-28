import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

function engineBelow(on: On) {
  on('command.register', () => ({ value: { command: 'fitness' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
}

const BAND = {
  plugin: 'fitness',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'fitness',
  component: 'Pane',
  requestId: 'fitness',
  props: {
    title: 'Fitness',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const TURN = { answer: 'ok', durationMs: 60_000, isAborted: false, turnId: 't1', reason: 'answer' } as const

test('a turn past 10 s proposes an exercise, done rests, idle clears', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  engineBelow(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })

  await $.turn.start({ text: 'do work', turnId: 't1' })
  await clock.advance(9_000)
  expect(await band.find({ key: 'done' })).toBeUndefined()

  await clock.advance(1_000)
  expect(await band.find({ key: 'done' })).toBeDefined()

  await band.press({ key: 'done' })
  expect(await band.find({ type: 'Text', text: /Rest/ })).toBeDefined()

  await clock.advance(30_000)
  expect(await band.find({ key: 'done' })).toBeDefined()

  await $.turn.complete(TURN)
  await band.press({ key: 'skip' })
  expect(await band.find({ key: 'done' })).toBeUndefined()
  await band.unmount()

  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await pane.find({ type: 'Text', text: /1 done/ }))?.text).toMatch(/1 done · \d+ kcal/)
  expect((await pane.find({ type: 'Text', text: /streak/ }))?.text).toMatch(/1-day streak/)
  await pane.unmount()
})

test('a timed hold counts down and logs itself', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { settings: { weightKg: 70, postures: ['floor'], isMuted: false } })
  engineBelow(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await $.turn.start({ text: 'do work', turnId: 't1' })

  let start = undefined
  for (let tries = 0; tries < 20 && !start; tries += 1) {
    await clock.advance(10_000)
    start = await band.find({ key: 'start' })
    if (!start) await band.press({ key: 'skip' })
  }
  expect(start).toBeDefined()

  await band.press({ key: 'start' })
  const left = (await band.find({ type: 'Text', text: /s left/ }))?.text ?? ''
  expect(left).toMatch(/^\d+ s left$/)
  await clock.advance(Number.parseInt(left, 10) * 1000 + 500)
  expect(await band.find({ type: 'Text', text: /Rest/ })).toBeDefined()
  await band.unmount()
})

test('a muted mod proposes nothing', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { settings: { weightKg: 70, postures: ['seated', 'standing', 'floor'], isMuted: true } })
  engineBelow(on)

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await $.turn.start({ text: 'do work', turnId: 't1' })
  await clock.advance(60_000)
  expect(await band.find({ key: 'done' })).toBeUndefined()
  await band.unmount()
})
