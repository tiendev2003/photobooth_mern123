"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { uploadImageWithStore } from '@/lib/utils/uploadApi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Components
import CouponsTab from './components/CouponsTab';
import EditStoreTab from './components/EditStoreTab';
import EmployeeWelcome from './components/EmployeeWelcome';
import EmployeesTab from './components/EmployeesTab';
import MachineRevenuesTab from './components/MachineRevenuesTab';
import OverviewTab from './components/OverviewTab';
import RevenuesTab from './components/RevenuesTab';
import SettingsTab from './components/SettingsTab';
import StoreSidebar from './components/StoreSidebar';
import TemplatesTab from './components/TemplatesTab';
import Toast from './components/Toast';

// Utils

interface StoreInfo {
  id: string;
  name: string;
  slogan?: string;
  logo?: string;
  background?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxEmployees: number;
  maxAccounts: number;
  employees: Employee[];
  revenues: Revenue[];
  todayRevenue: number;
  monthRevenue: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  machineCode?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

interface Revenue {
  id: string;
  description?: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
    machineCode?: string;
  };
  coupon?: {
    code: string;
    discount: number;
  };
}

interface MachineRevenue {
  machineId: string;
  machineName: string;
  machineCode: string;
  location?: string;
  todayRevenue: number;
  totalTransactions: number;
  revenues: Revenue[];
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  expiresAt: string;
  isActive: boolean;
  usageLimit: number | null;
  currentUsage: number;
  status: 'active' | 'inactive' | 'expired';
  usageCount: number;
  remainingUses: number | null;
  createdAt: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface Pricing {
  id: string;
  name: string;
  priceOnePhoto: number;
  priceTwoPhoto: number;
  priceThreePhoto: number;
  isActive: boolean;
  isDefault: boolean;
}

export default function StoreDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [defaultPricing, setDefaultPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'revenues' | 'machine-revenues' | 'coupons' | 'settings' | 'edit' | 'templates'>('revenues');
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [machineRevenues, setMachineRevenues] = useState<MachineRevenue[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [machineRevenuesLoading, setMachineRevenuesLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    slogan: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '',
    secondaryColor: '',
  });

  const [updateLoading, setUpdateLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        console.log('Fetching store data with token:', token?.substring(0, 20) + '...');
        const response = await fetch('/api/store/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch store data');
        }

        const data = await response.json();
        console.log('Store data received:', data);
        setStore(data.store);

        // Fetch default pricing
        try {
          const pricingResponse = await fetch('/api/pricing/default');
           if (!pricingResponse.ok) {
            const errorData = await pricingResponse.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error || 'Failed to fetch default pricing');
          }
          setDefaultPricing(await pricingResponse.json());
        } catch (err) {
          console.error('Error fetching default pricing:', err);
        }

        // Set default tab based on user role
        if (user?.role === 'STORE_OWNER') {
          setActiveTab('overview');
        } else {
          setActiveTab('revenues');
        }

        // Initialize edit form with store data
        setEditForm({
          name: data.store.name || '',
          slogan: data.store.slogan || '',
          description: data.store.description || '',
          address: data.store.address || '',
          phone: data.store.phone || '',
          email: data.store.email || '',
          primaryColor: data.store.primaryColor || '#3B82F6',
          secondaryColor: data.store.secondaryColor || '#10B981',
        });

