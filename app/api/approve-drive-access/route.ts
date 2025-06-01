import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { requestId, status, adminNotes, adminId } = await request.json()

    if (!requestId || !status || !adminId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from("drive_access_requests")
      .update({
        status,
        admin_notes: adminNotes || null,
        approved_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select(`
        *,
        users!drive_access_requests_user_id_fkey (full_name, email)
      `)
      .single()

    if (updateError) throw updateError

    // If approved, grant drive access to the user
    if (status === "approved") {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ drive_access_granted: true })
        .eq("id", updatedRequest.user_id)

      if (userUpdateError) throw userUpdateError
    }

    // Send Discord notification about the decision
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (discordWebhookUrl) {
      try {
        const color = status === "approved" ? 0x27ae60 : 0xe74c3c
        const emoji = status === "approved" ? "✅" : "❌"

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: `${emoji} Drive Access Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                color,
                fields: [
                  {
                    name: "👤 User",
                    value: updatedRequest.users?.full_name || "Unknown",
                    inline: true,
                  },
                  {
                    name: "📧 Email",
                    value: updatedRequest.user_email,
                    inline: true,
                  },
                  {
                    name: "📝 Admin Notes",
                    value: adminNotes || "No notes provided",
                    inline: false,
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
      }
    }

    return NextResponse.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error("Approve drive access error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update request",
      },
      { status: 500 },
    )
  }
}
