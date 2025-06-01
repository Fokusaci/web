"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { FolderOpen, Lock, Send, Clock, CheckCircle, XCircle } from "lucide-react"

export default function FilesPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [accessRequest, setAccessRequest] = useState<any>(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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

      // Check for existing access request
      const { data: requestData } = await supabase
        .from("drive_access_requests")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      setAccessRequest(requestData)
      setLoading(false)
    }

    loadUserData()
  }, [router])

  const handleRequestAccess = async () => {
    if (!reason.trim()) {
      setError("Prosím zadej důvod pro přístup")
      return
    }

    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/request-drive-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          reason: reason.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Nešlo podat žádost")
      }

      setMessage("Úspěšně jsi podal žádost! Nyní vyčkej na administrátora.")
      setAccessRequest(result.request)
      setReason("")
    } catch (err: any) {
      setError(err.message || "Nešlo odeslat žádost. Kontaktuj administrátora")
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div>Načítání...</div>
        </div>
      </div>
    )
  }

  // If user has drive access, show the shared drive link
  if (profile?.drive_access_granted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="mr-2 h-5 w-5 text-green-600" />
                Sdílený disk
              </CardTitle>
              <CardDescription>Máš přístup na sdílený disk pro programy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Přístup byl udělen</span>
              </div>


              <Alert>
                <AlertDescription>
                  Přístup byl udělen. Klikni na tento text pro přejití na disk Google.
                </AlertDescription>
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shared Drive Access</h1>
          <p className="text-gray-600 mt-2">Request access to the Fokusáci shared drive</p>
        </div>

        {/* Existing Request Status */}
        {accessRequest && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Your Access Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    variant={
                      accessRequest.status === "approved"
                        ? "default"
                        : accessRequest.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {accessRequest.status === "approved" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {accessRequest.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                    {accessRequest.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {accessRequest.status.charAt(0).toUpperCase() + accessRequest.status.slice(1)}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm font-medium">Reason:</span>
                  <p className="text-sm text-gray-600 mt-1">{accessRequest.reason}</p>
                </div>

                {accessRequest.admin_notes && (
                  <div>
                    <span className="text-sm font-medium">Admin Notes:</span>
                    <p className="text-sm text-gray-600 mt-1">{accessRequest.admin_notes}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium">Submitted:</span>
                  <p className="text-sm text-gray-600">{new Date(accessRequest.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Access Form */}
        {(!accessRequest || accessRequest.status === "rejected") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Request Shared Drive Access
              </CardTitle>
              <CardDescription>
                Explain why you need access to the shared drive. Admins will review your request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{user?.email}</div>
                  <p className="text-xs text-gray-500">This email will be used for drive access</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Access Request</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you need access to the shared drive..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleRequestAccess} disabled={submitting} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting Request..." : "Submit Access Request"}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Your request will be sent to administrators via Discord</li>
                  <li>2. Admins will review your request and reason</li>
                  <li>3. You'll be notified of the decision</li>
                  <li>4. If approved, you'll receive access instructions</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Request Message */}
        {accessRequest && accessRequest.status === "pending" && (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Request Under Review</h3>
              <p className="text-gray-600">
                Your access request is being reviewed by administrators. You'll be notified once a decision is made.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
