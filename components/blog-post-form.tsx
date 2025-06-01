"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface BlogPostFormProps {
  onSuccess: () => void
  userId: string
  post?: any
}

export default function BlogPostForm({ onSuccess, userId, post }: BlogPostFormProps) {
  const [title, setTitle] = useState(post?.title || "")
  const [content, setContent] = useState(post?.content || "")
  const [published, setPublished] = useState(post?.published || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (post) {
        // Update existing post
        const { error } = await supabase
          .from("blog_posts")
          .update({
            title: title.trim(),
            content: content.trim(),
            published,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id)

        if (error) throw error
      } else {
        // Create new post
        const { error } = await supabase.from("blog_posts").insert({
          title: title.trim(),
          content: content.trim(),
          author_id: userId,
          published,
        })

        if (error) throw error
      }

      onSuccess()
      setTitle("")
      setContent("")
      setPublished(false)
    } catch (err: any) {
      setError(err.message || "Failed to save blog post")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blog post title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your blog post content..."
          rows={8}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="published">Publish immediately</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : post ? "Update Post" : "Create Post"}
      </Button>
    </form>
  )
}
