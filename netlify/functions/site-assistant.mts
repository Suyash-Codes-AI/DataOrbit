import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

type ChatMessage = { role: 'user' | 'model'; text: string };

const websiteContext = `You are Orbit, the concise website guide for DataOrbit, a multi-source data intelligence application.
Help users understand and navigate only this website. DataOrbit includes: a dashboard overview; an AI Analyst for natural-language data questions; a Visualization Studio; CSV Extraction & AI; a PostgreSQL Database Explorer; Query History; Saved Queries; a Document Center using RAG; settings; role-based access controls; dark/light themes; and guest access.
Be friendly and practical. Answer in 2-4 short sentences unless steps are helpful. Do not claim to see private user data or perform actions. If a question is unrelated to DataOrbit or using this website, politely redirect the user to website-related help.`;

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const body = await req.json() as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter((message) => (message.role === 'user' || message.role === 'model') && typeof message.text === 'string')
          .slice(-10)
          .map((message) => ({ ...message, text: message.text.trim().slice(0, 1200) }))
          .filter((message) => message.text.length > 0)
      : [];

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return Response.json({ error: 'A user message is required.' }, { status: 400 });
    }

    const transcript = messages.map((message) => `${message.role === 'user' ? 'Visitor' : 'Orbit'}: ${message.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${websiteContext}\n\nConversation:\n${transcript}\nOrbit:`,
      config: { maxOutputTokens: 350, temperature: 0.35 },
    });

    return Response.json({ reply: response.text?.trim() || 'I could not form a response. Please try again.' });
  } catch (error) {
    console.error('[Site assistant]', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Orbit is temporarily unavailable. Please try again shortly.' }, { status: 500 });
  }
};

export const config = { path: '/api/site-assistant' };
