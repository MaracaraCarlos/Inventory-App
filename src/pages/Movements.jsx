import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Plus, History, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MovementModal from '../components/MovementModal'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'

export default function Movements() {
    const { t } = useLanguage()
    const [movements, setMovements] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMovement, setEditingMovement] = useState(null)

    const handleEdit = (movement) => {
        setEditingMovement(movement)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingMovement(null)
        setIsModalOpen(true)
    }

    const fetchMovements = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('movements')
                .select(`
          *,
          products (name, sku)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMovements(data || [])
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMovements()
    }, [])

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('movements.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('movements.subtitle')}</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>{t('movements.register')}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <History size={18} />
                        <span className="font-medium">{t('movements.recentHistory')}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium text-sm">
                            <tr>
                                <th className="px-6 py-4">{t('movements.date')}</th>
                                <th className="px-6 py-4">{t('movements.product')}</th>
                                <th className="px-6 py-4">{t('movements.type')}</th>
                                <th className="px-6 py-4">{t('movements.quantity')}</th>
                                <th className="px-6 py-4">{t('movements.notes')}</th>
                                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{t('movements.loading')}</td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{t('movements.noMovements')}</td>
                                </tr>
                            ) : (
                                movements.map((move) => (
                                    <tr key={move.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group border-gray-100 dark:border-gray-700">
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(move.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{move.products?.name || t('movements.deletedProduct')}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{move.products?.sku}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                move.type === 'IN'
                                                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                                    : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                            )}>
                                                {move.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                {move.type === 'IN' ? t('dashboard.in') : t('dashboard.out')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {move.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                            {move.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(move)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MovementModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingMovement(null)
                }}
                movementToEdit={editingMovement}
                onMovementSaved={() => {
                    fetchMovements()
                    setIsModalOpen(false)
                    setEditingMovement(null)
                }}
            />
        </div>
    )
}
