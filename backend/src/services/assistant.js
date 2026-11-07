const SYSTEM_PROMPT = `You are a city geography assistant. Answer questions about cities and help users choose one city to show on a map.
Return a JSON object with "answer" and "city". "answer" is a concise plain-text response. "city" is either a specific geocodable city name including its country and, when needed, its region, or null if there is no clear city to show.
Ask a follow-up question if the request is ambiguous. Do not invent sources or claim to have checked current data. Population and distance figures are estimates and may be outdated; explicitly say so when relevant. Do not provide coordinates.`;

const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'city_assistant_response',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Concise answer or follow-up question.' },
        city: { type: ['string', 'null'], description: 'Geocodable city with country and region if needed, or null.' }
      },
      required: ['answer', 'city'],
      additionalProperties: false
    }
  }
};

function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function askAssistant(messages, apiKey, fetchImpl = fetch) {
  let response;
  let data;
  try {
    response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        provider: { require_parameters: true },
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        response_format: responseFormat,
        reasoning: { effort: 'low', exclude: true },
        max_tokens: 2048
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (response.status === 429) {
      throw serviceError('The AI service is rate limited. Please try again later.', 429);
    }
    if (!response.ok) {
      throw serviceError('The AI service is unavailable. Please try again later.', 503);
    }
    data = await response.json();
  } catch (error) {
    if (error.status) throw error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw serviceError('The AI service timed out. Please try again.', 504);
    }
    throw serviceError('The AI service is unavailable. Please try again later.', 503);
  }

  if (data?.choices?.[0]?.finish_reason === 'length') {
    throw serviceError('The AI response was incomplete. Please try again with a shorter question.', 502);
  }
  let result;
  try {
    result = JSON.parse(data?.choices?.[0]?.message?.content);
  } catch {
    throw serviceError('The AI service returned an invalid response. Please try again.', 502);
  }
  if (!result || typeof result !== 'object' || Array.isArray(result) ||
      typeof result.answer !== 'string' || !result.answer.trim() || result.answer.length > 2000 ||
      (result.city !== null && (typeof result.city !== 'string' || !result.city.trim() || result.city.length > 120))) {
    throw serviceError('The AI service returned an invalid response. Please try again.', 502);
  }
  return { answer: result.answer.trim(), city: result.city?.trim() || null };
}
