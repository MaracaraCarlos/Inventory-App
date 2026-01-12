import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../lib/LanguageContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, Package, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

export default function Charts() {
    const { t } = useLanguage()
    const [products, setProducts] = useState([])
    const [movements, setMovements] = useState([])
    const [selectedProduct, setSelectedProduct] = useState('')
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState([])
    const chartRef = useRef(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, quantity')
                .order('name')

            if (productsError) throw productsError
            setProducts(productsData || [])

            // Fetch movements
            const { data: movementsData, error: movementsError } = await supabase
                .from('movements')
                .select('*')
                .order('created_at', { ascending: true })

            if (movementsError) throw movementsError
            setMovements(movementsData || [])

            // Set first product as default if available
            if (productsData && productsData.length > 0) {
                setSelectedProduct(productsData[0].id)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedProduct && movements.length > 0 && products.length > 0) {
            generateChartData()
        }
    }, [selectedProduct, movements, products])

    const generateChartData = () => {
        const product = products.find(p => p.id === selectedProduct)
        if (!product) return

        // Filter movements for selected product
        const productMovements = movements.filter(m => m.product_id === selectedProduct)

        if (productMovements.length === 0) {
            // If no movements, show current stock as single point
            setChartData([{
                date: new Date().toLocaleDateString(),
                stock: product.quantity,
                output: 0
            }])
            return
        }

        // Calculate stock evolution over time
        // Start from current stock and work backwards
        let currentStock = product.quantity
        const stockHistory = []

        // Calculate total output (all 'out' or 'OUT' movements)
        const totalOutput = productMovements
            .filter(m => m.type === 'out' || m.type === 'OUT')
            .reduce((sum, m) => sum + m.quantity, 0)

        // Add current state
        stockHistory.push({
            date: new Date().toLocaleDateString(),
            fullDate: new Date(),
            stock: currentStock,
            output: totalOutput
        })

        // Process movements in reverse to calculate historical stock and output
        const sortedMovements = [...productMovements].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )

        let outputAtPoint = totalOutput
        sortedMovements.forEach(movement => {
            // Reverse the movement to get previous stock
            const isIn = movement.type === 'in' || movement.type === 'IN'
            if (isIn) {
                currentStock -= movement.quantity
            } else {
                currentStock += movement.quantity
                outputAtPoint -= movement.quantity
            }

            stockHistory.unshift({
                date: new Date(movement.created_at).toLocaleDateString(),
                fullDate: new Date(movement.created_at),
                stock: currentStock,
                output: outputAtPoint
            })
        })

        // Group by date and keep last value for each date
        const groupedByDate = {}
        stockHistory.forEach(item => {
            const dateKey = item.date
            if (!groupedByDate[dateKey] || item.fullDate > groupedByDate[dateKey].fullDate) {
                groupedByDate[dateKey] = item
            }
        })

        const finalData = Object.values(groupedByDate)
            .sort((a, b) => a.fullDate - b.fullDate)
            .map(item => ({
                date: item.date,
                stock: item.stock,
                output: item.output
            }))

        setChartData(finalData)
    }

    const generateChartPDF = async () => {
        if (chartData.length === 0 || !selectedProduct) return

        try {
            const doc = new jsPDF()
            const productName = products.find(p => p.id === selectedProduct)?.name || ''

            doc.setFontSize(18)
            doc.text(t('charts.stockEvolution'), 14, 22)
            doc.setFontSize(14)
            doc.setTextColor(100)
            doc.text(productName, 14, 30)

            doc.setFontSize(11)
            doc.setTextColor(0)
            doc.text(`${t('reports.headers.date')}: ${new Date().toLocaleDateString()}`, 14, 38)

            let startY = 45

            // Capture chart image
            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current)
                const imgData = canvas.toDataURL('image/png')

                const imgWidth = 180
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                doc.addImage(imgData, 'PNG', 15, startY, imgWidth, imgHeight)
                startY += imgHeight + 10
            }

            const tableColumn = [
                t('reports.headers.date'),
                t('charts.stock'),
                t('charts.output')
            ]

            const tableRows = chartData.map(item => [
                item.date,
                item.stock,
                item.output
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: startY,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }
            })

            doc.save(`chart-history-${productName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`)
        } catch (error) {
            console.error('Error generating chart PDF:', error)
        }
    }

    const selectedProductName = products.find(p => p.id === selectedProduct)?.name || ''

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('charts.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('charts.subtitle')}</p>
                </div>
                {selectedProduct && chartData.length > 0 && products.length > 0 && (
                    <button
                        onClick={generateChartPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                        <Download size={20} />
                        <span>{t('reports.exportPDF')}</span>
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Product Selector */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('charts.selectProduct')}
                        </label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                        >
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                            <p className="text-gray-500 dark:text-gray-400">{t('charts.loading')}</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                <Package size={32} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">{t('charts.noProducts')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('charts.addProductsFirst')}</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                <TrendingUp size={32} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">{t('charts.noData')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('charts.noMovementsYet')}</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                {t('charts.stockEvolution')}: <span className="text-blue-600">{selectedProductName}</span>
                            </h3>
                            <div className="h-[400px] w-full" ref={chartRef}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickLine={{ stroke: '#6B7280' }}
                                        />
                                        <YAxis
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickLine={{ stroke: '#6B7280' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#F9FAFB'
                                            }}
                                            labelStyle={{ color: '#9CA3AF' }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="stock"
                                            name={t('charts.stock')}
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="output"
                                            name={t('charts.output')}
                                            stroke="#EF4444"
                                            strokeWidth={3}
                                            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {chartData.length > 0 && (
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('charts.currentStock')}</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {chartData[chartData.length - 1]?.stock || 0}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t('charts.totalOutput')}</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {chartData[chartData.length - 1]?.output || 0}
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">{t('charts.maxStock')}</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {Math.max(...chartData.map(d => d.stock))}
                                </p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{t('charts.minStock')}</p>
                                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {Math.min(...chartData.map(d => d.stock))}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
