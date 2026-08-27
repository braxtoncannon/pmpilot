import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const body = await request.json();

    const {
      projectName,
      recipientName,
      recipientRole,
      notificationType,
      taskTitle,
      dueDate,
    } = body;

    const prompt = `
You are drafting a short professional project-management email.

Project: ${projectName}
Recipient: ${recipientName}
Role: ${recipientRole}
Message type: ${notificationType}
Task or topic: ${taskTitle || "General project update"}
Due date: ${dueDate || "Not specified"}

Write:
1. A concise email subject.
2. A professional message of 2-4 sentences.

Keep it direct, useful, and appropriate for a project manager communicating with a teammate.

Return valid JSON only:
{
  "subject": "...",
  "message": "..."
}
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = response.output_text;

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subject: result.subject,
      message: result.message,
    });
  } catch (error) {
    console.error("Generate ping error:", error);

    return NextResponse.json(
      { error: "Unable to generate ping." },
      { status: 500 }
    );
  }
}

