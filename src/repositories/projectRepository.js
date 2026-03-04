import { supabase } from '../lib/supabase'

/**
 * Project Repository
 * Handles all database operations related to projects
 */

export const projectRepository = {
    /**
     * Get all projects ordered by name
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getAllProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('name')

        return { data, error }
    },

    /**
     * Get a single project by ID
     * @param {string} id - Project ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async getProjectById(id) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    /**
     * Create a new project
     * @param {Object} projectData - Project data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async createProject(projectData) {
        const { data, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select()
            .single()

        return { data, error }
    },

    /**
     * Update an existing project
     * @param {string} id - Project ID
     * @param {Object} projectData - Updated project data
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async updateProject(id, projectData) {
        const { data, error } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    /**
     * Delete a project
     * @param {string} id - Project ID
     * @returns {Promise<{data: Object, error: Error|null}>}
     */
    async deleteProject(id) {
        const { data, error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        return { data, error }
    },

    /**
     * Check if a project is in use (has associated products)
     * @param {string} id - Project ID
     * @returns {Promise<{count: number, error: Error|null}>}
     */
    async checkProjectInUse(id) {
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id)

        return { count, error }
    }
}
