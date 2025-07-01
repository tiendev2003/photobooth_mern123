"use client";

import { UserWithoutPassword } from '@/lib/models/User';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserWithoutPassword | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserWithoutPassword | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);

  // Load user and token from localStorage and verify token validity on initial render
  useEffect(() => {
    const verifyToken = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedToken && storedUser) {
        try {
          // Check token validity with the server
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setIsAdmin(['ADMIN', 'KETOAN'].includes(parsedUser.role));
          } else {
            // Token is invalid or was invalidated, log user out
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification error:', error);
          // On error, clear local storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []);

  // Define logout function with useCallback before it's used in the useEffect
  const logout = useCallback(async () => {
    // Clear token on server if we have a user ID and token
    if (user?.id && token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clean up client state
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Clear any heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
  }, [user, token, heartbeatInterval]);

  // Setup token verification heartbeat when token changes
  useEffect(() => {
    // Clear any existing interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }

    if (token) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.log('Session invalidated: Another login detected');
            logout();
          }
        } catch (error) {
          console.error('Heartbeat verification failed:', error);
        }
      }, 3000000);

      setHeartbeatInterval(interval);
    }

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [token, heartbeatInterval, logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const { user, token } = data;

      setUser(user);
      setToken(token);
      setIsAdmin(['ADMIN', 'KETOAN'].includes(user.role));

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
