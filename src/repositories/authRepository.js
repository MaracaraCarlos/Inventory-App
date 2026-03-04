import { supabase } from '../lib/supabase'

/**
 * Auth Repository
 * Handles all authentication operations
 */

export const authRepository = {
    /**
     * Get the current authenticated user
     * @returns {Promise<{data: {user: Object}, error: Error|null}>}
     */
    async getCurrentUser() {
        const { data, error } = await supabase.auth.getUser()
        return { data, error }
    },

    /**
     * Get the current session
     * @returns {Promise<{data: {session: Object}, error: Error|null}>}
     */
    async getSession() {
        const { data, error } = await supabase.auth.getSession()
        return { data, error }
    },

    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    /**
     * Sign out the current user
     * @returns {Promise<{error: Error|null}>}
     */
    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    /**
     * Subscribe to auth state changes
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription object
     */
    onAuthStateChange(callback) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
        return subscription
    }
}
