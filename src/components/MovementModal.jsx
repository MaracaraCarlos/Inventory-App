import { useState, useEffect } from 'react'
import { X, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'

export default function MovementModal({ isOpen, onClose, onMovementSaved, movementToEdit }) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])
    const [formData, setFormData] = useState({
        product_id: '',
        type: 'IN',
        quantity: 1,
        notes: '',
        date: ''
    })

    const isEditing = !!movementToEdit

    useEffect(() => {
        if (isOpen) {
            fetchProducts()
            if (movementToEdit) {
                setFormData({
                    product_id: movementToEdit.product_id,
                    type: movementToEdit.type,
                    quantity: movementToEdit.quantity,
                    notes: movementToEdit.notes || '',
                    date: new Date(movementToEdit.created_at).toISOString().slice(0, 16)
                })
            } else {
                setFormData({
                    product_id: '',
                    type: 'IN',
                    quantity: 1,
                    notes: '',
                    date: new Date().toISOString().slice(0, 16)
                })
            }
        }
    }, [isOpen, movementToEdit])

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('id, name, sku, quantity')
        setProducts(data || [])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.product_id) throw new Error(t('movements.errors.selectProduct'))

            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id
            const userEmail = user?.email

            const product = products.find(p => p.id === formData.product_id)
            if (!product) throw new Error(t('movements.errors.productNotFound'))

            if (isEditing) {
                const oldMovement = movementToEdit

                let baseQuantity = product.quantity
                if (oldMovement.type === 'IN') {
                    baseQuantity -= oldMovement.quantity
                } else {
                    baseQuantity += oldMovement.quantity
                }

                const newQuantity = formData.type === 'IN'
                    ? baseQuantity + formData.quantity
                    : baseQuantity - formData.quantity

                if (newQuantity < 0) throw new Error(t('movements.errors.insufficientStock'))

                const { error: moveError } = await supabase
                    .from('movements')
                    .update({
                        product_id: formData.product_id,
                        type: formData.type,
                        quantity: formData.quantity,
                        notes: formData.notes,
                        created_at: new Date(formData.date).toISOString(),
                        user_id: userId,
                        user_email: userEmail
                    })
                    .eq('id', oldMovement.id)

                if (moveError) throw moveError

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ quantity: newQuantity })
                    .eq('id', formData.product_id)

                if (updateError) throw updateError
            } else {
                const { error: moveError } = await supabase
                    .from('movements')
                    .insert([{
                        product_id: formData.product_id,
                        type: formData.type,
                        quantity: formData.quantity,
                        notes: formData.notes,
                        created_at: new Date(formData.date).toISOString(),
                        user_id: userId,
                        user_email: userEmail
                    }])

                if (moveError) throw moveError

                const newQuantity = formData.type === 'IN'
                    ? product.quantity + formData.quantity
                    : product.quantity - formData.quantity

                if (newQuantity < 0) throw new Error(t('movements.errors.insufficientStock'))

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ quantity: newQuantity })
                    .eq('id', formData.product_id)

                if (updateError) throw updateError
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl transition-all">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditing ? t('movements.editMovement') : t('movements.register')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'IN' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all ${formData.type === 'IN'
                                ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <ArrowUpCircle size={18} />
                            {t('movements.stockIn')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'OUT' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all ${formData.type === 'OUT'
                                ? 'bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <ArrowDownCircle size={18} />
                            {t('movements.stockOut')}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('movements.selectProduct')}</label>
                        <select
                            required
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            disabled={isEditing}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">{t('movements.chooseProduct')}</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (SKU: {p.sku}) - {t('movements.currentStock')}: {p.quantity}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('movements.date')}</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('movements.quantity')}</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('movements.notes')}</label>
                        <textarea
                            rows="2"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder={t('movements.reasonPlaceholder')}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 ${formData.type === 'IN' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? t('common.saveChanges') : t('movements.confirm'))}
                    </button>
                </form>
            </div>
        </div>
    )
}
