import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseUser {
  id: string
  email: string
  username: string
  role: 'user' | 'admin' | 'moderator'
  avatar?: string
  bookmarks: string[]
  reading_history: Array<{
    comicId: string
    chapterId: string
    pageNumber: number
    timestamp: string
  }>
  joined_at: string
  created_at: string
  updated_at: string
}

export interface UserBookmark {
  id: string
  user_id: string
  comic_id: string
  created_at: string
}

// Database functions
export const dbQueries = {
  // User operations
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as DatabaseUser
  },

  async createUser(user: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data as DatabaseUser
  },

  async updateUser(userId: string, updates: Partial<DatabaseUser>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as DatabaseUser
  },

  // Bookmark operations
  async getUserBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('comic_id')
      .eq('user_id', userId)

    if (error) throw error
    return data.map(bookmark => bookmark.comic_id)
  },

  async addBookmark(userId: string, comicId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: userId,
        comic_id: comicId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeBookmark(userId: string, comicId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('comic_id', comicId)

    if (error) throw error
    return true
  },

  // Authentication
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}
