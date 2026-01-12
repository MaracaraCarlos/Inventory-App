import { useState, useEffect } from 'react'
import { FileText, Download, Loader2, ArrowUpRight, ArrowDownLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'
import { cn } from '../lib/utils'

export default function Reports() {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('stock') // 'stock' or 'movements'
    const [loading, setLoading] = useState(false)
    const [stockData, setStockData] = useState([])
    const [movementsData, setMovementsData] = useState([])
    const [stockFilter, setStockFilter] = useState('all') // 'all' or 'low'
    const [searchQuery, setSearchQuery] = useState('')
    const [stockSortConfig, setStockSortConfig] = useState({ key: 'name', direction: 'asc' })

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchStock()
        } else {
            fetchMovements()
        }
    }, [activeTab])

    const fetchStock = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`*, categories(name)`)
                .order('name')
            if (error) throw error
            setStockData(data || [])
        } catch (error) {
            console.error('Error fetching stock:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMovements = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('movements')
                .select(`*, products(name, sku)`)
                .order('created_at', { ascending: false })
            if (error) throw error
            setMovementsData(data || [])
        } catch (error) {
            console.error('Error fetching movements:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStockSort = (key) => {
        let direction = 'asc'
        if (stockSortConfig.key === key && stockSortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setStockSortConfig({ key, direction })
    }

    const getFilteredStock = () => {
        return stockData.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())

            if (stockFilter === 'low') {
                return matchesSearch && product.quantity <= (product.min_stock_level || 5)
            }
            return matchesSearch
        }).sort((a, b) => {
            if (!stockSortConfig.key) return 0

            let aValue, bValue

            switch (stockSortConfig.key) {
                case 'category':
                    aValue = a.categories?.name || ''
                    bValue = b.categories?.name || ''
                    break
                case 'stock':
                    aValue = a.quantity
                    bValue = b.quantity
                    break
                case 'price':
                    aValue = a.price
                    bValue = b.price
                    break
                case 'totalValue':
                    aValue = a.price * a.quantity
                    bValue = b.price * b.quantity
                    break
                default: // name
                    aValue = a.name
                    bValue = b.name
            }

            if (aValue < bValue) return stockSortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return stockSortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }

    const getFilteredMovements = () => {
        return movementsData.filter(move => {
            const productName = move.products?.name || ''
            return productName.toLowerCase().includes(searchQuery.toLowerCase())
        })
    }

    const generateStockPDF = () => {
        const doc = new jsPDF()
        const data = getFilteredStock()

        doc.setFontSize(18)
        doc.text(t('reports.currentStock'), 14, 22)
        doc.setFontSize(11)
        doc.text(`${t('reports.headers.date')}: ${new Date().toLocaleDateString()}`, 14, 30)
        if (stockFilter === 'low') doc.text(`(${t('reports.lowStock')})`, 80, 22)

        const tableColumn = [
            t('reports.headers.product'),
            t('reports.headers.category'),
            t('reports.headers.price'),
            t('reports.headers.stock'),
            t('reports.headers.totalValue')
        ]

        const tableRows = data.map(product => [
            product.name,
            product.categories?.name || t('products.uncategorized'),
            `$${product.price ? product.price.toFixed(2) : '0.00'}`,
            product.quantity,
            `$${(product.price * product.quantity).toFixed(2)}`
        ])

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
        })

        doc.save(`stock-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    }

    const generateMovementsPDF = () => {
        try {
            const doc = new jsPDF()
            const data = getFilteredMovements()

            doc.setFontSize(18)
            doc.text(t('reports.movements'), 14, 22)
            doc.setFontSize(11)
            doc.text(`${t('reports.headers.date')}: ${new Date().toLocaleDateString()}`, 14, 30)

            const tableColumn = [
                t('reports.headers.date'),
                t('reports.headers.product'),
                t('reports.headers.type'),
                t('reports.headers.quantity'),
                t('reports.headers.notes'),
                t('reports.headers.user')
            ]

            const tableRows = data.map(move => [
                new Date(move.created_at).toLocaleString(),
                move.products?.name || t('movements.deletedProduct'),
                move.type === 'IN' ? t('dashboard.in') : t('dashboard.out'),
                move.quantity,
                move.notes || '-',
                move.user_email || t('common.unknown')
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
            })

            doc.save(`movements-report-${new Date().toISOString().slice(0, 10)}.pdf`)
        } catch (error) {
            console.error('PDF Generation Error:', error)
            alert('Error generating PDF: ' + error.message)
        }
    }

    const filteredStock = getFilteredStock()
    const filteredMovements = getFilteredMovements()

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
                </div>
                <button
                    onClick={activeTab === 'stock' ? generateStockPDF : generateMovementsPDF}
                    disabled={loading || (activeTab === 'stock' ? filteredStock.length === 0 : filteredMovements.length === 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={20} />
                    <span>{t('reports.exportPDF')}</span>
                </button>
            </div>

            {/* Controls & Tabs */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => { setActiveTab('stock'); setSearchQuery(''); setStockFilter('all'); }}
                        className={cn(
                            "pb-3 px-1 font-medium text-sm transition-colors relative",
                            activeTab === 'stock'
                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        {t('reports.currentStock')}
                    </button>
                    <button
                        onClick={() => { setActiveTab('movements'); setSearchQuery(''); }}
                        className={cn(
                            "pb-3 px-1 font-medium text-sm transition-colors relative",
                            activeTab === 'movements'
                                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        {t('reports.movements')}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder={t('reports.searchProduct')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {activeTab === 'stock' && (
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">{t('reports.all')}</option>
                            <option value="low">{t('reports.lowStock')}</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                            {t('common.loading')}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium text-sm">
                                <tr>
                                    {activeTab === 'stock' ? (
                                        <>
                                            <th
                                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => handleStockSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {t('reports.headers.product')}
                                                    {stockSortConfig.key === 'name' ? (
                                                        stockSortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                                    ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => handleStockSort('category')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {t('reports.headers.category')}
                                                    {stockSortConfig.key === 'category' ? (
                                                        stockSortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                                    ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => handleStockSort('stock')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {t('reports.headers.stock')}
                                                    {stockSortConfig.key === 'stock' ? (
                                                        stockSortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                                    ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => handleStockSort('price')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {t('reports.headers.price')}
                                                    {stockSortConfig.key === 'price' ? (
                                                        stockSortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                                    ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                onClick={() => handleStockSort('totalValue')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {t('reports.headers.totalValue')}
                                                    {stockSortConfig.key === 'totalValue' ? (
                                                        stockSortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                                    ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                                </div>
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4">{t('reports.headers.date')}</th>
                                            <th className="px-6 py-4">{t('reports.headers.product')}</th>
                                            <th className="px-6 py-4">{t('reports.headers.type')}</th>
                                            <th className="px-6 py-4">{t('reports.headers.quantity')}</th>
                                            <th className="px-6 py-4">{t('reports.headers.notes')}</th>
                                            <th className="px-6 py-4">{t('reports.headers.user')}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activeTab === 'stock' ? (
                                    filteredStock.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                {t('reports.emptyStock')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStock.map(product => (
                                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.categories?.name || t('products.uncategorized')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded text-xs font-medium",
                                                        product.quantity <= (product.min_stock_level || 5)
                                                            ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                            : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                    )}>
                                                        {product.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">${product.price.toFixed(2)}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">${(product.price * product.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    filteredMovements.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                {t('reports.emptyMovements')}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMovements.map(move => (
                                            <tr key={move.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(move.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{move.products?.name || t('movements.deletedProduct')}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {move.products?.sku}</div>
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
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{move.quantity}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{move.notes || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{move.user_email || '-'}</td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div >
    )
}
