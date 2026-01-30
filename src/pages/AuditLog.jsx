import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auditRepository } from '../repositories/auditRepository'
import { useLanguage } from '../lib/LanguageContext'
import { cn } from '../lib/utils'

export default function AuditLog() {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedLog, setSelectedLog] = useState(null)
    const [filterTable, setFilterTable] = useState('ALL')

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const { data, error } = await auditRepository.getLogs()
            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Error fetching logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleClearLogs = async () => {
        if (!window.confirm('¿Estás seguro de que quieres borrar TODO el historial? Esta acción no se puede deshacer.')) return

        try {
            const { error } = await auditRepository.clearLogs()
            if (error) throw error
            fetchLogs()
        } catch (error) {
            alert('Error deleting logs: ' + error.message)
        }
    }

    const filteredLogs = logs.filter(log => {
        if (filterTable === 'ALL') return true
        return log.table_name === filterTable
    })

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    const getOperationColor = (op) => {
        switch (op) {
            case 'INSERT': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
            case 'UPDATE': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
            case 'DELETE': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
            default: return 'text-gray-600'
        }
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>{t('common.back')}</span>
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Auditoría del Sistema</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Registro de actividades y cambios en la base de datos
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchLogs}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg"
                            title="Recargar"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={handleClearLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
                        >
                            <Trash2 size={20} />
                            <span>Borrar Historial</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['ALL', 'products', 'projects', 'movements', 'suppliers', 'contractors'].map(table => (
                    <button
                        key={table}
                        onClick={() => setFilterTable(table)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            filterTable === table
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                    >
                        {table === 'ALL' ? 'Todos' : table.charAt(0).toUpperCase() + table.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {filterTable === 'ALL' ? 'No hay registros de auditoría' : `No hay registros para ${filterTable}`}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Acción</th>
                                    <th className="px-6 py-4">Tabla</th>
                                    <th className="px-6 py-4 text-right">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {log.user_email || log.user?.email || 'Sistema/Desconocido'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-xs font-bold",
                                                getOperationColor(log.operation)
                                            )}>
                                                {log.operation}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {log.table_name}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Detalle del Cambio</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                                <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Antes (Old)</h4>
                                <pre className="text-xs overflow-auto max-h-60 text-gray-700 dark:text-gray-300">
                                    {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : 'N/A'}
                                </pre>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                                <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">Después (New)</h4>
                                <pre className="text-xs overflow-auto max-h-60 text-gray-700 dark:text-gray-300">
                                    {selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : 'N/A'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
