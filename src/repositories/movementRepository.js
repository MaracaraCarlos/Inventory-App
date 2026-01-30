import { supabase } from '../lib/supabase'

/**
 * Movement Repository
 * Handles all database operations related to inventory movements
 */

export const movementRepository = {
    /**
     * Get all movements with related data
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllMovements() {
        const { data, error } = await supabase
            .from('movements')
            .select(`
        *,
        products (id, name, sku),
        project:projects!project_id (id, name),
        from_project:projects!from_project_id (id, name),
        supplier:suppliers (id, name),
        contractor:contractors (id, name)
      `)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    /**
     * Get movements for a specific product
     * @param {string} productId - Product ID
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getMovementsByProduct(productId) {
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .eq('product_id', productId)

        return { data, error }
    },

    /**
     * Get movements for a specific project
     * @param {string} projectId - Project ID
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getMovementsByProject(projectId) {
        const { data, error } = await supabase
            .from('movements')
            .select(`
        *,
        products (id, name, sku)
      `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    /**
     * Create a new movement
     * @param {Object} movementData - Movement data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createMovement(movementData) {
        const { data, error } = await supabase
            .from('movements')
            .insert([movementData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing movement
     * @param {string} id - Movement ID
     * @param {Object} movementData - Updated movement data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateMovement(id, movementData) {
        const { data, error } = await supabase
            .from('movements')
            .update(movementData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a movement
     * @param {string} id - Movement ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteMovement(id) {
        const { data, error } = await supabase
            .from('movements')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
