import { supabase } from '../lib/supabase'

/**
 * Contractor Repository
 * Handles all database operations related to contractors
 */

export const contractorRepository = {
    /**
     * Get all contractors ordered by name
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllContractors() {
        const { data, error } = await supabase
            .from('contractors')
            .select('*')
            .order('name')

        return { data, error }
    },

    /**
     * Get a single contractor by ID
     * @param {string} id - Contractor ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getContractorById(id) {
        const { data, error } = await supabase
            .from('contractors')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    /**
     * Create a new contractor
     * @param {Object} contractorData - Contractor data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createContractor(contractorData) {
        const { data, error } = await supabase
            .from('contractors')
            .insert([contractorData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing contractor
     * @param {string} id - Contractor ID
     * @param {Object} contractorData - Updated contractor data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateContractor(id, contractorData) {
        const { data, error } = await supabase
            .from('contractors')
            .update(contractorData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a contractor
     * @param {string} id - Contractor ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteContractor(id) {
        const { data, error } = await supabase
            .from('contractors')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
