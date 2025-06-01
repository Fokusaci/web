"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"

export default function ApologiesPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [apologies, setApologies] = useState<any[]>([])
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

      await loadApologies(currentUser.id)
      setLoading(false)
    }

    loadUserData()
  }, [router])

  const loadApologies = async (userId: string) => {
    const { data } = await supabase
      .from("apologies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    setApologies(data || [])
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tvé omluvenky</h1>
          </div>
          <Link href="/apologies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vytvořit novou
            </Button>
          </Link>
        </div>

        {apologies.length > 0 ? (
          <div className="space-y-4">
            {apologies.map((apology) => (
              <Card key={apology.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          Datum: {new Date(apology.activity_date).toLocaleDateString()}
                        </span>
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
                      <p className="text-gray-700 mb-2">
                        <strong>Důvod:</strong> {apology.reason}
                      </p>
                      {apology.admin_notes && (
                        <p className="text-gray-600 text-sm">
                          <strong>Poznámka administrátora:</strong> {apology.admin_notes}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm mt-2">
                        Odesláno: {new Date(apology.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Fíha! Nenašel jsem žádné omluvenky</p>
              <Link href="/apologies/new">
                <Button>Vytvořit omluvenku</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
