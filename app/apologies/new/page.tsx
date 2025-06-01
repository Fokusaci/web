"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"

export default function NewApologyPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activityDate, setActivityDate] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)

      // Get user profile to ensure it exists
      const { data } = await getUserProfile(currentUser.id)
      setProfile(data)
    }

    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activityDate || !reason.trim()) {
      setError("Prosím vyplňn všechny pole")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Make sure we're using the profile ID which should match the auth user ID
      if (!profile || !profile.id) {
        throw new Error("User profile not found")
      }

      const { error } = await supabase.from("apologies").insert({
        user_id: profile.id,
        activity_date: activityDate,
        reason: reason.trim(),
        status: "pending",
      })

      if (error) throw error

      router.push("/apologies")
    } catch (err: any) {
      setError(err.message || "Došlo k chybě")
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
        <Card>
          <CardHeader>
            <CardTitle>Odeslat omluvenku</CardTitle>
            <CardDescription>
              Nepřijdeš na hodinu? V pořádku, jen nám prosím dej vědět proč.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="activityDate">Datum</Label>
                <Input
                  id="activityDate"
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Důvod</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Prosím jednoduše napiš, proč se nebudeš účastnit."
                  rows={4}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Odesílám..." : "Odeslat"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