        // Calculate machine revenues
        calculateMachineRevenues(data.store);
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load store data');
      } finally {
        setLoading(false);
      }
    };

    // Check access permissions
    if (!user) return;

    if (!['STORE_OWNER', 'USER', 'MACHINE'].includes(user.role)) {
      router.push('/admin');
      return;
    }

    fetchStoreData();
  }, [user, token, router]);

  const calculateMachineRevenues = (storeData: StoreInfo) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const machines = storeData.employees.filter(emp => emp.role === 'MACHINE');

    const machineRevenueData: MachineRevenue[] = machines.map(machine => {
      const machineRevenues = storeData.revenues.filter(rev =>
        rev.user.machineCode === machine.machineCode
      );

      const todayRevenues = machineRevenues.filter(rev => {
        const revDate = new Date(rev.createdAt);
        return revDate >= today && revDate < tomorrow;
      });

      const todayTotal = todayRevenues.reduce((sum, rev) => sum + (rev.coupon && typeof rev.coupon.discount === 'number' ? rev.coupon.discount : 0), 0);

      return {
        machineId: machine.id,
        machineName: machine.name,
        machineCode: machine.machineCode || '',
        location: machine.location,
        todayRevenue: todayTotal,
        totalTransactions: todayRevenues.length,
        revenues: machineRevenues.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      };
    });

    setMachineRevenues(machineRevenueData.sort((a, b) => b.todayRevenue - a.todayRevenue));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchMachineRevenues = async (date?: string) => {
    try {
      setMachineRevenuesLoading(true);
      const url = new URL('/api/store/machine-revenues', window.location.origin);
      if (date) {
        url.searchParams.set('date', date);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch machine revenues');
      }

      const data = await response.json();
      setMachineRevenues(data.machines || []);
    } catch (error) {
      console.error('Error fetching machine revenues:', error);
      showToast('Không thể tải dữ liệu doanh thu máy', 'error');
    } finally {
      setMachineRevenuesLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const response = await fetch('/api/store/coupons', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch coupons');
      }

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      showToast('Không thể tải dữ liệu mã giảm giá', 'error');
    } finally {
      setCouponsLoading(false);
    }
  };

  const createCoupon = async (couponData: {
    code: string;
    discount: number;
    usageLimit?: number;
  }) => {
    try {
      // Validate code format: must be exactly 4 digits
      if (!/^\d{4}$/.test(couponData.code)) {
        showToast('Mã giảm giá phải là 4 chữ số', 'error');
        return false;
      }

      const response = await fetch('/api/store/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create coupon');
      }

      const data = await response.json();
      setCoupons(prev => [data.coupon, ...prev]);
      showToast('Tạo mã giảm giá thành công!', 'success');
      return true;
    } catch (error) {
      console.error('Error creating coupon:', error);
      showToast(error instanceof Error ? error.message : 'Không thể tạo mã giảm giá', 'error');
      return false;
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processLogoFile(file);
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error');
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleLogoDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processBackgroundFile(file);
  };

  const processBackgroundFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 10MB', 'error');
      return;
    }

    setBackgroundFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processBackgroundFile(file);
    }
  };

  const handleBackgroundDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      setLogoUploading(true);
      return await uploadImageWithStore(logoFile);
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('Không thể tải lên logo', 'error');
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  const uploadBackground = async (): Promise<string | null> => {
    if (!backgroundFile) return null;

    try {
      setBackgroundUploading(true);
      return await uploadImageWithStore(backgroundFile);
    } catch (error) {
      console.error('Error uploading background:', error);
      showToast('Không thể tải lên hình nền', 'error');
      return null;
    } finally {
      setBackgroundUploading(false);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateStore = async () => {
    try {
      setUpdateLoading(true);

      let logoUrl = store?.logo || '';
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          return;
        }
      }

      let backgroundUrl = store?.background || '';
      if (backgroundFile) {
        const uploadedUrl = await uploadBackground();
        if (uploadedUrl) {
          backgroundUrl = uploadedUrl;
        } else {
          return;
        }
      }

      const updateData = {
        ...editForm,
        logo: logoUrl,
        background: backgroundUrl,
      };

      const response = await fetch('/api/store/dashboard', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update store');
      }

      const updatedStore = await response.json();

      setStore(prev => prev ? {
        ...prev,
        ...updatedStore,
        logo: logoUrl,
        background: backgroundUrl
      } : null);

      setLogoFile(null);
      setLogoPreview('');
      setBackgroundFile(null);
      setBackgroundPreview('');

      showToast('Cập nhật thông tin cửa hàng thành công!', 'success');

    } catch (err) {
      console.error('Error updating store:', err);
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật thông tin cửa hàng', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!store) return;

    setEditForm({
      name: store.name || '',
      slogan: store.slogan || '',
      description: store.description || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      primaryColor: store.primaryColor || '#3B82F6',
      secondaryColor: store.secondaryColor || '#10B981',
    });

    setLogoFile(null);
    setLogoPreview('');
    setBackgroundFile(null);
    setBackgroundPreview('');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'overview' | 'employees' | 'revenues' | 'machine-revenues' | 'coupons' | 'settings' | 'edit' | 'templates');
    setSelectedMachine(null);
    
    // Load data when switching to specific tabs
    if (tab === 'coupons' && coupons.length === 0) {
      fetchCoupons();
    }
    if (tab === 'machine-revenues' && machineRevenues.length === 0) {
      fetchMachineRevenues();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-md">
          <p className="text-red-700">{error || 'Store not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed md:relative md:translate-x-0 z-30 transition-transform duration-300 ease-in-out`}>
        <StoreSidebar 
          store={store}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0   z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Main Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isSidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {activeTab === 'overview' && 'Tổng quan'}
              {activeTab === 'revenues' && 'Doanh thu'}
              {activeTab === 'machine-revenues' && 'Chi tiết máy'}
              {activeTab === 'coupons' && 'Mã giảm giá'}
              {activeTab === 'employees' && 'Nhân viên'}
              {activeTab === 'settings' && 'Thông tin cửa hàng'}
              {activeTab === 'edit' && 'Chỉnh sửa cửa hàng'}
              {activeTab === 'templates' && 'Mẫu khung ảnh'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{store.name}</span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {/* Employee Welcome Message */}
          <EmployeeWelcome storeName={store.name} />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab store={store} />
          )}

          {activeTab === 'revenues' && (
            <RevenuesTab
              machineRevenues={machineRevenues}
              selectedMachine={selectedMachine}
              onMachineSelect={setSelectedMachine}
            />
          )}

          {activeTab === 'machine-revenues' && (
            <MachineRevenuesTab
              machineRevenues={machineRevenues}
              loading={machineRevenuesLoading}
              onRefresh={() => fetchMachineRevenues()}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              couponsLoading={couponsLoading}
              defaultPricing={defaultPricing}
              onRefresh={fetchCoupons}
              onCreateCoupon={createCoupon}
              showToast={showToast}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesTab 
              employees={store.employees}
              maxEmployees={store.maxEmployees}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              store={store}
              onEditClick={() => setActiveTab('edit')}
            />
          )}

          {activeTab === 'edit' && user?.role === 'STORE_OWNER' && (
            <EditStoreTab
              store={store}
              editForm={editForm}
              updateLoading={updateLoading}
              logoFile={logoFile}
              logoPreview={logoPreview}
              logoUploading={logoUploading}
              backgroundFile={backgroundFile}
              backgroundPreview={backgroundPreview}
              backgroundUploading={backgroundUploading}
              onFormChange={handleEditFormChange}
              onLogoChange={handleLogoChange}
              onLogoDrop={handleLogoDrop}
              onLogoDragOver={handleLogoDragOver}
              onBackgroundChange={handleBackgroundChange}
              onBackgroundDrop={handleBackgroundDrop}
              onBackgroundDragOver={handleBackgroundDragOver}
              onUpdateStore={handleUpdateStore}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab 
              storeId={store.id}
            />
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}
