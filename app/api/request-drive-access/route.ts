import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, reason } = await request.json()

    if (!userId || !userEmail || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from("drive_access_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request" }, { status: 400 })
    }

    // Create new access request
    const { data: request_data, error } = await supabase
      .from("drive_access_requests")
      .insert({
        user_id: userId,
        user_email: userEmail,
        reason: reason.trim(),
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    // Get user details for Discord notification
    const { data: userData } = await supabase.from("users").select("full_name").eq("id", userId).single()

    // Send Discord webhook notification
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (discordWebhookUrl) {
      try {
        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: "🗂️ New Shared Drive Access Request",
                color: 0x3498db,
                fields: [
                  {
                    name: "👤 User",
                    value: userData?.full_name || "Unknown",
                    inline: true,
                  },
                  {
                    name: "📧 Email",
                    value: userEmail,
                    inline: true,
                  },
                  {
                    name: "📝 Reason",
                    value: reason,
                    inline: false,
                  },
                  {
                    name: "🆔 Request ID",
                    value: request_data.id,
                    inline: true,
                  },
                ],
                timestamp: new Date().toISOString(),
                footer: {
                  text: "Fokusáci Admin Panel",
                },
              },
            ],
          }),
        })
      } catch (webhookError) {
        console.error("Discord webhook error:", webhookError)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ success: true, request: request_data })
  } catch (error) {
    console.error("Drive access request error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit request",
      },
      { status: 500 },
    )
  }
}
