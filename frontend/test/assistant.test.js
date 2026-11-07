import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.navigator = dom.window.navigator
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.localStorage = dom.window.localStorage
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const React = await import('react')
const { render, screen, fireEvent, cleanup, waitFor, act } = await import('@testing-library/react')
const originalFetch = globalThis.fetch
let vite
let SearchPage
let AuthProvider
let App
let MemoryRouter

before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  ;({ default: SearchPage } = await vite.ssrLoadModule('/src/pages/Search.jsx'))
  ;({ AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'))
  ;({ default: App } = await vite.ssrLoadModule('/src/App.jsx'))
  ;({ MemoryRouter } = await import('react-router-dom'))
})

after(async () => {
  cleanup()
  globalThis.fetch = originalFetch
  await vite.close()
  dom.window.close()
})

test('asks follow-up questions and geocodes a suggested city on demand', async () => {
  const requests = []
  localStorage.setItem('token', 'test-token')
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url === '/api/assistant') {
      const count = requests.filter(request => request.url === url).length
      return { ok: true, json: async () => count === 1
        ? { answer: 'Which country?', city: null }
        : { answer: 'Paris is the capital of France.', city: 'Paris, France' } }
    }
    if (url.startsWith('/api/geocode?')) {
      return { ok: true, json: async () => ({
        city: 'Paris, France', display_name: 'Paris, France', country: 'France', lat: 48.8566, lon: 2.3522
      }) }
    }
    throw new Error(`Unexpected request: ${url}`)
  }
  render(React.createElement(AuthProvider, null, React.createElement(SearchPage)))
  const input = screen.getByLabelText('Ask a city question')
  fireEvent.change(input, { target: { value: 'What is the capital?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ask assistant' }))
  await screen.findByText('Which country?')
  assert.equal(requests.some(request => request.url.startsWith('/api/geocode?')), false)
  fireEvent.change(input, { target: { value: 'France' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ask assistant' }))
  const button = await screen.findByRole('button', { name: 'Show Paris, France on map' })
  assert.deepEqual(JSON.parse(requests[1].options.body).messages, [
    { role: 'user', content: 'What is the capital?' },
    { role: 'assistant', content: 'Which country?' },
    { role: 'user', content: 'France' }
  ])
  assert.equal(requests[1].options.headers.Authorization, 'Bearer test-token')
  fireEvent.click(button)
  await waitFor(() => assert.ok(requests.some(request => request.url === '/api/geocode?city=Paris%2C%20France')))
  await screen.findByText('Paris, France', { exact: false, selector: 'p' })
  assert.equal(screen.getByRole('combobox').value, 'Paris, France')
  cleanup()
})

test('displays errors and preserves the question for retry', async () => {
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'The AI assistant is not configured.' }) })
  render(React.createElement(AuthProvider, null, React.createElement(SearchPage)))
  const input = screen.getByLabelText('Ask a city question')
  fireEvent.change(input, { target: { value: 'A city near Berlin with 500,000 people' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ask assistant' }))
  assert.equal((await screen.findByRole('alert')).textContent, 'The AI assistant is not configured.')
  assert.equal(input.value, 'A city near Berlin with 500,000 people')
  cleanup()
})

test('Enter submits, while Shift+Enter and composition do not', async () => {
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    return { ok: true, json: async () => ({ answer: 'Paris.', city: 'Paris, France' }) }
  }
  render(React.createElement(AuthProvider, null, React.createElement(SearchPage)))
  const input = screen.getByLabelText('Ask a city question')
  fireEvent.change(input, { target: { value: 'Capital of France?' } })
  assert.equal(fireEvent.keyDown(input, { key: 'Enter', shiftKey: true }), true)
  assert.equal(fireEvent.keyDown(input, { key: 'Enter', isComposing: true }), true)
  assert.equal(calls, 0)
  assert.equal(fireEvent.keyDown(input, { key: 'Enter' }), false)
  await screen.findByText('Paris.')
  assert.equal(calls, 1)
  cleanup()
})

test('preserves search, map, conversation and draft through History, and clears on logout', async () => {
  localStorage.setItem('token', 'test-token')
  globalThis.fetch = async (url) => {
    if (url === '/api/assistant') return { ok: true, json: async () => ({ answer: 'Paris.', city: 'Paris, France' }) }
    if (url.startsWith('/api/geocode?')) return { ok: true, json: async () => ({
      city: 'Paris', display_name: 'Paris, France', country: 'France', lat: 48.8566, lon: 2.3522
    }) }
    if (url === '/api/geocode/history') return { ok: true, json: async () => [] }
    if (url === '/api/auth/login') return { ok: true, json: async () => ({ token: 'new-token' }) }
    throw new Error(`Unexpected request: ${url}`)
  }
  const { container } = render(React.createElement(MemoryRouter, { initialEntries: ['/search'] }, React.createElement(App)))
  const input = screen.getByLabelText('Ask a city question')
  fireEvent.change(input, { target: { value: 'Capital of France?' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  fireEvent.click(await screen.findByRole('button', { name: 'Show Paris, France on map' }))
  await screen.findByText('Paris, France', { exact: false, selector: 'p' })
  const map = container.querySelector('.leaflet-container')
  assert.ok(map)
  fireEvent.change(input, { target: { value: 'A draft question' } })
  fireEvent.click(screen.getByRole('link', { name: 'History' }))
  await screen.findByText('No searches yet.')
  fireEvent.click(screen.getByRole('link', { name: 'Search' }))
  assert.equal(screen.getByRole('combobox').value, 'Paris, France')
  assert.equal(screen.getByLabelText('Ask a city question').value, 'A draft question')
  assert.ok(screen.getByText('Paris.'))
  assert.equal(container.querySelector('.leaflet-container'), map)
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
  const login = await screen.findByRole('button', { name: 'Login' })
  fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } })
  fireEvent.click(login)
  await screen.findByRole('heading', { name: 'City Geocoder' })
  assert.equal(screen.getByRole('combobox').value, '')
  assert.equal(screen.getByLabelText('Ask a city question').value, '')
  assert.equal(screen.queryByText('Paris.'), null)
  assert.equal(container.querySelector('.leaflet-container'), null)
  cleanup()
})

test('keeps an in-flight assistant response when navigating away and back', async () => {
  localStorage.setItem('token', 'test-token')
  let resolveResponse
  globalThis.fetch = async (url) => {
    if (url === '/api/assistant') return new Promise(resolve => { resolveResponse = resolve })
    if (url === '/api/geocode/history') return { ok: true, json: async () => [] }
    throw new Error(`Unexpected request: ${url}`)
  }
  render(React.createElement(MemoryRouter, { initialEntries: ['/search/'] }, React.createElement(App)))
  fireEvent.change(screen.getByLabelText('Ask a city question'), { target: { value: 'Capital of France?' } })
  fireEvent.keyDown(screen.getByLabelText('Ask a city question'), { key: 'Enter' })
  fireEvent.click(screen.getByRole('link', { name: 'History' }))
  await screen.findByText('No searches yet.')
  await act(async () => {
    resolveResponse({ ok: true, json: async () => ({ answer: 'Paris.', city: 'Paris, France' }) })
  })
  fireEvent.click(screen.getByRole('link', { name: 'Search' }))
  assert.ok(screen.getByText('Paris.'))
  assert.ok(screen.getByRole('button', { name: 'Show Paris, France on map' }))
  cleanup()
})
