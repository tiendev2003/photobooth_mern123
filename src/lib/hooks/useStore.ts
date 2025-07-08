import { Store } from "@/lib/models/Store";
import { useEffect, useState } from "react";

export function useStore() {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState<boolean>(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  const loadStoreInfo = async (storeId?: string) => {
    if (!storeId) {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      try {
        const user = JSON.parse(storedUser);
        if (!user.storeId) return;
        storeId = user.storeId;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return;
      }
    }

    try {
      setStoreLoading(true);
      setStoreError(null);
      
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const { store } = await response.json();
        setCurrentStore(store);
      } else {
        setStoreError('Không thể tải thông tin cửa hàng');
      }
    } catch (error) {
      console.error('Error loading store info:', error);
      setStoreError('Lỗi kết nối khi tải thông tin cửa hàng');
    } finally {
      setStoreLoading(false);
    }
  };

  const clearStore = () => {
    setCurrentStore(null);
    setStoreError(null);
  };

  // Auto load store info on mount
  useEffect(() => {
    loadStoreInfo();
  }, []);

  return {
    currentStore,
    storeLoading,
    storeError,
    loadStoreInfo,
    clearStore,
    setCurrentStore
  };
}
