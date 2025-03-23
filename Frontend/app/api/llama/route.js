import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey : process.env.LLAMA_API_KEY,
    baseURL : process.env.LLAMA_BASE_URL,
})

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        if(!prompt) {
            return Response.json({ error: 'Prompt is required'}, {status: 400});
        }

        const completion = await openai.chat.completions.create({
            model: "nvidia/llama-3.3-nemotron-super-49b-v1",
            messages: [{role: 'user', content: prompt}],
            temperature: 0.6,
            top_p: 0.95,
            max_tokens: 100,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: false,
        });
        
        if (!completion || !completion.choices || completion.choices.length === 0) {
            console.error('Invalid response:', completion);
            return Response.json({ error: 'Invalid response from DeepSeek API' }, { status: 500 });
          }
      
          return Response.json({ response: completion.choices[0].message.content });
        } catch (error) {
          console.error('Error generating response:', error);
          return Response.json({ error: `Failed to generate response: ${error.message}` }, { status: 500 });
        }
}