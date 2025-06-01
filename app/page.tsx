import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, MessageSquare, Shield } from "lucide-react"
import Navbar from "@/components/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to Fokusáci</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive platform for students to manage files, communicate, and stay organized with their
            activities.
          </p>
          <div className="space-x-4">
            <Link href="/login">
              <Button size="lg" className="px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/discord">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Join Discord
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>File Manager</CardTitle>
                <CardDescription>Upload, organize, and share files with your classmates</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Discord Integration</CardTitle>
                <CardDescription>Connect with the community through our Discord server</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Activity Management</CardTitle>
                <CardDescription>Submit apologies for missed activities easily</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription>Admin-managed accounts ensure a safe environment</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Fokusáci. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
