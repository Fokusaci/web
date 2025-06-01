"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { ExternalLink, MessageSquare, CheckCircle } from "lucide-react"

export default function DiscordPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [discordUsername, setDiscordUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      const { data: profileData } = await getUserProfile(currentUser.id)
      setProfile(profileData)
      setDiscordUsername(profileData?.discord_username || "")
    }

    loadUserData()
  }, [router])

  const handleDiscordVerification = async () => {
    if (!discordUsername.trim()) {
      setError("Prosím zadej tvé uživatelské jméno")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Update Discord username in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ discord_username: discordUsername })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Make API request to Discord verification endpoint
      const response = await fetch(
        `https://api.fokusaci.cz/discord/role?username=${encodeURIComponent(discordUsername)}&token=vv9S3OLxSjSbT46`,
      )

      if (response.ok) {
        // Update verification status
        await supabase.from("users").update({ discord_verified: true }).eq("id", user.id)

        setMessage("Verifikace proběhla! Nyní můžeš na server.")
        setProfile({ ...profile, discord_verified: true, discord_username: discordUsername })
      } else {
        setError("Verifikace se nepodařilo, zkontroluj tvé uživatelské jméno.")
      }
    } catch (err) {
      setError("Došlo k chybě při ověřování.")
    }

    setLoading(false)
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div>Načítání...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discord Komunita</h1>
        </div>

        {/* Discord Server Invitation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Připoj se na náš discord server
            </CardTitle>
            <CardDescription>Připoj se k nám a buď v obraze, ohledně novinek atd...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Klikni pro připojení se na discord</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">discord.gg/xDgAfGhz</code>
              </div>
              <a href="https://discord.gg/xDgAfGhz" target="_blank" rel="noopener noreferrer">
                <Button>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Připojit se
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Discord Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Discord verifikace
            </CardTitle>
            <CardDescription>Ověř si svůj účet, aby jsi získal přístup ke všem kanálům</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.discord_verified ? (
              <div className="flex items-center space-x-2">
                <Badge variant="default">Ověřený</Badge>
                <span className="text-sm text-gray-600">Uživatelské jméno: {profile.discord_username}</span>
              </div>
            ) : (
              <>
                {message && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="discord-username">Uživatelské jméno na discordu</Label>
                  <Input
                    id="discord-username"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="Zadej tvé uživatelské jméni"
                  />
                  <p className="text-sm text-gray-500">Zadej tvé uživatelské jméno (bez @ symbolu a #4444 čísel)</p>
                </div>

                <Button
                  onClick={handleDiscordVerification}
                  disabled={loading || !discordUsername.trim()}
                  className="w-full"
                >
                  {loading ? "Ověřuji..." : "Ověřit discord účet"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
