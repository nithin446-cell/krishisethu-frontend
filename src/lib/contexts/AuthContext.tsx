import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { User } from '../../types';

interface AuthContextType {
    user: User | null;
    userRole: 'farmer' | 'trader' | 'admin' | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (phone: string, role: 'farmer' | 'trader' | 'admin') => Promise<void>;
    logout: () => Promise<void>;
    signup: (data: any) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'farmer' | 'trader' | 'admin' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check active session on initial load
        const restoreSession = async () => {
            try {
                const savedUserId = localStorage.getItem('auth_user_id');
                const savedRole = localStorage.getItem('user_role') as 'farmer' | 'trader' | 'admin' | null;

                if (savedUserId && savedRole) {
                    // Attempt to fetch profile if we have local storage session
                    // In a real app this would also check supabase.auth.getSession()
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', savedUserId)
                        .single();

                    if (data) {
                        const userData: User = {
                            id: data.id,
                            type: data.role || savedRole,
                            name: data.full_name || `${savedRole.charAt(0).toUpperCase() + savedRole.slice(1)} User`,
                            location: data.location || 'India',
                            verified: data.verified !== undefined ? data.verified : true,
                            phone: data.phone || ''
                        };
                        setUser(userData);
                        setUserRole(savedRole);
                        setIsAuthenticated(true);
                    } else {
                        // Fallback to mock session if Supabase backend doesn't have the user yet
                        const mockUser: User = {
                            id: savedUserId,
                            type: savedRole,
                            name: localStorage.getItem('auth_user_name') || `${savedRole.charAt(0).toUpperCase() + savedRole.slice(1)} User`,
                            location: 'India',
                            verified: true,
                            phone: ''
                        };
                        setUser(mockUser);
                        setUserRole(savedRole);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Session restoration failed:', error);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (phone: string, role: 'farmer' | 'trader' | 'admin') => {
        setIsLoading(true);
        try {
            // Normalize phone: strip spaces, ensure it starts with a digit for matching
            const normalizedPhone = phone.trim();

            // 1. Try to find the existing user in the DB by phone
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('phone', normalizedPhone)
                .maybeSingle();

            let dbUser = existingUser;

            // 2. If no user found, INSERT a new row so they get a permanent ID
            if (!dbUser) {
                const userName = `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{ phone: normalizedPhone, role, full_name: userName }])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Failed to create user:', insertError.message);
                    throw new Error('Could not create user account. ' + insertError.message);
                }
                dbUser = newUser;
            }

            // 3. Build the User object from real DB data
            const userData: User = {
                id: dbUser.id,                    // REAL UUID from Supabase — consistent across sessions
                type: (dbUser.role || role) as 'farmer' | 'trader' | 'admin',
                name: dbUser.full_name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
                location: dbUser.location || 'India',
                verified: true,
                phone: dbUser.phone || normalizedPhone
            };

            // 4. Persist session to localStorage
            localStorage.setItem('auth_user_id', dbUser.id);
            localStorage.setItem('auth_user_phone', normalizedPhone);
            localStorage.setItem('auth_user_name', userData.name);
            localStorage.setItem('user_role', userData.type);

            setUser(userData);
            setUserRole(userData.type);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            // await supabase.auth.signOut();

            // Keep profile data for UX, but clear authentication
            localStorage.removeItem('auth_user_id');

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
        // Implement signup logic
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
                    location: data.location || prev.location
                } : null);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
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
            refreshUser
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
