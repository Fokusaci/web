"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { MessageSquare, Calendar, Users, ExternalLink, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    apologies: 0,
    recentApologies: [],
    driveAccessStatus: null,
  })
  const [loading, setLoading] = useState(true)
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

      // Load user statistics
      const { data: apologies } = await supabase
        .from("apologies")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(5)

      // Load drive access request status
      const { data: driveRequest } = await supabase
        .from("drive_access_requests")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      setStats({
        apologies: apologies?.length || 0,
        recentApologies: apologies || [],
        driveAccessStatus: driveRequest,
      })

      setLoading(false)
    }

    loadUserData()
  }, [router])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vítej, {profile?.full_name}!</h1>
          <p className="text-gray-600 mt-2">Tady jsou rychlé statistiky</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sdílený disk</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.drive_access_granted ? "Schváleno" : "Čekání"}</div>
              <p className="text-xs text-muted-foreground">
                {stats.driveAccessStatus?.status === "pending"
                  ? "Čekání"
                  : profile?.drive_access_granted
                    ? "Přístup byl přidělen"
                    : "Požádat o přístup"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Omluvenky</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.apologies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discord Status</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={profile?.discord_verified ? "default" : "secondary"}>
                {profile?.discord_verified ? "Ověřený" : "Neověřený"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{profile?.role === "admin" ? "Administrator" : "Student"}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sdílený disk</CardTitle>
              <CardDescription>
                {profile?.drive_access_granted
                  ? "Zobraz si sdílené programy"
                  : stats.driveAccessStatus?.status === "pending"
                    ? "Tvá žádost se zpracovává"
                    : "Zažádej si o přístup k sdílenému disku"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/files">
                <Button className="w-full">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {profile?.drive_access_granted
                    ? "Zobrazit disk"
                    : stats.driveAccessStatus?.status === "pending"
                      ? "Zobrazit žádost"
                      : "Zažádat o přístup"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Podat omluvenku</CardTitle>
              <CardDescription>Předchozí omluvenky:</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/apologies/new">
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Podat omluvenku
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discord Kommunita</CardTitle>
              <CardDescription>Připoj se na náš discord server</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/discord">
                <Button className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Připojit se na discord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Předchozí omluvenky</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentApologies.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentApologies.map((apology: any) => (
                    <div key={apology.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{new Date(apology.activity_date).toLocaleDateString()}</span>
                      <Badge
                        variant={
                          apology.status === "approved"
                            ? "default"
                            : apology.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {apology.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Fíhá! Nenašel jsem žádné omluvenky</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status sdíleného disku</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.drive_access_granted ? (
                <div className="text-center py-4">
                  <div className="text-green-600 mb-2">✅ Přístup udělen</div>
                  <p className="text-sm text-gray-600">Máš přístup na sdílený disk!</p>
                </div>
              ) : stats.driveAccessStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge
                      variant={
                        stats.driveAccessStatus.status === "approved"
                          ? "default"
                          : stats.driveAccessStatus.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {stats.driveAccessStatus.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Odesláno: {new Date(stats.driveAccessStatus.created_at).toLocaleDateString()}
                  </p>
                  {stats.driveAccessStatus.admin_notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Poznámky:</strong> {stats.driveAccessStatus.admin_notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-2">Fíha! Stále jsi neodeslal žádost!</p>
                  <Link href="/files">
                    <Button size="sm">Požádat o přístup</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
