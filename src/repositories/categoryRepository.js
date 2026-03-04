import { supabase } from '../lib/supabase'

/**
 * Category Repository
 * Handles all database operations related to categories
 */

export const categoryRepository = {
    /**
     * Get all categories ordered by name
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        return { data, error }
    },

    /**
     * Get a single category by ID
     * @param {string} id - Category ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getCategoryById(id) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    /**
     * Create a new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createCategory(categoryData) {
        const { data, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing category
     * @param {string} id - Category ID
     * @param {Object} categoryData - Updated category data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateCategory(id, categoryData) {
        const { data, error } = await supabase
            .from('categories')
            .update(categoryData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a category
     * @param {string} id - Category ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteCategory(id) {
        const { data, error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
