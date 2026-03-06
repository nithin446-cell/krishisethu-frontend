import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

interface DataContextType {
    farmerListings: any[];
    farmerBids: any[];
    farmerOrders: any[];

    traderBids: any[];
    traderOrders: any[];

    marketListings: any[];

    allOrders: any[];
    allBids: any[];
    allUsers: any[];

    refreshFarmerData: (farmerId: string) => Promise<void>;
    refreshTraderData: (traderId: string) => Promise<void>;
    refreshMarketListings: () => Promise<void>;
    refreshAdminData: () => Promise<void>;
    invalidateCache: (key: string) => void;

    isLoading: boolean;
    isRefreshing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userRole } = useAuth();

    const [farmerListings, setFarmerListings] = useState<any[]>([]);
    const [farmerBids, setFarmerBids] = useState<any[]>([]);
    const [farmerOrders, setFarmerOrders] = useState<any[]>([]);

    const [traderBids, setTraderBids] = useState<any[]>([]);
    const [traderOrders, setTraderOrders] = useState<any[]>([]);

    const [marketListings, setMarketListings] = useState<any[]>([]);

    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [allBids, setAllBids] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getFromCache = (key: string) => {
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    return data;
                }
            }
        } catch (e) {
            console.error('Cache read error', e);
        }
        return null;
    };

    const setCache = (key: string, data: any) => {
        try {
            sessionStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Cache write error', e);
        }
    };

    const invalidateCache = (key: string) => {
        sessionStorage.removeItem(key);
    };

    const refreshFarmerData = async (farmerId: string) => {
        setIsRefreshing(true);
        try {
            const cachedBids = getFromCache(`cache_bids_${farmerId}`);
            if (cachedBids) setFarmerBids(cachedBids);

            const bids = await api.getFarmerBids(farmerId).catch(() => []);
            if (bids.length > 0 || !cachedBids) {
                setFarmerBids(bids);
                setCache(`cache_bids_${farmerId}`, bids);
            }

            // We don't have farmer listings or orders in api.ts right now, assuming empty or implemented later
            // const listings = await api.getFarmerListings(farmerId);
            // setFarmerListings(listings);
        } catch (error) {
            console.error('Error fetching farmer data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const refreshTraderData = async (traderId: string) => {
        setIsRefreshing(true);
        try {
            const cachedBids = getFromCache(`cache_trader_bids_${traderId}`);
            if (cachedBids) setTraderBids(cachedBids);

            const bids = await api.getTraderBids(traderId).catch(() => []);
            if (bids.length > 0 || !cachedBids) {
                setTraderBids(bids);
                setCache(`cache_trader_bids_${traderId}`, bids);
            }
        } catch (error) {
            console.error('Error fetching trader data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const refreshMarketListings = async () => {
        setIsRefreshing(true);
        try {
            const cachedMarket = getFromCache('cache_market_listings');
            if (cachedMarket) setMarketListings(cachedMarket);

            const market = await api.getMarket().catch(() => []);
            if (market.length > 0 || !cachedMarket) {
                setMarketListings(market);
                setCache('cache_market_listings', market);
            }
        } catch (error) {
            console.error('Error fetching market listings:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const refreshAdminData = async () => {
        setIsRefreshing(true);
        try {
            const orders = await api.getAdminOrders().catch(() => []);
            const bids = await api.getAdminBids().catch(() => []);

            setAllOrders(orders);
            setAllBids(bids);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            setIsLoading(true);

            const initData = async () => {
                if (userRole === 'farmer') {
                    await refreshFarmerData(user.id);
                } else if (userRole === 'trader') {
                    await refreshTraderData(user.id);
                    await refreshMarketListings();
                } else if (userRole === 'admin') {
                    await refreshAdminData();
                }
                setIsLoading(false);
            };

            initData();
        }
    }, [user?.id, userRole]);

    return (
        <DataContext.Provider value={{
            farmerListings,
            farmerBids,
            farmerOrders,
            traderBids,
            traderOrders,
            marketListings,
            allOrders,
            allBids,
            allUsers,
            refreshFarmerData,
            refreshTraderData,
            refreshMarketListings,
            refreshAdminData,
            invalidateCache,
            isLoading,
            isRefreshing
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
