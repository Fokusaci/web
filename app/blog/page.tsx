"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"
import { Calendar, User } from "lucide-react"

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select(`
          *,
          users (full_name)
        `)
        .eq("published", true)
        .order("created_at", { ascending: false })

      setPosts(data || [])
      setLoading(false)
    }

    loadPosts()
  }, [])

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">Latest news and updates from Fokusáci</p>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {post.users?.full_name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="default">Published</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No blog posts published yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
