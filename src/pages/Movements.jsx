import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Plus, History, Edit2, ArrowRight } from 'lucide-react'
import { movementRepository } from '../repositories/movementRepository'
import MovementModal from '../components/MovementModal'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'
import { useAuth } from '../lib/AuthContext'

export default function Movements() {
    const { t } = useLanguage()
    const { item, role } = useAuth()
    const [movements, setMovements] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('ALL')

    const handleAddNew = () => {
        setIsModalOpen(true)
    }

    const fetchMovements = async () => {
        setLoading(true)
        try {
            const { data, error } = await movementRepository.getAllMovements()

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

    const filteredMovements = movements.filter(move => {
        const matchesType = filterType === 'ALL' || move.type === filterType

        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = (
            (move.products?.name || '').toLowerCase().includes(searchLower) ||
            (move.notes || '').toLowerCase().includes(searchLower) ||
            (move.products?.sku || '').toLowerCase().includes(searchLower)
        )

        return matchesType && matchesSearch
    })

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('movements.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('movements.subtitle')}</p>
                </div>
                {!item.isReader && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>{t('movements.register')}</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Search and Filter Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('products.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">{t('reports.all')}</option>
                        <option value="IN">{t('dashboard.in')}</option>
                        <option value="OUT">{t('dashboard.out')}</option>
                        <option value="TRANSFER">{t('movements.move')}</option>
                    </select>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
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
                                <th className="px-6 py-4">{t('products.project')}</th>
                                <th className="px-6 py-4">{t('movements.quantity')}</th>
                                <th className="px-6 py-4">{t('movements.notes')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{t('movements.loading')}</td>
                                </tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{t('movements.noMovements')}</td>
                                </tr>
                            ) : (
                                filteredMovements.map((move) => (
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
                                                    : move.type === 'OUT'
                                                        ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                                        : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                            )}>
                                                {move.type === 'IN' ? <ArrowUpRight size={14} /> :
                                                    move.type === 'OUT' ? <ArrowDownLeft size={14} /> :
                                                        <ArrowRight size={14} />}
                                                {move.type === 'IN' ? t('dashboard.in') :
                                                    move.type === 'OUT' ? t('dashboard.out') :
                                                        t('movements.move')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {move.type === 'TRANSFER' ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-gray-500">{move.from_project?.name || 'Almacén Central'}</span>
                                                    <ArrowRight size={12} className="text-gray-400" />
                                                    <span className="font-medium">{move.project?.name || 'Almacén Central'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>{move.project?.name || 'Almacén Central'}</span>
                                                    {move.supplier && (
                                                        <span className="text-xs text-blue-600 dark:text-blue-400">Prov: {move.supplier.name}</span>
                                                    )}
                                                    {move.contractor && (
                                                        <span className="text-xs text-green-600 dark:text-green-400">Cont: {move.contractor.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {move.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                            {move.notes || '-'}
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
                }}
                onMovementSaved={() => {
                    fetchMovements()
                    setIsModalOpen(false)
                }}
            />
        </div >
    )
}
