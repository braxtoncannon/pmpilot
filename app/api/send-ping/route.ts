import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const body = await request.json();

    const {
      recipientEmail,
      recipientName,
      projectName,
      notificationType,
      subject,
      message,
    } = body;

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required email fields." },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "PMPilot <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; background:#020617; color:#e2e8f0; padding:32px;">
          <div style="max-width:600px; margin:auto; border:1px solid #164e63; border-radius:16px; padding:28px; background:#0f172a;">
            <p style="color:#22d3ee; font-size:12px; letter-spacing:2px; text-transform:uppercase;">
              PMPilot Mission Control
            </p>

            <h1 style="color:white;">
              ${notificationType || "Project Notification"}
            </h1>

            <p style="color:#94a3b8;">
              Mission: ${projectName || "PMPilot Project"}
            </p>

            <p style="margin-top:24px;">
              Hello ${recipientName || "Team Member"},
            </p>

            <p style="line-height:1.7;">
              ${message}
            </p>

            <hr style="border:none; border-top:1px solid #1e293b; margin:28px 0;" />

            <p style="font-size:12px; color:#64748b;">
              Sent through PMPilot AI Mission Control.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Send ping error:", error);

    return NextResponse.json(
      { error: "Unable to send email." },
      { status: 500 }
    );
  }
}

