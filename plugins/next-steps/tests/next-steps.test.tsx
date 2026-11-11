import { expect, test } from 'claude-code/testing'
import type { EngineInterface, On } from 'claude-code'

const PLUGIN = 'next-steps'

const REPLY = JSON.stringify([
  { label: 'run the tests', prompt: 'run the tests you just wrote' },
  { label: 'commit', prompt: 'commit this' },
])

const BAND = {
  plugin: PLUGIN,
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
} as const

type Sent = { filled: string[]; submitted: string[]; placed: string[] }

// The offer is built after the turn, detached from it: drain the queue until it lands.
async function settle(): Promise<void> {
  for (let i = 0; i < 2000; i += 1) await Promise.resolve()
}

async function offer($: EngineInterface, on: On, surface: 'terminal' | 'desktop' | 'vscode' | 'mobile'): Promise<Sent> {
  const sent: Sent = { filled: [], submitted: [], placed: [] }
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.list', () => ({ value: [] }))
  on('session.surfaces', () => ({ value: [surface] }) as any)
  on('model.fork', () => ({ value: { isAnswered: true, text: REPLY } }) as any)
  on('prompt.suggest', () => ({ isShown: true }))
  on('prompt.fill', (_, e) => {
    sent.filled.push(e.text)
    return { isFilled: true, text: e.text } as any
  })
  on('prompt.submit', (_, e) => {
    sent.submitted.push(e.text)
    return { text: e.text }
  })
  on('ui.place', (_, e) => {
    sent.placed.push(e.id)
    return { value: { isPlaced: true, requestId: `row-${e.id}` } }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }) as any)

  await $.session.start({ cwd: '/', surface, isInteractive: true } as any)
  await $.turn.complete({
    turnId: 't1',
    answer: 'x'.repeat(200),
    durationMs: 1,
    isAborted: false,
    reason: 'answer',
  } as any)
  await settle()
  return sent
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the band offers the suggestions on ${surface}, with no placed row`, async ($, on) => {
    const sent = await offer($, on, surface)
    expect(sent.placed).toEqual([])

    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.findAll({ type: 'Button' })).map(b => b.text)).toEqual(['run the tests', 'commit', 'dismiss'])
    await ui.press({ key: 's0' })
    await ui.unmount()

    if (surface === 'terminal') {
      expect(sent.filled).toEqual(['run the tests you just wrote'])
      expect(sent.submitted).toEqual([])
    } else {
      expect(sent.filled).toEqual([])
      expect(sent.submitted).toEqual(['run the tests you just wrote'])
    }
  })
}

for (const surface of ['vscode', 'mobile'] as const) {
  test(`a placed row offers the suggestions on ${surface}, and a press submits`, async ($, on) => {
    const sent = await offer($, on, surface)
    expect(sent.placed).toEqual(['offer-1'])

    const ui = await $.ui.mount({
      plugin: PLUGIN,
      component: 'Placed',
      requestId: 'row-offer-1',
      props: { id: 'offer-1', plugin: PLUGIN },
      surface,
    } as any)
    expect((await ui.findAll({ type: 'Button' })).map(b => b.text)).toEqual(['run the tests', 'commit', 'dismiss'])
    await ui.press({ key: 's1' })
    await ui.unmount()

    expect(sent.filled).toEqual([])
    expect(sent.submitted).toEqual(['commit this'])
  })
}

test('the placed row draws nothing on the terminal', async ($, on) => {
  await offer($, on, 'mobile')
  const ui = await $.ui.mount({
    plugin: PLUGIN,
    component: 'Placed',
    requestId: 'row-offer-1',
    props: { id: 'offer-1', plugin: PLUGIN },
    surface: 'terminal',
  } as any)
  expect(await ui.findAll({ type: 'Button' })).toEqual([])
  await ui.unmount()
})
