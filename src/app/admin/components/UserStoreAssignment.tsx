import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';

interface Store {
  id: string;
  name: string;
  maxEmployees: number;
  _count: {
    employees: number;
  }
}

interface UserStoreAssignmentProps {
  userId: string;
  storeId: string | null;
  onAssignmentComplete: (success: boolean, message: string) => void;
}

export function UserStoreAssignment({ userId, storeId, onAssignmentComplete }: UserStoreAssignmentProps) {
  const { token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(storeId);
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [storeToUpdate, setStoreToUpdate] = useState<Store | null>(null);
  const [newMaxEmployees, setNewMaxEmployees] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [updatingLimit, setUpdatingLimit] = useState(false);

  // Fetch stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setStores(data.stores || []);
        } else {
          console.error('Failed to fetch stores:', data.error);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };

    if (token) {
      fetchStores();
    }
  }, [token]);

  // Set the initial selected store ID
  useEffect(() => {
    setSelectedStoreId(storeId);
  }, [storeId]);

  const handleAssignStore = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ storeId: selectedStoreId })
      });

      const data = await response.json();
      
      if (response.ok) {
        let message = data.message || 'Đã cập nhật cửa hàng cho người dùng thành công';
        
        // If there's a warning about employee limit, show it
        if (data.warning) {
          message += `. Lưu ý: ${data.warning}`;
        }
        
        onAssignmentComplete(true, message);
      } else {
        onAssignmentComplete(false, data.error || 'Không thể cập nhật cửa hàng cho người dùng');
      }
    } catch (error) {
      console.error('Error assigning store to user:', error);
      onAssignmentComplete(false, 'Đã xảy ra lỗi khi cập nhật cửa hàng cho người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Function to update the store employee limit
  const handleUpdateEmployeeLimit = async () => {
    if (!storeToUpdate || updatingLimit) return;
    
    setUpdatingLimit(true);
    try {
      const response = await fetch(`/api/stores/${storeToUpdate.id}/maxEmployees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ maxEmployees: newMaxEmployees })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update the store in the local state
        setStores(stores.map(store => 
          store.id === storeToUpdate.id 
            ? { ...store, maxEmployees: newMaxEmployees } 
            : store
        ));
        
        setShowLimitModal(false);
        onAssignmentComplete(true, 'Đã cập nhật giới hạn nhân viên thành công');
      } else {
        onAssignmentComplete(false, data.error || 'Không thể cập nhật giới hạn nhân viên');
      }
    } catch (error) {
      console.error('Error updating employee limit:', error);
      onAssignmentComplete(false, 'Đã xảy ra lỗi khi cập nhật giới hạn nhân viên');
    } finally {
      setUpdatingLimit(false);
    }
  };

  // Function to open the limit update modal
  const openLimitModal = (store: Store) => {
    setStoreToUpdate(store);
    setNewMaxEmployees(store.maxEmployees + 5); // Default to current + 5
    setShowLimitModal(true);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mt-2">
      <h3 className="text-lg font-semibold mb-2">Gán người dùng cho cửa hàng</h3>
      
      {loadingStores ? (
        <p className="text-gray-500">Đang tải danh sách cửa hàng...</p>
      ) : (
        <div>
          <div className="mb-4">
            <label htmlFor="storeSelect" className="block text-gray-700 text-sm font-bold mb-2">
              Chọn cửa hàng
            </label>
            <select
              id="storeSelect"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
            >
              <option value="">-- Không thuộc cửa hàng nào --</option>
              {stores.map((store) => (
                <option
                  key={store.id}
                  value={store.id}
                >
                  {store.name} ({store._count.employees}/{store.maxEmployees} nhân viên)
                  {store._count.employees >= store.maxEmployees && ' - Đã đạt giới hạn'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Chọn &quot;Không thuộc cửa hàng nào&quot; để hủy gán người dùng khỏi cửa hàng
            </p>
          </div>

          {selectedStoreId && stores.find(s => s.id === selectedStoreId && s._count.employees >= s.maxEmployees) && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
              <p className="text-sm">
                Cửa hàng này đã đạt giới hạn nhân viên. Bạn vẫn có thể thêm nhân viên, nhưng nên cân nhắc tăng giới hạn.
              </p>
              <button
                type="button"
                className="mt-2 text-yellow-800 underline text-sm"
                onClick={() => openLimitModal(stores.find(s => s.id === selectedStoreId)!)}
              >
                Tăng giới hạn nhân viên
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              onClick={handleAssignStore}
              disabled={loading || (selectedStoreId === storeId)}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật cửa hàng'}
            </button>
          </div>
        </div>
      )}
      
      {/* Modal to update employee limit */}
      {showLimitModal && storeToUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="limitModal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-lg font-semibold">Tăng giới hạn nhân viên</h3>
              <button 
                onClick={() => setShowLimitModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4">
              <p className="mb-4">
                Cửa hàng <strong>{storeToUpdate.name}</strong> hiện có {storeToUpdate._count.employees} nhân viên 
                trên tổng số {storeToUpdate.maxEmployees} nhân viên tối đa.
              </p>
              
              <div className="mb-4">
                <label htmlFor="maxEmployees" className="block text-gray-700 text-sm font-bold mb-2">
                  Giới hạn nhân viên mới
                </label>
                <input
                  type="number"
                  id="maxEmployees"
                  min={storeToUpdate._count.employees}
                  value={newMaxEmployees}
                  onChange={(e) => setNewMaxEmployees(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                  onClick={() => setShowLimitModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleUpdateEmployeeLimit}
                  disabled={updatingLimit || newMaxEmployees < storeToUpdate._count.employees}
                >
                  {updatingLimit ? 'Đang cập nhật...' : 'Cập nhật giới hạn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
