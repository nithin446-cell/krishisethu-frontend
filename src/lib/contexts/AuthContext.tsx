import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { User } from '../../types';

interface AuthContextType {
    user: User | null;
    userRole: 'farmer' | 'trader' | 'admin' | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (data: any) => Promise<void>;
    refreshUser: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>; // Added reset password to interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'farmer' | 'trader' | 'admin' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Validate the session via Supabase Auth on initial load
        // This ensures the JWT token we use for backend API calls is always fresh.
        const restoreSession = async () => {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const session = sessionData?.session;

                if (session) {
                    // ✅ Update the backend API token with the freshly validated one
                    localStorage.setItem('supabase_token', session.access_token);

                    const userId = session.user.id;
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (data && !error) {
                        const userData: User = {
                            id: data.id,
                            type: data.role as 'farmer' | 'trader' | 'admin',
                            name: data.full_name || `${data.role.charAt(0).toUpperCase() + data.role.slice(1)} User`,
                            location: data.location || 'India',
                            verified: data.verification_status === 'verified',
                            phone: data.phone || ''
                        };
                        localStorage.setItem('auth_user_id', userId);
                        localStorage.setItem('user_role', data.role);
                        localStorage.setItem('auth_user_name', userData.name);
                        setUser(userData);
                        setUserRole(data.role);
                        setIsAuthenticated(true);
                    } else {
                        // No profile found in DB, clear stale auth
                        localStorage.removeItem('supabase_token');
                        localStorage.removeItem('auth_user_id');
                    }
                } else {
                    // No active Supabase session - clear any stale localStorage data
                    localStorage.removeItem('supabase_token');
                    localStorage.removeItem('auth_user_id');
                    localStorage.removeItem('user_role');
                }
            } catch (error) {
                console.error('Session restoration failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();

        // 🔄 Subscribe to auth state changes to keep the JWT token fresh
        // When Supabase silently refreshes the token, we update localStorage immediately
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                // Always keep the backend API token in sync
                localStorage.setItem('supabase_token', session.access_token);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem('supabase_token');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Listen for Realtime verification status changes
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase.channel('auth_user_updates')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users', 
                filter: `id=eq.${user.id}` 
            }, (payload) => {
                const updatedUser = payload.new;
                setUser(prev => prev ? {
                    ...prev,
                    name: updatedUser.full_name || prev.name,
                    phone: updatedUser.phone || prev.phone,
                    location: updatedUser.location || prev.location,
                    verified: updatedUser.verification_status === 'verified'
                } : null);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // 1. Authenticate securely with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.session) throw new Error("No session returned from Supabase.");

            const userId = authData.user.id;

            // 2. Fetch the user's full profile from your public 'users' table
            const { data: dbUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError || !dbUser) {
                console.error("Profile fetch error:", fetchError);
                throw new Error("User authenticated, but profile not found in database.");
            }

            // 3. Build the User object for the frontend state
            const userData: User = {
                id: dbUser.id,
                type: dbUser.role as 'farmer' | 'trader' | 'admin',
                name: dbUser.full_name || `${dbUser.role.charAt(0).toUpperCase() + dbUser.role.slice(1)} User`,
                location: dbUser.location || 'India',
                verified: dbUser.verification_status === 'verified',
                phone: dbUser.phone || ''
            };

            // 4. Persist session details to localStorage
            localStorage.setItem('auth_user_id', dbUser.id);
            localStorage.setItem('auth_user_phone', dbUser.phone || '');
            localStorage.setItem('auth_user_name', userData.name);
            localStorage.setItem('user_role', userData.type);
            
            // CRITICAL: Store the Supabase token so API calls can use it in the Authorization header
            localStorage.setItem('supabase_token', authData.session.access_token);

            setUser(userData);
            setUserRole(userData.type);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login error:', error);
            throw error; // Re-throw to be caught by the UI (e.g., to show an error message)
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            // Sign out of Supabase Auth to invalidate JWT token
            await supabase.auth.signOut();

            // Clear all authentication data from local storage
            localStorage.removeItem('auth_user_id');
            localStorage.removeItem('auth_user_phone');
            localStorage.removeItem('auth_user_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('supabase_token');

            // 🧹 Wipe all cached data so the next user starts fresh
            sessionStorage.clear();

            setUser(null);
            setUserRole(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const signup = async (data: any) => {
        setIsLoading(true);
        try {
            // Point to your backend route
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Signup failed');
            }
            
            // Build the User object from the returned DB data
            const dbUser = result.user;
            const userData: User = {
                id: dbUser.id,
                type: dbUser.role as 'farmer' | 'trader' | 'admin',
                name: dbUser.full_name || `${dbUser.role.charAt(0).toUpperCase() + dbUser.role.slice(1)} User`,
                location: dbUser.location || 'India',
                verified: dbUser.verification_status === 'verified',
                phone: dbUser.phone || data.phone
            };

            // Persist session to localStorage
            localStorage.setItem('auth_user_id', dbUser.id);
            localStorage.setItem('auth_user_phone', dbUser.phone || '');
            localStorage.setItem('auth_user_name', userData.name);
            localStorage.setItem('user_role', userData.type);
            
            // Store the session token so API calls can use it in the Authorization header
            if (result.session) {
                 localStorage.setItem('supabase_token', result.session.access_token);
            }

            setUser(userData);
            setUserRole(userData.type);
            setIsAuthenticated(true);
            
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        if (!user?.id) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setUser(prev => prev ? {
                    ...prev,
                    name: data.full_name || prev.name,
                    phone: data.phone || prev.phone,
                    location: data.location || prev.location,
                    verified: data.verification_status === 'verified'
                } : null);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    // New resetPassword function
    const resetPassword = async (email: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`, 
            });
            if (error) throw error;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            isLoading,
            isAuthenticated,
            login,
            logout,
            signup,
            refreshUser,
            resetPassword // Added to provider
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};