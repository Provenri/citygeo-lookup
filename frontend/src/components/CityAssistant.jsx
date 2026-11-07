import { useState } from 'react'
import { askAssistant } from '../services/api.js'

export function useCityAssistant(token) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const text = question.trim()
    if (!text || loading) return
    const userMessage = { role: 'user', content: text }
    const context = [...messages.slice(-8).map(({ role, content }) => ({ role, content })), userMessage]
    setError('')
    setLoading(true)
    try {
      const response = await askAssistant(context, token)
      setMessages(previous => [...previous, userMessage, { role: 'assistant', content: response.answer, city: response.city }])
      setQuestion('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { messages, question, setQuestion, loading, error, submit }
}

export function CityAssistantForm({ assistant }) {
  const { question, setQuestion, loading, error, submit } = assistant
  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      submit(event)
    }
  }

  return (
    <section className="mt-6 bg-white p-4 rounded shadow" aria-labelledby="assistant-heading">
      <h2 id="assistant-heading" className="text-xl font-bold mb-2">City AI assistant</h2>
      <p className="text-sm text-gray-600 mb-2">
        Ask about a city, for example: “What is the capital of France?” or “Suggest a city near Berlin with 500,000 people.”
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Messages are sent to OpenRouter and its selected model provider. AI answers can be inaccurate; population and distance estimates are not verified.
        Chat stays in memory until you log out or reload.
      </p>
      {error && <p role="alert" className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="assistant-question" className="font-semibold">Ask a city question</label>
        <textarea
          id="assistant-question"
          className="w-full border p-2 rounded"
          rows={2}
          maxLength={2000}
          value={question}
          onChange={event => setQuestion(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          required
          aria-describedby="assistant-keyboard"
        />
        <p id="assistant-keyboard" className="text-sm text-gray-600">Press Enter to send, or Shift+Enter for a new line.</p>
        <button type="submit" disabled={loading || !question.trim()} className="self-start bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'Asking...' : 'Ask assistant'}
        </button>
      </form>
    </section>
  )
}

export function CityAssistantHistory({ assistant, onShowCity, searchLoading }) {
  const { messages, loading } = assistant
  return (
    <section className="bg-white p-4 rounded shadow" aria-labelledby="conversation-heading">
      <h2 id="conversation-heading" className="text-xl font-bold mb-2">Assistant conversation</h2>
      <div aria-live="polite">
        {messages.length === 0 && !loading && <p className="text-sm text-gray-600">Your conversation will appear here.</p>}
        {messages.map((message, index) => (
          <div key={index} className="border-t py-3">
            <p className="font-semibold">{message.role === 'user' ? 'You' : 'Assistant'}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.city && (
              <button
                type="button"
                disabled={searchLoading}
                onClick={() => onShowCity(message.city)}
                className="mt-2 text-blue-700 underline disabled:opacity-50"
              >
                Show {message.city} on map
              </button>
            )}
          </div>
        ))}
        {loading && <p className="text-sm mb-2">Thinking...</p>}
      </div>
    </section>
  )
}
