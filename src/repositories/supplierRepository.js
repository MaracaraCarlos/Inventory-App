import { supabase } from '../lib/supabase'

/**
 * Supplier Repository
 * Handles all database operations related to suppliers
 */

export const supplierRepository = {
    /**
     * Get all suppliers ordered by name
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllSuppliers() {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name')

        return { data, error }
    },

    /**
     * Get a single supplier by ID
     * @param {string} id - Supplier ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getSupplierById(id) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    /**
     * Create a new supplier
     * @param {Object} supplierData - Supplier data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createSupplier(supplierData) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([supplierData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing supplier
     * @param {string} id - Supplier ID
     * @param {Object} supplierData - Updated supplier data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateSupplier(id, supplierData) {
        const { data, error } = await supabase
            .from('suppliers')
            .update(supplierData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a supplier
     * @param {string} id - Supplier ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteSupplier(id) {
        const { data, error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
