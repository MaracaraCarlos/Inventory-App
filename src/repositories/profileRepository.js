import { supabase } from '../lib/supabase'

export const profileRepository = {
    /**
     * Get profile by user ID
     * @param {string} userId
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        return { data, error }
    },

    /**
     * Update profile
     * @param {string} userId
     * @param {Object} updates
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()

        return { data, error }
    }
}
