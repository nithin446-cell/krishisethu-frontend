// lib/websocket.ts - Real-time bidding notifications
import React, { useEffect, useRef, useCallback, useState } from 'react';

// ============================================
// TYPES
// ============================================

export type WebSocketEventType =
    | 'NEW_BID'
    | 'BID_ACCEPTED'
    | 'BID_REJECTED'
    | 'LISTING_CREATED'
    | 'LISTING_SOLD'
    | 'ORDER_CREATED'
    | 'NOTIFICATION';

export interface WebSocketMessage {
    type: WebSocketEventType;
    data: any;
    timestamp: string;
    userId?: string;
}

export interface BidNotification {
    bid_id: string;
    listing_id: string;
    trader_id: string;
    trader_name: string;
    amount: number;
    quantity: number;
    message?: string;
    timestamp: string;
    read?: boolean;
}

export interface BidStatusNotification {
    bid_id: string;
    status: 'accepted' | 'rejected';
    listing_id: string;
    message?: string;
    timestamp: string;
}

// ============================================
// WEBSOCKET MANAGER CLASS
// ============================================

class WebSocketManager {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;
    private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
    private isConnecting: boolean = false;

    constructor(url: string) {
        this.url = url;
    }

    // Connect to WebSocket server
    connect(userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }

            this.isConnecting = true;

