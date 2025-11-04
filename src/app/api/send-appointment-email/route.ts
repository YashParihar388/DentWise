import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📩 Received email request:", body);

    const {
      userEmail,
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      duration,
      price,
    } = body;

    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      console.error("❌ Missing fields:", body);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("✅ Sending email via Resend...");
    console.log("Using API key:", process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing");

    const { data, error } = await resend.emails.send({
      from: "DentWise <onboarding@resend.dev>", // Always works for testing
      to: ["yparihar8085@gmail.com"],
      subject: "Appointment Confirmation - DentWise",
      react: AppointmentConfirmationEmail({
        doctorName,
        appointmentDate,
        appointmentTime,
        appointmentType,
        duration,
        price,
      }),
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
    }

    console.log("✅ Email sent successfully:", data);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("🔥 Email route crashed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
