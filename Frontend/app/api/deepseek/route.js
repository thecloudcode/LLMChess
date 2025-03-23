import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'deepseek-ai/deepseek-r1-distill-llama-8b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      top_p: 0.7,
      max_tokens: 100,
      stream: false, // No streaming required
    });

    return Response.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
