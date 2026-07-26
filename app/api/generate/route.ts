import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = `
Create a professional project plan.

Project Name: ${body.name}
Description: ${body.description}
Budget: ${body.budget}
Deadline: ${body.deadline}
Priority: ${body.priority}
Project Type: ${body.projectType}
Team Size: ${body.teamSize}

Generate:

1. Executive Summary
2. Timeline
3. Milestones
4. Tasks
5. Risks
6. Budget Recommendations
7. Success Metrics
`;

   const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content:
        "You are an expert senior project manager. Return professional, well-formatted Markdown with headings, tables when appropriate, and actionable recommendations.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
});

const projectPlan =
  completion.choices[0].message.content ?? "No project plan generated.";

return NextResponse.json({
  success: true,
  projectPlan,
});


  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate project." },
      { status: 500 }
    );
  }
}
