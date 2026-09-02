import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectName,
      projectDescription,
      deadline,
      priority,
      budget,
      teamSize,
      status,
      tasks,
      milestones,
      members,
      question,
    } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are PMPilot's AI Project Assistant.

You are analyzing an EXISTING project.

Answer the user's question directly using only the project information below.
Do not invent facts.

PROJECT
Name: ${projectName}
Description: ${projectDescription}
Status: ${status}
Priority: ${priority}
Deadline: ${deadline}
Budget: ${
      budget === null || budget === undefined
        ? "Not set"
        : `$${Number(budget).toLocaleString()}`
    }
Expected Team Size: ${teamSize}

TASKS
${JSON.stringify(tasks, null, 2)}

MILESTONES
${JSON.stringify(milestones, null, 2)}

TEAM
${JSON.stringify(members, null, 2)}

USER QUESTION
${question}

Rules:
- Be concise and practical.
- Use the supplied data.
- Identify overdue, high-priority, unassigned, or risky work when relevant.
- Prioritize recommendations.
- If asked for a status update, write a stakeholder-ready update.
- If information is missing, say so.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    return NextResponse.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("Project assistant error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process project assistant request.",
      },
      { status: 500 }
    );
  }
}

