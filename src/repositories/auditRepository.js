import { supabase } from '../lib/supabase'

export const auditRepository = {
    /**
     * Get audit logs
     * @returns {Promise<{data: Array, error: Error|null}>}
     */
    async getLogs() {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })

        return { data, error }
    },

    /**
     * Clear all audit logs
     * @returns {Promise<{error: Error|null}>}
     */
    async clearLogs() {
        // Since we enabled RLS 'Admins can delete', this should work for admins.
        // We delete everything.
        const { error } = await supabase
            .from('audit_logs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Hack to delete all rows (supabase sometimes requires a where clause)

        return { error }
    }
}
