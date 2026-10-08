// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { afterEach, expect, it, vi } from 'vitest'
import { ConnectionCard, type Readiness } from '../src/client/ConnectionCard.tsx'
import { zh, en } from '../src/client/locales.ts'

afterEach(cleanup)

function fixture(initial: Readiness, dictionary = zh) {
  const state = createSnapshotStore(initial)
  const retry = vi.fn(async () => {})
  render(<ConnectionCard useReadiness={bindSnapshotSelector(state)} retry={retry} t={makeTranslate(dictionary)} />)
  return { state, retry }
}

it.each([zh, en])('explains manual deployment and does not confuse carrier failure with readiness', async (dictionary) => {
  const b = fixture({ status: { phase: 'ready', endpoint: 'http://127.0.0.1:8080/mcp' }, connected: true, error: null }, dictionary)
  expect(screen.getByText(dictionary.setup)).toBeTruthy()
  expect(screen.getByText(dictionary.discoveryOnly)).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe(dictionary['phase.ready'])
  act(() => { b.state.set({ ...b.state.getSnapshot(), connected: false, error: 'Carrier disconnected' }) })
  expect(screen.getByRole('status').textContent).toBe(dictionary.disconnected)
  const button = screen.getByRole('button', { name: dictionary.retry }) as HTMLButtonElement
  expect(button.disabled).toBe(true)
  fireEvent.click(button)
  expect(b.retry).not.toHaveBeenCalled()
  expect(screen.getByText('Carrier disconnected')).toBeTruthy()
})

it('retains deployment guidance and diagnostics when a retry fails', async () => {
  const b = fixture({ status: { phase: 'unavailable', endpoint: 'http://127.0.0.1:8080/mcp', message: 'Start recipe-flow' }, connected: true, error: null })
  b.retry.mockRejectedValueOnce(new Error('Request failed'))
  expect(screen.getByRole('status').textContent).toBe(zh['phase.unavailable'])
  fireEvent.click(screen.getByRole('button', { name: zh.retry }))
  await waitFor(() => { expect(screen.getByText('Request failed')).toBeTruthy() })
  expect(screen.getByText(zh.setup)).toBeTruthy()
  expect(b.retry).toHaveBeenCalledOnce()
})

it('disables repeated retry while the explicit connection attempt is pending', async () => {
  const b = fixture({ status: { phase: 'unavailable', endpoint: 'http://127.0.0.1:8080/mcp' }, connected: true, error: null })
  const barrier = Promise.withResolvers<undefined>()
  b.retry.mockReturnValueOnce(barrier.promise)
  fireEvent.click(screen.getByRole('button', { name: zh.retry }))
  const button = screen.getByRole('button', { name: zh.retry }) as HTMLButtonElement
  expect(button.disabled).toBe(true)
  fireEvent.click(button)
  expect(b.retry).toHaveBeenCalledOnce()
  await act(async () => { barrier.resolve(undefined); await barrier.promise })
  expect(button.disabled).toBe(false)
})
