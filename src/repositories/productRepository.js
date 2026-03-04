import { supabase } from '../lib/supabase'

/**
 * Product Repository
 * Handles all database operations related to products
 */

export const productRepository = {
    /**
     * Get all products with their categories
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllProducts() {
        const { data, error } = await supabase
            .from('products')
            .select(`*, categories (id, name)`)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    /**
     * Get a single product by ID
     * @param {string} id - Product ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getProductById(id) {
        const { data, error } = await supabase
            .from('products')
            .select(`*, categories (id, name)`)
            .eq('id', id)
            .single()

        return { data, error }
    },

    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createProduct(productData) {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing product
     * @param {string} id - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateProduct(id, productData) {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a product
     * @param {string} id - Product ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteProduct(id) {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        return { data, error }
    },

    /**
     * Delete multiple products
     * @param {Array<string>} ids - Array of Product IDs
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteMultipleProducts(ids) {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .in('id', ids)

        return { data, error }
    },

    /**
     * Update product quantity
     * @param {string} id - Product ID
     * @param {number} newQuantity - New quantity value
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateProductQuantity(id, newQuantity) {
        const { data, error } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    }
}
