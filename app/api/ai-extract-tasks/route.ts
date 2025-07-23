import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to mock if no API key
      return NextResponse.json({
        tasks: [
          'Set a specific exercise schedule',
          'Choose a type of exercise to start with',
          'Create a workout plan',
          'Find a workout buddy for motivation',
          'Set reminders to exercise',
          'Track progress and celebrate small wins'
        ],
        warning: 'OPENAI_API_KEY not set, using mock data.'
      });
    }

    // Behavioral coach system prompt
    const systemPrompt = `You are an AI that turns vague or emotional thoughts into concrete, simple, actionable tasks. Think like a behavioral coach. Tasks must be short, specific, and immediately executable. Avoid general advice or fluffy language.`;
    const exampleInput = 'I want to start exercising again but I keep putting it off.';
    const exampleOutput = [
      'Set a specific exercise schedule',
      'Choose a type of exercise to start with',
      'Create a workout plan',
      'Find a workout buddy for motivation',
      'Set reminders to exercise',
      'Track progress and celebrate small wins'
    ];

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: exampleInput },
      { role: 'assistant', content: JSON.stringify(exampleOutput, null, 2) },
      { role: 'user', content: text }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 300,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error('Failed to call OpenAI API');
    }
    const data = await response.json();
    let tasks: string[] = [];
    try {
      let content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        // Remove code block markers if present
        if (content.startsWith('```')) {
          content = content.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        }
        tasks = JSON.parse(content);
        if (!Array.isArray(tasks)) throw new Error('Not an array');
      }
    } catch {
      let content = data.choices?.[0]?.message?.content || '';
      if (content.startsWith('```')) {
        content = content.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
      }
      tasks = content
        .split('\n')
        .map((line: string) => line.replace(/^[-*]\s*/, '').trim())
        .filter((line: string) => line.length > 0);
    }
    if (!tasks.length) {
      throw new Error('No tasks extracted from AI response');
    }
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge'; 