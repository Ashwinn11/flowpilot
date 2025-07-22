import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }

    // TODO: Replace with real OpenAI call
    // Example: const tasks = await callOpenAI(text);
    // For now, return a mocked response
    const tasks = [
      'Follow up on project proposal',
      'Schedule meeting with design team',
      'Review pull requests'
    ];

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge'; 