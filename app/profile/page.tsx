"use client"

import type React from "react"

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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [discordUsername, setDiscordUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
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
      setFullName(profileData?.full_name || "")
      setDiscordUsername(profileData?.discord_username || "")
    }

    loadUserData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      setError("Celé jméno je vyžadováno.")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName.trim(),
          discord_username: discordUsername.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setMessage("Profil byl aktualizován!")
      setProfile({ ...profile, full_name: fullName, discord_username: discordUsername })
    } catch (err: any) {
      setError(err.message || "Nešlo aktualizovat tvého uživatele")
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
          <h1 className="text-3xl font-bold text-gray-900">Nastavení tvého uživatele</h1>
          <p className="text-gray-600 mt-2">Spravuj tvůj účet níže</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tvé soukromé informace</CardTitle>
            <CardDescription>Aktualizuj tvé údaje</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled />
                <p className="text-sm text-gray-500">Pro změnu e-mailu se obrať na administrátora v kroužku. :-)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Celé jméno</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tvé celé jméno"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discordUsername">Discord Uživatelské jméni</Label>
                <Input
                  id="discordUsername"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="Tvé uživatelské jméno"
                />
                <div className="flex items-center space-x-2">
                  <Badge variant={profile.discord_verified ? "default" : "secondary"}>
                    {profile.discord_verified ? "Ověřený" : "Neověřený"}
                  </Badge>
                  {!profile.discord_verified && discordUsername && (
                    <p className="text-sm text-gray-500">Navštiv discord stránku pro ověření</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Badge variant="outline">{profile.role === "admin" ? "Administrator" : "Student"}</Badge>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Aktualizuji..." : "Aktualizovat profil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
