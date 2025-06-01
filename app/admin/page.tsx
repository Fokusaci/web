"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile } from "@/lib/auth"
import Navbar from "@/components/navbar"
import { Plus, Check, X, FolderOpen } from "lucide-react"
import BlogPostForm from "@/components/blog-post-form"
import BlogPostsList from "@/components/blog-posts-list"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [apologies, setApologies] = useState<any[]>([])
  const [driveRequests, setDriveRequests] = useState<any[]>([])
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const [blogPosts, setBlogPosts] = useState<any[]>([])

  useEffect(() => {
    const loadAdminData = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      const { data: profileData } = await getUserProfile(currentUser.id)
      if (profileData?.role !== "admin") {
        router.push("/dashboard")
        return
      }

      setUser(currentUser)
      setProfile(profileData)

      await loadData()
      setLoading(false)
    }

    loadAdminData()
  }, [router])

  const loadData = async () => {
    // Load all users
    const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    // Load pending apologies
    const { data: apologiesData } = await supabase
      .from("apologies")
      .select(`
        *,
        users (full_name, email)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    // Load drive access requests
    const { data: driveRequestsData } = await supabase
      .from("drive_access_requests")
      .select(`
        *,
        users!drive_access_requests_user_id_fkey (full_name, email)
      `)
      .order("created_at", { ascending: false })

    // Load blog posts
    const { data: blogData } = await supabase
      .from("blog_posts")
      .select(`
        *,
        users (full_name, email)
      `)
      .order("created_at", { ascending: false })

    setUsers(usersData || [])
    setApologies(apologiesData || [])
    setDriveRequests(driveRequestsData || [])
    setBlogPosts(blogData || [])
  }

  const createInvitation = async () => {
    if (!newUserEmail || !newUserName) {
      setError("Please fill in all fields")
      return
    }

    try {
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const { error } = await supabase.from("users").insert({
        email: newUserEmail,
        full_name: newUserName,
        role: "student",
        invitation_token: invitationToken,
        invitation_accepted: false,
      })

      if (error) throw error

      alert(`Invitation created! Send this link to the user: ${window.location.origin}/invite/${invitationToken}`)

      setNewUserEmail("")
      setNewUserName("")
      await loadData()
    } catch (err: any) {
      setError(err.message || "Failed to create invitation")
    }
  }

  const updateApologyStatus = async (apologyId: string, status: string, adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from("apologies")
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", apologyId)

      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError(err.message || "Failed to update apology")
    }
  }

  const updateDriveAccessRequest = async (requestId: string, status: string, adminNotes?: string) => {
    try {
      const response = await fetch("/api/approve-drive-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          status,
          adminNotes,
          adminId: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update request")
      }

      await loadData()
    } catch (err: any) {
      setError(err.message || "Failed to update drive access request")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, drive access, and apologies</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="drive-access">Drive Access</TabsTrigger>
            <TabsTrigger value="apologies">Apologies</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and invitations</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Invite User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>Create an invitation for a new student</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="student@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Student Name"
                          />
                        </div>
                        <Button onClick={createInvitation} className="w-full">
                          Create Invitation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                          <Badge variant={user.invitation_accepted ? "default" : "destructive"}>
                            {user.invitation_accepted ? "Active" : "Pending"}
                          </Badge>
                          {user.discord_verified && <Badge variant="outline">Discord Verified</Badge>}
                          {user.drive_access_granted && <Badge variant="outline">Drive Access</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drive-access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  Drive Access Requests
                </CardTitle>
                <CardDescription>Review and approve shared drive access requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driveRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{request.users?.full_name}</p>
                          <p className="text-sm text-gray-500">{request.user_email}</p>
                        </div>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                      {request.admin_notes && (
                        <p className="text-gray-600 text-sm mb-3">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mb-3">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>

                      {request.status === "pending" && (
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Drive Access</DialogTitle>
                                <DialogDescription>Approve access for {request.users?.full_name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea placeholder="Optional admin notes..." id={`approve-notes-${request.id}`} />
                                <Button
                                  onClick={() => {
                                    const notes = (
                                      document.getElementById(`approve-notes-${request.id}`) as HTMLTextAreaElement
                                    )?.value
                                    updateDriveAccessRequest(request.id, "approved", notes)
                                  }}
                                  className="w-full"
                                >
                                  Approve Access
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <X className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Drive Access</DialogTitle>
                                <DialogDescription>Reject access for {request.users?.full_name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Reason for rejection..."
                                  id={`reject-notes-${request.id}`}
                                  required
                                />
                                <Button
                                  onClick={() => {
                                    const notes = (
                                      document.getElementById(`reject-notes-${request.id}`) as HTMLTextAreaElement
                                    )?.value
                                    if (notes.trim()) {
                                      updateDriveAccessRequest(request.id, "rejected", notes)
                                    }
                                  }}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  Reject Access
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                  {driveRequests.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No drive access requests</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apologies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Apologies</CardTitle>
                <CardDescription>Review and approve student absence requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apologies.map((apology) => (
                    <div key={apology.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{apology.users?.full_name}</p>
                          <p className="text-sm text-gray-500">{apology.users?.email}</p>
                        </div>
                        <Badge variant="secondary">{new Date(apology.activity_date).toLocaleDateString()}</Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{apology.reason}</p>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => updateApologyStatus(apology.id, "approved")}>
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateApologyStatus(apology.id, "rejected")}>
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {apologies.length === 0 && <p className="text-gray-500 text-center py-8">No pending apologies</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Blog Management</CardTitle>
                    <CardDescription>Create and manage blog posts</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Blog Post</DialogTitle>
                        <DialogDescription>Write a new blog post for the community</DialogDescription>
                      </DialogHeader>
                      <BlogPostForm onSuccess={loadData} userId={user.id} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <BlogPostsList posts={blogPosts} onUpdate={loadData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
