import { Activity, Package, AlertTriangle, TrendingUp, Globe, FileText, BarChart3, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useLanguage } from '../lib/LanguageContext'

const StatCard = ({ label, value, icon: Icon, color, trend, onClick }) => (
    <div
        onClick={onClick}
        className={cn(
            "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all",
            onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        )}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
            </div>
            <div className={cn('p-3 rounded-xl', color)}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <TrendingUp size={16} />
                    {trend}
                </span>
                <span className="text-gray-400 dark:text-gray-500">vs last month</span>
            </div>
        )}
    </div>
)

export default function Dashboard() {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        totalMovements: 0,
        totalProjects: 0
    })

    useEffect(() => {
        const fetchStats = async () => {
            const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
            const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('quantity', 5)
            const { count: movementsCount } = await supabase.from('movements').select('*', { count: 'exact', head: true })
            const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })

            setStats({
                totalProducts: productsCount || 0,
                lowStock: lowStockCount || 0,
                totalMovements: movementsCount || 0,
                totalProjects: projectsCount || 0
            })
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('nav.dashboard')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.overview')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Projects */}
                <StatCard
                    label={t('nav.projects')}
                    value={stats.totalProjects}
                    icon={Globe}
                    color="bg-emerald-500"
                    onClick={() => navigate('/projects')}
                />

                {/* 2. Total Products */}
                <StatCard
                    label={t('dashboard.totalProducts')}
                    value={stats.totalProducts}
                    icon={Package}
                    color="bg-blue-500"
                    onClick={() => navigate('/products')}
                />

                {/* 3. Low Stock */}
                <StatCard
                    label={t('dashboard.lowStock')}
                    value={stats.lowStock}
                    icon={AlertTriangle}
                    color="bg-orange-500"
                    onClick={() => navigate('/products?filter=lowStock')}
                />

                {/* 4. Total Movements */}
                <StatCard
                    label={t('dashboard.totalMovements')}
                    value={stats.totalMovements}
                    icon={Activity}
                    color="bg-indigo-500"
                    onClick={() => navigate('/movements')}
                />

                {/* 5. Companies (Empresas) */}
                <StatCard
                    label={t('nav.suppliersContractors')}
                    value={stats.totalCompanies}
                    icon={Users}
                    color="bg-teal-500"
                    onClick={() => navigate('/suppliers-contractors')}
                />

                {/* 6. Reports */}
                <StatCard
                    label={t('nav.reports')}
                    value=""
                    icon={FileText}
                    color="bg-purple-500"
                    onClick={() => navigate('/reports')}
                />

                {/* 7. Charts */}
                <StatCard
                    label={t('nav.charts')}
                    value=""
                    icon={BarChart3}
                    color="bg-pink-500"
                    onClick={() => navigate('/charts')}
                />
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">{t('dashboard.welcomeTitle')}</h3>
                    <p className="text-blue-100 mb-6 max-w-lg">
                        {t('dashboard.welcomeText')}
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12" />
            </div>
        </div>
    )
}
