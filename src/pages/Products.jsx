import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Filter, FolderPlus, X, AlertTriangle, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductModal from '../components/ProductModal'
import CategoryManager from '../components/CategoryManager'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'

export default function Products() {
    const { t } = useLanguage()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState(null)
    const [deleteEmail, setDeleteEmail] = useState('')
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchProducts = async () => {
        setLoading(true)
        try {
            // Fetch products with their category name
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    ),
                    projects (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const openDeleteModal = (product) => {
        setProductToDelete(product)
        setDeleteEmail('')
        setDeletePassword('')
        setDeleteError('')
        setDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setDeleteModalOpen(false)
        setProductToDelete(null)
        setDeleteEmail('')
        setDeletePassword('')
        setDeleteError('')
    }

    const handleDeleteConfirm = async (e) => {
        e.preventDefault()
        if (!productToDelete) return

        setDeleteLoading(true)
        setDeleteError('')

        try {
            // Verify user credentials
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: deleteEmail,
                password: deletePassword
            })

            if (authError) {
                setDeleteError(t('products.authError'))
                setDeleteLoading(false)
                return
            }

            // Delete the product
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productToDelete.id)

            if (error) throw error

            closeDeleteModal()
            fetchProducts()
        } catch (error) {
            setDeleteError(t('products.deleteError'))
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsModalOpen(true)
    }

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredProducts = products
        .filter(product => {
            const categoryName = product.categories?.name || ''
            const projectName = product.projects?.name || ''
            return (
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                projectName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0

            let aValue, bValue

            switch (sortConfig.key) {
                case 'category':
                    aValue = a.categories?.name || ''
                    bValue = b.categories?.name || ''
                    break
                case 'project':
                    aValue = a.projects?.name || ''
                    bValue = b.projects?.name || ''
                    break
                case 'name':
                    aValue = a.name
                    bValue = b.name
                    break
                case 'stock':
                    aValue = a.quantity
                    bValue = b.quantity
                    break
                case 'price':
                    aValue = a.price
                    bValue = b.price
                    break
                default:
                    aValue = a[sortConfig.key]
                    bValue = b[sortConfig.key]
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('products.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('products.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors shadow-sm"
                    >
                        <FolderPlus size={20} />
                        <span>{t('products.addCategory')}</span>
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>{t('products.add')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('products.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <Filter size={18} />
                        <span>{t('products.filter')}</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium text-sm">
                            <tr>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('products.name')}
                                        {sortConfig.key === 'name' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                        ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('products.category')}
                                        {sortConfig.key === 'category' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                        ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort('project')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('products.project')}
                                        {sortConfig.key === 'project' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                        ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort('price')}
                                >
                                    <div className="flex items-center gap-2">
                                        {t('products.price')}
                                        {sortConfig.key === 'price' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                        ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort('stock')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {t('products.stock')}
                                        {sortConfig.key === 'stock' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
                                        ) : <ArrowUpDown size={16} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {t('products.loading')}
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                                <Package size={32} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="font-medium text-gray-900 dark:text-white">{t('products.noProducts')}</p>
                                            <p className="text-sm mt-1">{t('products.startCreating')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group border-gray-100 dark:border-gray-700">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                {product.categories?.name || t('products.uncategorized')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.projects?.name ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                    {product.projects.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                                            ${product.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-sm font-medium",
                                                    product.quantity <= (product.min_stock_level || 5)
                                                        ? "bg-red-50 text-red-700"
                                                        : "bg-green-50 text-green-700"
                                                )}
                                            >
                                                {product.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(product)}
                                                    disabled={product.quantity > 0}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        product.quantity > 0
                                                            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                            : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                    )}
                                                    title={product.quantity > 0 ? t('products.cannotDeleteWithStock') : t('common.delete')}
                                                >
                                                    <Trash2 size={18} />
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

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={editingProduct}
                onProductSaved={() => {
                    setIsModalOpen(false)
                    fetchProducts()
                }}
            />

            <CategoryManager
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onCategoryChange={fetchProducts}
            />

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('products.deleteConfirmTitle')}
                                </h3>
                            </div>
                            <button
                                onClick={closeDeleteModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleDeleteConfirm} className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('products.deleteAuthMessage')} <strong className="text-gray-900 dark:text-white">{productToDelete?.name}</strong>
                            </p>

                            {deleteError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                    {deleteError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('products.email')}
                                </label>
                                <input
                                    type="email"
                                    value={deleteEmail}
                                    onChange={(e) => setDeleteEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder={t('products.emailPlaceholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('products.password')}
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deleteLoading && <Loader2 className="animate-spin" size={18} />}
                                    {t('common.delete')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
