import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { profileRepository } from '../repositories/profileRepository'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null) // 'admin', 'supervisor', 'operator', 'reader'
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initial session check
        const initSession = async () => {
            console.log('[AuthContext] Initializing session...')
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                console.log('[AuthContext] getSession result:', { session, error })

                if (session?.user) {
                    console.log('[AuthContext] Computed user from session:', session.user.id)
                    setUser(session.user)
                    await fetchProfile(session.user.id)
                } else {
                    console.log('[AuthContext] No active session found.')
                }
            } catch (error) {
                console.error('[AuthContext] Error initializing auth:', error)
            } finally {
                console.log('[AuthContext] Setting loading to false (initSession)')
                setLoading(false)
            }
        }

        initSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state change event:', event)
            if (session?.user) {
                console.log('[AuthContext] Auth change user:', session.user.id)
                setUser(session.user)
                // Only fetch profile if we don't have it or if user changed
                if (!role || user?.id !== session.user.id) {
                    console.log('[AuthContext] Fetching profile because role is missing or user changed')
                    await fetchProfile(session.user.id)
                }
            } else {
                console.log('[AuthContext] User signed out or no session.')
                setUser(null)
                setRole(null)
            }
            console.log('[AuthContext] Setting loading to false (onAuthStateChange)')
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        console.log('[AuthContext] Fetching profile for:', userId)
        try {
            // Create a timeout promise that rejects after 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )

            // Race the profile fetch against the timeout
            const { data, error } = await Promise.race([
                profileRepository.getProfile(userId),
                timeoutPromise
            ])

            console.log('[AuthContext] Profile fetch result:', { data, error })

            if (data) {
                console.log('[AuthContext] Setting role to:', data.role)
                setRole(data.role)
            } else if (error) {
                console.error('[AuthContext] Error fetching profile:', error)
            } else {
                console.log('[AuthContext] No profile data returned (might be missing record)')
            }
        } catch (e) {
            console.error('[AuthContext] Exception in fetchProfile:', e)
            // Fallback to prevent infinite loading
        }
    }

    const value = {
        user,
        role,
        loading,
        item: {
            isAdmin: role === 'admin',
            isSupervisor: role === 'supervisor',
            isOperator: role === 'operator',
            isReader: role === 'reader',
            canDelete: role === 'admin',
            canEdit: ['admin', 'supervisor'].includes(role),
            canCreate: ['admin', 'supervisor'].includes(role),
            // Note: Operator can create movements but not products/projects
        },
        hasRole: (allowedRoles) => allowedRoles.includes(role),
        signOut: () => supabase.auth.signOut(),
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
