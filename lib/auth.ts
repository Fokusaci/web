import { supabase } from "./supabase"

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  // First check if user exists in the users table
  let { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  // If user doesn't exist in users table but exists in auth, create the user record
  if (!data && !error) {
    const { data: authUser } = await supabase.auth.getUser()
    if (authUser?.user) {
      await supabase.from("users").insert({
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: authUser.user.user_metadata.full_name || authUser.user.email,
        role: "student",
        invitation_accepted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Fetch the newly created user
      const { data: newData } = await supabase.from("users").select("*").eq("id", userId).single()
      data = newData
    }
  }

  return { data, error }
}