            try {
                const wsUrl = `${this.url}?user_id=${userId}`;
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.isConnecting = false;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.ws = null;
                    this.isConnecting = false;
                    this.attemptReconnect(userId);
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    // Attempt to reconnect with exponential backoff
    private attemptReconnect(userId: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

            setTimeout(() => {
                this.connect(userId).catch((error) => {
                    console.error('Reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    // Handle incoming messages
    private handleMessage(message: WebSocketMessage) {
        const listeners = this.listeners.get(message.type);
        if (listeners) {
            listeners.forEach((listener) => listener(message.data));
        }
    }

    // Subscribe to event type
    on(eventType: WebSocketEventType, listener: (data: any) => void) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(eventType)?.delete(listener);
        };
    }

    // Unsubscribe from event type
    off(eventType: WebSocketEventType, listener: (data: any) => void) {
        this.listeners.get(eventType)?.delete(listener);
    }

    // Send message to server
    send(message: Partial<WebSocketMessage>) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                ...message,
                timestamp: new Date().toISOString()
            }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    // Disconnect
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }

    // Check connection status
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// ============================================
// GLOBAL WEBSOCKET INSTANCE
// ============================================

let wsManager: WebSocketManager | null = null;

function getWSManager(): WebSocketManager {
    if (!wsManager) {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';
        wsManager = new WebSocketManager(wsUrl);
    }
    return wsManager;
}

// ============================================
// REACT HOOKS FOR COMPONENTS
// ============================================

/**
 * Hook to use WebSocket in React components
 */
export function useWebSocket(userId: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocketManager | null>(null);

    useEffect(() => {
        if (!userId) return;

        const ws = getWSManager();
        wsRef.current = ws;

        ws.connect(userId)
            .then(() => setIsConnected(true))
            .catch((error) => {
                console.error('WebSocket connection failed:', error);
                setIsConnected(false);
            });

        return () => {
            // Don't disconnect on unmount - keep connection alive
            // ws.disconnect();
        };
    }, [userId]);

    return {
        isConnected,
        ws: wsRef.current
    };
}

/**
 * Hook for farmers to listen to new bids
 */
export function useFarmerBidNotifications(farmerId: string | null) {
    const [newBids, setNewBids] = useState<BidNotification[]>([]);
    const { ws } = useWebSocket(farmerId);

    useEffect(() => {
        if (!ws || !farmerId) return;

        const unsubscribe = ws.on('NEW_BID', (data: BidNotification) => {
            console.log('New bid received:', data);
            setNewBids((prev) => [data, ...prev]);
        });

        return unsubscribe;
    }, [ws, farmerId]);

    return { newBids };
}

/**
 * Hook for traders to listen to bid status updates
 */
export function useTraderBidStatusNotifications(traderId: string | null) {
    const [bidUpdates, setBidUpdates] = useState<BidStatusNotification[]>([]);
    const { ws } = useWebSocket(traderId);

    useEffect(() => {
        if (!ws || !traderId) return;

        const unsubscribeAccepted = ws.on('BID_ACCEPTED', (data: BidStatusNotification) => {
            console.log('Bid accepted:', data);
            setBidUpdates((prev) => [data, ...prev]);
        });

        const unsubscribeRejected = ws.on('BID_REJECTED', (data: BidStatusNotification) => {
            console.log('Bid rejected:', data);
            setBidUpdates((prev) => [data, ...prev]);
        });

        return () => {
            unsubscribeAccepted?.();
            unsubscribeRejected?.();
        };
    }, [ws, traderId]);

    return { bidUpdates };
}

/**
 * Hook for admin to monitor all activity
 */
export function useAdminActivityNotifications(adminId: string | null) {
    const [activities, setActivities] = useState<WebSocketMessage[]>([]);
    const { ws } = useWebSocket(adminId);

    useEffect(() => {
        if (!ws || !adminId) return;

        const events: WebSocketEventType[] = [
            'NEW_BID',
            'BID_ACCEPTED',
            'BID_REJECTED',
            'LISTING_CREATED',
            'LISTING_SOLD',
            'ORDER_CREATED'
        ];

        const unsubscribes = events.map((eventType) =>
            ws.on(eventType, (data: any) => {
                console.log(`Admin activity: ${eventType}`, data);
                setActivities((prev) => [
                    {
                        type: eventType,
                        data,
                        timestamp: new Date().toISOString()
                    },
                    ...prev
                ]);
            })
        );

        return () => {
            unsubscribes.forEach((unsub) => unsub?.());
        };
    }, [ws, adminId]);

    return { activities };
}


// ============================================
// BACKEND WEBSOCKET SERVER EXAMPLE (Node.js)
// ============================================

/**
 * Example WebSocket server implementation for Express
 * 
 * Install: npm install ws express-ws
 * 
 * Add to server.js:
 */

export const websocketServerExample = `
// server.js - WebSocket implementation
import expressWs from 'express-ws';
import express from 'express';

const app = express();
expressWs(app);

// Store active connections
const connections = new Map(); // userId -> ws

// WebSocket route
app.ws('/ws', (ws, req) => {
  const userId = req.query.user_id;
  
  if (!userId) {
    ws.close(1008, 'User ID required');
    return;
  }

  // Store connection
  connections.set(userId, ws);
  console.log(\`User \${userId} connected\`);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // Handle client messages if needed
      console.log('Message from client:', data);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    connections.delete(userId);
    console.log(\`User \${userId} disconnected\`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast new bid to farmer
export function notifyFarmerNewBid(farmerId, bidData) {
  const ws = connections.get(farmerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'NEW_BID',
      data: bidData,
      timestamp: new Date().toISOString()
    }));
  }
}

// Notify trader of bid status
export function notifyTraderBidStatus(traderId, bidData) {
  const ws = connections.get(traderId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: bidData.status === 'accepted' ? 'BID_ACCEPTED' : 'BID_REJECTED',
      data: bidData,
      timestamp: new Date().toISOString()
    }));
  }
}

// Broadcast to all admins
export function notifyAdmins(eventType, eventData) {
  connections.forEach((ws, userId) => {
    // Check if user is admin (you'd need to store role info)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
      }));
    }
  });
}
`;

// ============================================
// USAGE IN FARMER COMPONENT
// ============================================

export const farmerComponentWithNotificationsExample = `
// components/Farmer/FarmerDashboard.tsx
import { useFarmerBidNotifications } from '@/lib/websocket';
import { useAuth } from '@/lib/contexts/AuthContext';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const { newBids } = useFarmerBidNotifications(user?.id || null);

  return (
    <div>
      {/* Show notification badge */}
      <header>
        <h1>Dashboard</h1>
        <div className="notification-center">
          <span className="badge">{newBids.length}</span>
          {newBids.length > 0 && (
            <div className="popup">
              {newBids.map(bid => (
                <div key={bid.bid_id}>
                  {bid.trader_name} bid ₹{bid.amount}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* When farmer switches to "Incoming Bids" tab, show them all */}
      <section>
        <h2>Incoming Bids</h2>
        {/* Fetch and display all bids from API */}
      </section>
    </div>
  );
};
`;