import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Filter, FolderPlus, X, AlertTriangle, Loader2, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare } from 'lucide-react'
import { productRepository } from '../repositories/productRepository'
import { projectRepository } from '../repositories/projectRepository'
import { movementRepository } from '../repositories/movementRepository'
import { authRepository } from '../repositories/authRepository'
import { useLocation } from 'react-router-dom'
import ProductModal from '../components/ProductModal'
import CategoryManager from '../components/CategoryManager'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'
import { useAuth } from '../lib/AuthContext'

export default function Products() {
    const { t } = useLanguage()
    const { item } = useAuth()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
    const [projects, setProjects] = useState([])
    const [movements, setMovements] = useState([])
    const [selectedProject, setSelectedProject] = useState('all')
    const [showLowStockOnly, setShowLowStockOnly] = useState(false)
    const [locationModalProduct, setLocationModalProduct] = useState(null)
    const [selectedProducts, setSelectedProducts] = useState([])

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
            // Fetch products
            const { data: prodData, error: prodError } = await productRepository.getAllProducts()

            if (prodError) throw prodError
            setProducts(prodData || [])

            // Fetch projects
            const { data: projData, error: projError } = await projectRepository.getAllProjects()

            if (projError) throw projError
            setProjects(projData || [])

            // Fetch movements for calculation
            const { data: movData, error: movError } = await movementRepository.getAllMovements()

            if (movError) throw movError
            setMovements(movData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const location = useLocation()

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const projectParam = params.get('project')
        const filterParam = params.get('filter')

        if (projectParam) {
            setSelectedProject(projectParam)
        }

        if (filterParam === 'lowStock') {
            setSortConfig({ key: 'stock', direction: 'asc' })
            // We'll use a local state or search term logic if needed, but for now 
            // the user wants to SEE low stock. We can set a specific filter state.
            // Let's add a 'showLowStockOnly' state.
            setShowLowStockOnly(true)
        } else {
            setShowLowStockOnly(false)
        }
    }, [location.search])

    const openDeleteModal = (productOrSelectedArray) => {
        // If it's an array, we are doing a mass delete
        if (Array.isArray(productOrSelectedArray)) {
            setProductToDelete(productOrSelectedArray)
        } else {
            setProductToDelete(productOrSelectedArray)
        }
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

        // If productToDelete is an array, we have multiple products. Otherwise, it's a single product object.
        const isMultiple = Array.isArray(productToDelete)

        setDeleteLoading(true)
        setDeleteError('')

        try {
            // Verify user credentials
            const { error: authError } = await authRepository.signIn(deleteEmail, deletePassword)

            if (authError) {
                setDeleteError(t('products.authError'))
                setDeleteLoading(false)
                return
            }

            // Delete product(s)
            if (isMultiple) {
                const { error } = await productRepository.deleteMultipleProducts(productToDelete)
                if (error) throw error
                setSelectedProducts([]) // Clear selection after mass delete
            } else {
                const { error } = await productRepository.deleteProduct(productToDelete.id)
                if (error) throw error
            }

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

    const getProjectStock = (productId, projectId) => {
        if (!projectId || projectId === 'all') return 0

        if (projectId === 'central-warehouse') {
            const product = products.find(p => p.id === productId)
            if (!product) return 0

            // Calculate stock in all real projects
            let totalProjectStock = 0
            projects.forEach(proj => {
                totalProjectStock += getProjectStock(productId, proj.id)
            })

            return product.quantity - totalProjectStock
        }

        const productMovements = movements.filter(m => m.product_id === productId)

        // Entradas directas al proyecto (Compra)
        const inToProject = productMovements
            .filter(m => m.type === 'IN' && m.project_id === projectId)
            .reduce((sum, m) => sum + m.quantity, 0)

        // Salidas desde el proyecto (Consumo)
        const outFromProject = productMovements
            .filter(m => m.type === 'OUT' && m.project_id === projectId)
            .reduce((sum, m) => sum + m.quantity, 0)

        // Transferencias HACIA este proyecto
        const transferredToProject = productMovements
            .filter(m => m.type === 'TRANSFER' && m.project_id === projectId)
            .reduce((sum, m) => sum + m.quantity, 0)

        // Transferencias DESDE este proyecto
        const transferredFromProject = productMovements
            .filter(m => m.type === 'TRANSFER' && m.from_project_id === projectId)
            .reduce((sum, m) => sum + m.quantity, 0)

        return inToProject - outFromProject + transferredToProject - transferredFromProject
    }

    const filteredProducts = products
        .filter(product => {
            const categoryName = product.categories?.name || ''

            const matchesSearch = (
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                categoryName.toLowerCase().includes(searchTerm.toLowerCase())
            )

            if (selectedProject === 'all') {
                if (showLowStockOnly) {
                    return matchesSearch && product.quantity <= (product.min_stock_level || 5)
                }
                return matchesSearch
            } else {
                // If a project is selected, only show products that have stock in that project
                const projStock = getProjectStock(product.id, selectedProject)
                if (showLowStockOnly) {
                    // Let's allow seeing 0 stock if it's low.
                    return matchesSearch && projStock <= (product.min_stock_level || 5)
                }
                return matchesSearch && projStock > 0
            }
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0

            let aValue, bValue

            switch (sortConfig.key) {
                case 'category':
                    aValue = a.categories?.name || ''
                    bValue = b.categories?.name || ''
                    break
                case 'name':
                    aValue = a.name
                    bValue = b.name
                    break
                case 'stock':
                    if (selectedProject === 'all') {
                        aValue = a.quantity
                        bValue = b.quantity
                    } else {
                        aValue = getProjectStock(a.id, selectedProject)
                        bValue = getProjectStock(b.id, selectedProject)
                    }
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
                    {item.canDelete && selectedProducts.length > 0 && (
                        <button
                            onClick={() => openDeleteModal(selectedProducts)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors shadow-sm ml-2"
                        >
                            <Trash2 size={20} />
                            <span className="hidden sm:inline">Eliminar {selectedProducts.length} seleccionados</span>
                        </button>
                    )}
                    {item.canCreate && (
                        <>
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors shadow-sm"
                            >
                                <FolderPlus size={20} />
                                <span className="hidden sm:inline">{t('products.addCategory')}</span>
                            </button>
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                <span className="hidden sm:inline">{t('products.add')}</span>
                            </button>
                        </>
                    )}
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

                    <select
                        value={selectedProject}
                        onChange={(e) => {
                            setSelectedProject(e.target.value)
                        }}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">{t('reports.all')}</option>
                        <option value="central-warehouse">Almacén Central</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

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
                                <th className="px-6 py-4 w-12">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 cursor-pointer"
                                            checked={
                                                filteredProducts.length > 0 &&
                                                filteredProducts.filter(p => p.quantity === 0).length > 0 &&
                                                selectedProducts.length === filteredProducts.filter(p => p.quantity === 0).length
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    // Select all visible products with 0 stock
                                                    const zeroStockIds = filteredProducts
                                                        .filter(p => p.quantity === 0)
                                                        .map(p => p.id)
                                                    setSelectedProducts(zeroStockIds)
                                                } else {
                                                    setSelectedProducts([])
                                                }
                                            }}
                                            disabled={filteredProducts.filter(p => p.quantity === 0).length === 0}
                                        />
                                    </div>
                                </th>
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
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group border-gray-100 dark:border-gray-700 cursor-pointer"
                                        onClick={(e) => {
                                            // Prevent handling click if user clicked on action buttons or checkboxes
                                            if (e.target.closest('button') || e.target.type === 'checkbox') return;
                                            setLocationModalProduct(product)
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                    disabled={product.quantity > 0}
                                                    checked={selectedProducts.includes(product.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedProducts(prev => [...prev, product.id])
                                                        } else {
                                                            setSelectedProducts(prev => prev.filter(id => id !== product.id))
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
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
                                                {selectedProject === 'all'
                                                    ? product.quantity
                                                    : getProjectStock(product.id, selectedProject)
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.canEdit && (
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={t('common.edit')}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {item.canDelete && (
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
                                                )}
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
                                {Array.isArray(productToDelete) ? (
                                    <>
                                        Estás a punto de eliminar <strong className="text-gray-900 dark:text-white">{productToDelete.length} productos</strong> seleccionados. Esta acción no se puede deshacer. Por favor, ingresa tus credenciales para confirmar.
                                    </>
                                ) : (
                                    <>
                                        {t('products.deleteAuthMessage')} <strong className="text-gray-900 dark:text-white">{productToDelete?.name}</strong>
                                    </>
                                )}
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
            {/* Location Breakdown Modal */}
            {locationModalProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setLocationModalProduct(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ubicación del Inventario</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{locationModalProduct.name}</p>
                            </div>
                            <button
                                onClick={() => setLocationModalProduct(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Ubicación / Proyecto</th>
                                            <th className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {/* Central Warehouse */}
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">Almacén Central</td>
                                            <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                                                {getProjectStock(locationModalProduct.id, 'central-warehouse')}
                                            </td>
                                        </tr>
                                        {/* All Projects */}
                                        {projects.map(proj => {
                                            const stock = getProjectStock(locationModalProduct.id, proj.id)
                                            if (stock <= 0) return null
                                            return (
                                                <tr key={proj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{proj.name}</td>
                                                    <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">{stock}</td>
                                                </tr>
                                            )
                                        })}
                                        {/* Total */}
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 font-medium">
                                            <td className="px-6 py-3 text-gray-900 dark:text-white">Total Global</td>
                                            <td className="px-6 py-3 text-right text-green-600 dark:text-green-400">
                                                {locationModalProduct.quantity}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
