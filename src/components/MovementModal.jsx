
import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, Plus, Trash2 } from 'lucide-react'
import { productRepository } from '../repositories/productRepository'
import { projectRepository } from '../repositories/projectRepository'
import { movementRepository } from '../repositories/movementRepository'
import { supplierRepository } from '../repositories/supplierRepository'
import { contractorRepository } from '../repositories/contractorRepository'
import { authRepository } from '../repositories/authRepository'
import { useLanguage } from '../lib/LanguageContext'

export default function MovementModal({ isOpen, onClose, onMovementSaved }) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])
    const [projects, setProjects] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [contractors, setContractors] = useState([])
    const [allMovements, setAllMovements] = useState([])

    // Global fields
    const [formData, setFormData] = useState({
        type: 'IN',
        date: '',
        project_id: '',
        from_project_id: '',
        supplier_id: '',
        contractor_id: ''
    })

    // Item List
    const [items, setItems] = useState([
        { id: Date.now(), product_id: '', quantity: 1, notes: '' }
    ])

    // Helper to calculate available stock
    const getAvailableStock = (movements, targetProjectId, productQuantity) => {
        if (!targetProjectId || targetProjectId === '') {
            // Central Warehouse Logic
            const activeProjectIds = new Set(projects.map(p => p.id))

            const totalProjectStock = movements.reduce((acc, m) => {
                let change = 0
                if (m.type === 'IN' && m.project_id && activeProjectIds.has(m.project_id)) change += m.quantity
                if (m.type === 'OUT' && m.project_id && activeProjectIds.has(m.project_id)) change -= m.quantity
                if (m.type === 'TRANSFER' && m.project_id && activeProjectIds.has(m.project_id)) change += m.quantity
                if (m.type === 'TRANSFER' && m.from_project_id && activeProjectIds.has(m.from_project_id)) change -= m.quantity
                return acc + change
            }, 0)

            return productQuantity - totalProjectStock
        } else {
            // Specific Project Stock Logic
            const inToProject = movements.filter(m => m.type === 'IN' && m.project_id === targetProjectId).reduce((sum, m) => sum + m.quantity, 0)
            const outFromProject = movements.filter(m => m.type === 'OUT' && m.project_id === targetProjectId).reduce((sum, m) => sum + m.quantity, 0)
            const transferredToProject = movements.filter(m => m.type === 'TRANSFER' && m.project_id === targetProjectId).reduce((sum, m) => sum + m.quantity, 0)
            const transferredFromProject = movements.filter(m => m.type === 'TRANSFER' && m.from_project_id === targetProjectId).reduce((sum, m) => sum + m.quantity, 0)
            return inToProject - outFromProject + transferredToProject - transferredFromProject
        }
    }

    const stockMap = useMemo(() => {
        if (!allMovements.length || !products.length) return {}

        let targetId = ''
        if (formData.type === 'TRANSFER') targetId = formData.from_project_id
        else targetId = formData.project_id

        const movesByProduct = {}
        allMovements.forEach(m => {
            if (!movesByProduct[m.product_id]) movesByProduct[m.product_id] = []
            movesByProduct[m.product_id].push(m)
        })

        const map = {}
        products.forEach(p => {
            const moves = movesByProduct[p.id] || []
            map[p.id] = getAvailableStock(moves, targetId, p.quantity)
        })
        return map
    }, [allMovements, formData.project_id, formData.from_project_id, formData.type, products, projects])

    useEffect(() => {
        if (isOpen) {
            fetchData()
            setFormData({
                type: 'IN',
                date: new Date().toISOString().slice(0, 16),
                project_id: '',
                from_project_id: '',
                supplier_id: '',
                contractor_id: ''
            })
            setItems([{ id: Date.now(), product_id: '', quantity: 1, notes: '' }])
        }
    }, [isOpen])

    const fetchData = async () => {
        const { data: prodData } = await productRepository.getAllProducts()
        setProducts(prodData || [])

        const { data: projData } = await projectRepository.getAllProjects()
        setProjects(projData || [])

        const { data: suppData } = await supplierRepository.getAllSuppliers()
        setSuppliers(suppData || [])

        const { data: contrData } = await contractorRepository.getAllContractors()
        setContractors(contrData || [])

        const { data: moveData } = await movementRepository.getAllMovements()
        setAllMovements(moveData || [])
    }

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), product_id: '', quantity: 1, notes: '' }])
    }

    const handleRemoveItem = (id) => {
        if (items.length === 1) return
        setItems(items.filter(item => item.id !== id))
    }

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await authRepository.getCurrentUser()
            const userId = user?.id
            const userEmail = user?.email

            // Validate that at least one item has a product selected
            if (items.every(item => !item.product_id)) {
                throw new Error(t('movements.errors.selectProduct'))
            }

            // Aggregate quantities per product for validation
            const productQuantities = {}
            items.forEach(item => {
                if (!item.product_id) return
                productQuantities[item.product_id] = (productQuantities[item.product_id] || 0) + parseInt(item.quantity)
            })

            // Run Validations
            for (const [prodId, totalQty] of Object.entries(productQuantities)) {
                if (!prodId) throw new Error(t('movements.errors.selectProduct'))
                const product = products.find(p => p.id === prodId)
                if (!product) throw new Error(t('movements.errors.productNotFound'))

                const { data: projMovements } = await movementRepository.getMovementsByProduct(prodId)
                const movements = projMovements || []

                if (formData.type === 'TRANSFER' && formData.from_project_id === formData.project_id) {
                    throw new Error(t('movements.errors.sameProjectTransfer'))
                }

                if (formData.type === 'TRANSFER') {
                    const sourceStock = getAvailableStock(movements, formData.from_project_id, product.quantity)
                    if (totalQty > sourceStock) {
                        const sourceName = formData.from_project_id ? projects.find(p => p.id === formData.from_project_id)?.name : "Almacén Central"
                        throw new Error(`${t('movements.errors.insufficientProjectStock')} ${sourceName} (${sourceStock}) for ${product.name}`)
                    }
                }

                if (formData.type === 'OUT') {
                    const sourceStock = getAvailableStock(movements, formData.project_id, product.quantity)
                    if (totalQty > sourceStock) {
                        const sourceName = formData.project_id ? projects.find(p => p.id === formData.project_id)?.name : "Almacén Central"
                        throw new Error(`${t('movements.errors.insufficientProjectStock')} ${sourceName} (${sourceStock}) for ${product.name}`)
                    }
                }
            }

            // Process Items
            for (const item of items) {
                if (!item.product_id) continue

                const product = products.find(p => p.id === item.product_id)
                const fromProjectId = formData.from_project_id === '' ? null : formData.from_project_id
                const toProjectId = formData.project_id === '' ? null : formData.project_id
                const supplierId = formData.supplier_id === '' ? null : formData.supplier_id
                const contractorId = formData.contractor_id === '' ? null : formData.contractor_id
                const qty = parseInt(item.quantity)

                const insertData = {
                    product_id: item.product_id,
                    type: formData.type,
                    quantity: qty,
                    notes: item.notes,
                    created_at: new Date(formData.date).toISOString(),
                    user_id: userId,
                    user_email: userEmail,
                    project_id: toProjectId,
                    from_project_id: fromProjectId,
                    supplier_id: supplierId,
                    contractor_id: contractorId
                }

                const { error: moveError } = await movementRepository.createMovement(insertData)
                if (moveError) throw moveError

                if (formData.type !== 'TRANSFER') {
                    const newQuantity = formData.type === 'IN'
                        ? product.quantity + qty
                        : product.quantity - qty

                    if (newQuantity < 0) throw new Error(`${t('movements.errors.insufficientStock')} for ${product.name}`)

                    const { error: updateError } = await productRepository.updateProductQuantity(item.product_id, newQuantity)
                    if (updateError) throw updateError

                    // Update local products state for next iteration (in case same product is used twice in list? No, we refresh all at end)
                    // But if we have duplicate products in list, we might have a race condition on product.quantity if we rely on stale `product` variable.
                    // Solution: We already validated total quantity. But updates need to be serial and cumulative if we update the global counter.
                    // Actually, `product.quantity` is the database state at start.
                    // If we have 2 rows of Product A (Qty 5 and Qty 5), and initial is 100.
                    // Row 1: IN 5 -> Update to 105.
                    // Row 2: IN 5 -> Update to 105?? No, needs to be 110.

                    // Fix: Update the product object in our local 'products' list so the next iteration sees the new quantity
                    const prodIndex = products.findIndex(p => p.id === item.product_id)
                    if (prodIndex >= 0) {
                        products[prodIndex].quantity = newQuantity
                    }
                }
            }

            onMovementSaved()
            onClose()
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('movements.register')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Header Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                        {/* Type Selection */}
                        <div className="md:col-span-2 flex bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'IN' })}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${formData.type === 'IN'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${formData.type === 'IN' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <ArrowUpCircle size={20} />
                                </div>
                                <span className="font-semibold text-sm">{t('movements.stockIn')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'OUT' })}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${formData.type === 'OUT'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${formData.type === 'OUT' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <ArrowDownCircle size={20} />
                                </div>
                                <span className="font-semibold text-sm">{t('movements.stockOut')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'TRANSFER' })}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${formData.type === 'TRANSFER'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${formData.type === 'TRANSFER' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <ArrowRightCircle size={20} />
                                </div>
                                <span className="font-semibold text-sm">{t('movements.move')}</span>
                            </button>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('movements.date')}</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            />
                        </div>

                        {/* Origin (for TRANSFER) */}
                        {formData.type === 'TRANSFER' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('movements.fromProject')}
                                </label>
                                <select
                                    value={formData.from_project_id}
                                    onChange={(e) => setFormData({ ...formData, from_project_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                >
                                    <option value="">Almacén Central</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Destination */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {formData.type === 'TRANSFER' ? t('movements.toProject') : t('products.project')}
                            </label>
                            <select
                                value={formData.project_id}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            >
                                <option value="">{['TRANSFER', 'IN', 'OUT'].includes(formData.type) ? 'Almacén Central' : t('products.selectProject')}</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Supplier (IN) */}
                        {formData.type === 'IN' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('suppliers.title')} ({t('common.optional')})
                                </label>
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                >
                                    <option value="">-- Seleccionar Proveedor --</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Contractor (OUT) */}
                        {formData.type === 'OUT' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('contractors.title')} ({t('common.optional')})
                                </label>
                                <select
                                    value={formData.contractor_id}
                                    onChange={(e) => setFormData({ ...formData, contractor_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                >
                                    <option value="">-- Seleccionar Contratista --</option>
                                    {contractors.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Product List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-lg font-bold text-gray-900 dark:text-white">{t('products.title')}</label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Plus size={18} />
                                {t('products.add')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-left-2 fade-in duration-200">
                                    <div className="flex-1 w-full md:w-auto">
                                        <select
                                            required
                                            value={item.product_id}
                                            onChange={(e) => handleItemChange(item.id, 'product_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        >
                                            <option value="">{t('movements.chooseProduct')}</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - {t('stock')}: {stockMap[p.id] !== undefined ? stockMap[p.id] : p.quantity}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="w-24 md:w-32">
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-500 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="flex-1 w-full md:w-auto">
                                        <input
                                            type="text"
                                            placeholder={t('movements.notes')}
                                            value={item.notes}
                                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        disabled={items.length === 1}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transform hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 ${formData.type === 'IN'
                                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-200 dark:shadow-none'
                                : formData.type === 'OUT'
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-200 dark:shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-200 dark:shadow-none'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    {formData.type === 'IN' && <ArrowUpCircle size={24} />}
                                    {formData.type === 'OUT' && <ArrowDownCircle size={24} />}
                                    {formData.type === 'TRANSFER' && <ArrowRightCircle size={24} />}
                                    {t('movements.confirm')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
