"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"

export default function InvitePage({ params }: { params: { token: string } }) {
  const [user, setUser] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validToken, setValidToken] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkToken = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("invitation_token", params.token)
        .eq("invitation_accepted", false)
        .single()

      if (data) {
        setUser(data)
        setValidToken(true)
      } else {
        setError("Invalid or expired invitation token")
      }
    }

    checkToken()
  }, [params.token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create auth user with the same UUID as the users table entry
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: password,
        options: {
          data: {
            full_name: user.full_name,
          },
        },
      })

      if (authError) throw authError

      // Update user record
      const { error: updateError } = await supabase
        .from("users")
        .update({
          invitation_accepted: true,
          invitation_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "An error occurred during setup")
    }

    setLoading(false)
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>{error || "Loading..."}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Complete Your Registration</CardTitle>
            <CardDescription className="text-center">
              Welcome {user?.full_name}! Set your password to complete your account setup.
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting up account..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
