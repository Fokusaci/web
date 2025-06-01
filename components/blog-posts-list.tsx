"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Edit, Trash2, Eye } from "lucide-react"
import BlogPostForm from "./blog-post-form"

interface BlogPostsListProps {
  posts: any[]
  onUpdate: () => void
}

export default function BlogPostsList({ posts, onUpdate }: BlogPostsListProps) {
  const [error, setError] = useState("")

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return

    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", postId)
      if (error) throw error
      onUpdate()
    } catch (err: any) {
      setError(err.message || "Failed to delete post")
    }
  }

  const togglePublished = async (postId: string, published: boolean) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ published: !published, updated_at: new Date().toISOString() })
        .eq("id", postId)

      if (error) throw error
      onUpdate()
    } catch (err: any) {
      setError(err.message || "Failed to update post")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {posts.map((post) => (
        <div key={post.id} className="p-4 border rounded">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-medium">{post.title}</h3>
              <p className="text-sm text-gray-500">
                By {post.users?.full_name} • {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={post.published ? "default" : "secondary"}>{post.published ? "Published" : "Draft"}</Badge>
            </div>
          </div>

          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{post.content}</p>

          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Blog Post</DialogTitle>
                  <DialogDescription>Update the blog post content</DialogDescription>
                </DialogHeader>
                <BlogPostForm onSuccess={onUpdate} userId={post.author_id} post={post} />
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" onClick={() => togglePublished(post.id, post.published)}>
              <Eye className="mr-1 h-4 w-4" />
              {post.published ? "Unpublish" : "Publish"}
            </Button>

            <Button size="sm" variant="outline" onClick={() => deletePost(post.id)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      ))}

      {posts.length === 0 && <p className="text-gray-500 text-center py-8">No blog posts created yet</p>}
    </div>
  )
}
