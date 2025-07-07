"use client";

import LogoutButton from '@/app/components/LogoutButton';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'revenues' | 'machine-revenues' | 'coupons' | 'settings' | 'edit'>('revenues');
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [machineRevenues, setMachineRevenues] = useState<MachineRevenue[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [machineRevenuesLoading, setMachineRevenuesLoading] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [quickCouponLoading, setQuickCouponLoading] = useState<string | null>(null);
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
      console.log('Fetching store data with token:', token?.substring(0, 20) + '...'); // Debug log
      const response = await fetch('/api/store/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData); // Debug log
        throw new Error(errorData.error || 'Failed to fetch store data');
      }

      const data = await response.json();
      console.log('Store data received:', data); // Debug log
      setStore(data.store);

      // Fetch default pricing
      try {
        const pricingResponse = await fetch('/api/pricing/default');
        if (pricingResponse.ok) {
          const pricingData = await pricingResponse.json();
          setDefaultPricing(pricingData);
        }
      } catch (err) {
        console.error('Error fetching default pricing:', err);
      }

      // Set default tab based on user role
      if (user?.role === 'STORE_OWNER') {
        setActiveTab('overview');
      } else {
        // For employees (USER, MACHINE), default to revenues tab
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

      // Tính toán doanh thu theo máy
      calculateMachineRevenues(data.store);
    } catch (err) {
      console.error('Error fetching store data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };
    // Kiểm tra quyền truy cập
    if (!user) return;

    // Allow STORE_OWNER and store employees (USER, MACHINE) to access
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

  // Helper function to generate 4 random digits
  const generateRandomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates number from 1000-9999
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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 5MB', 'error');
      return;
    }

    setLogoFile(file);

    // Create preview
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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh', 'error');
      return;
    }

    // Validate file size (max 10MB for background)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước file không được vượt quá 10MB', 'error');
      return;
    }

    setBackgroundFile(file);

    // Create preview
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
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload/store-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const data = await response.json();
      console.log('Upload success:', data);
      return data.url;
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
      const formData = new FormData();
      formData.append('file', backgroundFile);
      formData.append('type', 'background');

      const response = await fetch('/api/upload/store-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload background error:', errorData);
        throw new Error(errorData.error || 'Failed to upload background');
      }

      const data = await response.json();
      console.log('Upload background success:', data);
      return data.url;
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

      // Upload logo first if there's a new logo
      let logoUrl = store?.logo || '';
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          return; // Stop if logo upload failed
        }
      }

      // Upload background if there's a new background
      let backgroundUrl = store?.background || '';
      if (backgroundFile) {
        const uploadedUrl = await uploadBackground();
        if (uploadedUrl) {
          backgroundUrl = uploadedUrl;
        } else {
          return; // Stop if background upload failed
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

      // Update store data in state
      setStore(prev => prev ? {
        ...prev,
        ...updatedStore,
        logo: logoUrl,
        background: backgroundUrl
      } : null);

      
      // Reset upload states
      setLogoFile(null);
      setLogoPreview('');
      setBackgroundFile(null);
      setBackgroundPreview('');

      // Show success message
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

    // Reset form to original values
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

    // Reset logo and background states
    setLogoFile(null);
    setLogoPreview('');
    setBackgroundFile(null);
    setBackgroundPreview('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Store Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            {store.logo && (
              <img src={store.logo} alt="Logo" className="h-10 w-10 mr-3 rounded-lg" />
            )}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">{store.name}</h1>
              {store.slogan && (
                <p className="text-sm text-gray-500">{store.slogan}</p>
              )}
            </div>
          </div>


        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <div className="px-3">
            {[
              { key: 'overview', label: 'Tổng quan', icon: '📊', roles: ['STORE_OWNER'] },
              { key: 'revenues', label: 'Doanh thu máy', icon: '💰', roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
              { key: 'machine-revenues', label: 'Chi tiết máy', icon: '🎰', roles: ['STORE_OWNER', 'USER', 'MACHINE'] },
              { key: 'coupons', label: 'Mã giảm giá', icon: '🎫', roles: ['STORE_OWNER', 'USER'] },
              { key: 'employees', label: 'Nhân viên', icon: '👥', roles: ['STORE_OWNER'] },
              { key: 'settings', label: 'Thông tin cửa hàng', icon: '📋', roles: ['STORE_OWNER'] },
              { key: 'edit', label: 'Chỉnh sửa cửa hàng', icon: '✏️', roles: ['STORE_OWNER'] },
            ].filter(tab => tab.roles.includes(user?.role || '')).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key    as 'overview' | 'employees' | 'revenues' | 'machine-revenues' | 'coupons' | 'settings' | 'edit');
                  setSelectedMachine(null);

                  // Load data when switching to specific tabs
                  if (tab.key === 'machine-revenues') {
                    fetchMachineRevenues();
                  } else if (tab.key === 'coupons') {
                    fetchCoupons();
                  }
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors ${activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Chủ cửa hàng</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Employee Welcome Message */}
          {user?.role !== 'STORE_OWNER' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  <strong>Chào mừng {user?.name}!</strong> Bạn có quyền xem doanh thu cửa hàng và tạo mã giảm giá.
                  {user?.role === 'USER' && ' Để chỉnh sửa thông tin cửa hàng, vui lòng liên hệ chủ cửa hàng.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tổng quan cửa hàng</h2>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Nhân viên</div>
                      <div className="mt-1 text-3xl font-semibold text-gray-900">
                        {store.employees.length}/{store.maxEmployees}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Doanh thu hôm nay</div>
                      <div className="mt-1 text-3xl font-semibold text-gray-900">
                        {formatCurrency(store.todayRevenue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Doanh thu tháng</div>
                      <div className="mt-1 text-3xl font-semibold text-gray-900">
                        {formatCurrency(store.monthRevenue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
                      <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Máy hoạt động</div>
                      <div className="mt-1 text-3xl font-semibold text-gray-900">
                        {store.employees.filter(e => e.role === 'MACHINE' && e.isActive).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Revenue */}
              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Giao dịch gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Máy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã giảm giá</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {store.revenues.slice(0, 10).map((revenue) => (
                        <tr key={revenue.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(revenue.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(revenue.coupon && typeof revenue.coupon.discount === 'number' ? revenue.coupon.discount : 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user?.role !== 'MACHINE' ? (
                              <div>
                                <div className="font-medium">{revenue.user.name}</div>
                                {revenue.user.machineCode && (
                                  <div className="text-xs text-gray-500">{revenue.user.machineCode}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">---</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {revenue.coupon ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {revenue.coupon.code}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenues' && (
            <div>
              {!selectedMachine ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Doanh thu theo máy - Hôm nay</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {machineRevenues.map((machine) => (
                      <div key={machine.machineId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{machine.machineName}</h3>
                              <p className="text-sm text-gray-500">{machine.machineCode}</p>
                              {machine.location && (
                                <p className="text-xs text-gray-400 mt-1">📍 {machine.location}</p>
                              )}
                            </div>
                            <div className="bg-green-100 p-2 rounded-lg">
                              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(machine.todayRevenue)}
                              </p>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Số giao dịch:</span>
                              <span className="font-medium">{machine.totalTransactions}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Trung bình/giao dịch:</span>
                              <span className="font-medium">
                                {machine.totalTransactions > 0
                                  ? formatCurrency(machine.todayRevenue / machine.totalTransactions)
                                  : formatCurrency(0)
                                }
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedMachine(machine.machineId)}
                            className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Machine Revenue Detail View
                (() => {
                  const machine = machineRevenues.find(m => m.machineId === selectedMachine);
                  if (!machine) return null;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <button
                            onClick={() => setSelectedMachine(null)}
                            className="text-blue-600 hover:text-blue-800 mb-2 text-sm"
                          >
                            ← Quay lại danh sách máy
                          </button>
                          <h2 className="text-2xl font-bold text-gray-900">Chi tiết doanh thu - {machine.machineName}</h2>
                          <p className="text-gray-500">{machine.machineCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
                          <p className="text-3xl font-bold text-green-600">{formatCurrency(machine.todayRevenue)}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Lịch sử giao dịch</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã giảm giá</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {machine.revenues.map((revenue) => (
                                <tr key={revenue.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDateTime(revenue.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                    {formatCurrency(revenue.coupon && typeof revenue.coupon.discount === 'number' ? revenue.coupon.discount : 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {revenue.coupon ? (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                        {revenue.coupon.code} (-{revenue.coupon.discount})
                                      </span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {revenue.description || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý nhân viên</h2>

              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Danh sách nhân viên</h3>
                    <span className="text-sm text-gray-500">
                      {store.employees.length}/{store.maxEmployees} nhân viên
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {store.employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.name}
                            {employee.machineCode && (
                              <div className="text-xs text-gray-500">{employee.machineCode}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.role === 'MACHINE'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}>
                              {employee.role}
                            </span>
                            {employee.location && (
                              <div className="text-xs text-gray-500 mt-1">📍 {employee.location}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {employee.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(employee.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin cửa hàng</h2>

              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Thông tin chi tiết</h3>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ✏️ Chỉnh sửa
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tên cửa hàng</label>
                      <div className="mt-1 text-sm text-gray-900">{store.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slogan</label>
                      <div className="mt-1 text-sm text-gray-900">{store.slogan || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                      <div className="mt-1 text-sm text-gray-900">{store.address || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                      <div className="mt-1 text-sm text-gray-900">{store.phone || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-sm text-gray-900">{store.email || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Số nhân viên tối đa</label>
                      <div className="mt-1 text-sm text-gray-900">{store.maxEmployees}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Số máy tối đa</label>
                      <div className="mt-1 text-sm text-gray-900">{store.maxAccounts}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Màu chính</label>
                      <div className="mt-1 flex items-center">
                        <div
                          className="w-6 h-6 rounded border border-gray-300 mr-2"
                          style={{ backgroundColor: store.primaryColor || '#3B82F6' }}
                        ></div>
                        <span className="text-sm text-gray-900">{store.primaryColor || '#3B82F6'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Màu phụ</label>
                      <div className="mt-1 flex items-center">
                        <div
                          className="w-6 h-6 rounded border border-gray-300 mr-2"
                          style={{ backgroundColor: store.secondaryColor || '#10B981' }}
                        ></div>
                        <span className="text-sm text-gray-900">{store.secondaryColor || '#10B981'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo cửa hàng</label>
                      <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        {store.logo ? (
                          <img
                            src={store.logo}
                            alt="Store Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs text-center">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Chưa có logo
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hình nền cửa hàng</label>
                      <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        {store.background ? (
                          <img
                            src={store.background}
                            alt="Store Background"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs text-center">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Chưa có hình nền
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                    <div className="mt-1 text-sm text-gray-900">{store.description || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'machine-revenues' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết doanh thu theo máy</h2>
                <button
                  onClick={() => fetchMachineRevenues()}
                  disabled={machineRevenuesLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {machineRevenuesLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Đang tải...
                    </div>
                  ) : (
                    '🔄 Làm mới'
                  )}
                </button>
              </div>

              {machineRevenuesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {machineRevenues.map((machine) => (
                    <div key={machine.machineId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{machine.machineName}</h3>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {machine.machineCode}
                          </span>
                        </div>

                        {machine.location && (
                          <p className="text-sm text-gray-500 mb-4">📍 {machine.location}</p>
                        )}

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Doanh thu hôm nay:</span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(machine.todayRevenue)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Số giao dịch:</span>
                            <span className="font-semibold">{machine.totalTransactions}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Trung bình/giao dịch:</span>
                            <span className="font-semibold">
                              {machine.totalTransactions > 0
                                ? formatCurrency(machine.todayRevenue / machine.totalTransactions)
                                : formatCurrency(0)
                              }
                            </span>
                          </div>
                        </div>

                        {machine.revenues.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Giao dịch gần nhất:</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {machine.revenues.slice(0, 5).map((revenue) => (
                                <div key={revenue.id} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">
                                    {new Date(revenue.createdAt).toLocaleTimeString('vi-VN')}
                                  </span>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(revenue.coupon && typeof revenue.coupon.discount === 'number' ? revenue.coupon.discount : 0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'coupons' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => fetchCoupons()}
                    disabled={couponsLoading}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {couponsLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Đang tải...
                      </div>
                    ) : (
                      '🔄 Làm mới'
                    )}
                  </button>
                  {(user?.role === 'STORE_OWNER' || user?.role === 'USER') && (
                    <button
                      onClick={() => setShowCreateCouponModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      ➕ Tạo mã giảm giá
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Create Coupon Buttons */}
              {(user?.role === 'STORE_OWNER' || user?.role === 'USER') && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo mã giảm giá nhanh
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        setQuickCouponLoading('1');
                        const code = generateRandomCode();
                        const discount = defaultPricing ? defaultPricing.priceOnePhoto : 50;
                        const success = await createCoupon({ code, discount, usageLimit: 1 });
                        if (success) {
                          showToast(`Đã tạo mã ${code} giảm ${discount} xu `, 'success');
                        }
                        setQuickCouponLoading(null);
                      }}
                      disabled={quickCouponLoading !== null}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {quickCouponLoading === '1' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <span className="text-lg mr-2">🎯</span>
                      )}
                      Mã {defaultPricing ? defaultPricing.priceOnePhoto : 50} xu 
                    </button>
                    <button
                      onClick={async () => {
                        setQuickCouponLoading('2');
                        const code = generateRandomCode();
                        const discount = defaultPricing ? defaultPricing.priceTwoPhoto : 70;
                        const success = await createCoupon({ code, discount, usageLimit: 1 });
                        if (success) {
                          showToast(`Đã tạo mã ${code} giảm ${discount} xu `, 'success');
                        }
                        setQuickCouponLoading(null);
                      }}
                      disabled={quickCouponLoading !== null}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {quickCouponLoading === '2' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <span className="text-lg mr-2">🔥</span>
                      )}
                      Mã {defaultPricing ? defaultPricing.priceTwoPhoto : 70} xu 
                    </button>
                    <button
                      onClick={async () => {
                        setQuickCouponLoading('3');
                        const code = generateRandomCode();
                        const discount = defaultPricing ? defaultPricing.priceThreePhoto : 120;
                        const success = await createCoupon({ code, discount, usageLimit: 1 });
                        if (success) {
                          showToast(`Đã tạo mã ${code} giảm ${discount} xu `, 'success');
                        }
                        setQuickCouponLoading(null);
                      }}
                      disabled={quickCouponLoading !== null}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {quickCouponLoading === '3' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <span className="text-lg mr-2">💫</span>
                      )}
                      Mã {defaultPricing ? defaultPricing.priceThreePhoto : 120} xu  
                    </button>
                  </div>

                </div>
              )}
              {couponsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách mã giảm giá ({coupons.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảm giá</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sử dụng</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {coupons.map((coupon) => (
                          <tr key={coupon.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                              {coupon.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {coupon.discount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${coupon.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : coupon.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                {coupon.status === 'active' ? 'Hoạt động' :
                                  coupon.status === 'expired' ? 'Hết hạn' : 'Tạm dừng'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {coupon.usageCount}
                              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                              {coupon.remainingUses !== null && (
                                <div className="text-xs text-gray-500">
                                  Còn lại: {coupon.remainingUses}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(coupon.expiresAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {coupon.creator?.name || 'N/A'}
                              <div className="text-xs text-gray-500">
                                {formatDateTime(coupon.createdAt)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {coupons.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-lg mb-2">🎫</div>
                        <p className="text-gray-500">Chưa có mã giảm giá nào</p>
                        {(user?.role === 'STORE_OWNER' || user?.role === 'USER') && (
                          <button
                            onClick={() => setShowCreateCouponModal(true)}
                            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Tạo mã giảm giá đầu tiên →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && user?.role === 'STORE_OWNER' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa thông tin cửa hàng</h2>

              <div className="bg-white shadow-sm rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Cập nhật thông tin</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Logo cửa hàng</h4>

                      <div className="flex items-start space-x-6">
                        {/* Current Logo */}
                        <div className="flex-shrink-0">
                          <div className="text-sm font-medium text-gray-700 mb-2">Logo hiện tại</div>
                          <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                            {store.logo ? (
                              <img
                                src={store.logo}
                                alt="Current Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs text-center">
                                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Chưa có logo
                              </div>
                            )}
                          </div>
                        </div>

                        {/* New Logo Preview */}
                        {logoPreview && (
                          <div className="flex-shrink-0">
                            <div className="text-sm font-medium text-gray-700 mb-2">Logo mới</div>
                            <div className="w-24 h-24 border border-green-300 rounded-lg overflow-hidden bg-white">
                              <img
                                src={logoPreview}
                                alt="New Logo Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Controls */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 mb-2">Tải lên logo mới</div>
                          <div
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors"
                            onDrop={handleLogoDrop}
                            onDragOver={handleLogoDragOver}
                          >
                            <div className="space-y-1 text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                  <span>Chọn file</span>
                                  <input
                                    id="logo-upload"
                                    name="logo-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    disabled={logoUploading}
                                  />
                                </label>
                                <p className="pl-1">hoặc kéo thả</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>

                              {logoFile && (
                                <div className="mt-2">
                                  <p className="text-sm text-green-600">✓ {logoFile.name}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLogoFile(null);
                                      setLogoPreview('');
                                      // Reset file input
                                      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
                                      if (fileInput) fileInput.value = '';
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                                  >
                                    Xóa file đã chọn
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Background Upload Section */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Hình nền cửa hàng</h4>

                      <div className="flex items-start space-x-6">
                        {/* Current Background */}
                        <div className="flex-shrink-0">
                          <div className="text-sm font-medium text-gray-700 mb-2">Hình nền hiện tại</div>
                          <div className="w-32 h-20 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                            {store.background ? (
                              <img
                                src={store.background}
                                alt="Current Background"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs text-center">
                                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Chưa có hình nền
                              </div>
                            )}
                          </div>
                        </div>

                        {/* New Background Preview */}
                        {backgroundPreview && (
                          <div className="flex-shrink-0">
                            <div className="text-sm font-medium text-gray-700 mb-2">Hình nền mới</div>
                            <div className="w-32 h-20 border border-green-300 rounded-lg overflow-hidden bg-white">
                              <img
                                src={backgroundPreview}
                                alt="New Background Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Controls */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 mb-2">Tải lên hình nền mới</div>
                          <div
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors"
                            onDrop={handleBackgroundDrop}
                            onDragOver={handleBackgroundDragOver}
                          >
                            <div className="space-y-1 text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="background-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                  <span>Chọn file</span>
                                  <input
                                    id="background-upload"
                                    name="background-upload"
                                    type="file"
                                   
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleBackgroundChange}
                                    disabled={backgroundUploading}
                                  />
                                </label>
                                <p className="pl-1">hoặc kéo thả</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>

                              {backgroundFile && (
                                <div className="mt-2">
                                  <p className="text-sm text-green-600">✓ {backgroundFile.name}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBackgroundFile(null);
                                      setBackgroundPreview('');
                                      // Reset file input
                                      const fileInput = document.getElementById('background-upload') as HTMLInputElement;
                                      if (fileInput) fileInput.value = '';
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                                  >
                                    Xóa file đã chọn
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên cửa hàng <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleEditFormChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập tên cửa hàng"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={editForm.slogan}
                          onChange={(e) => handleEditFormChange('slogan', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập slogan"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ
                        </label>
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => handleEditFormChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập địa chỉ"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => handleEditFormChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleEditFormChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Màu chính
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={editForm.primaryColor}
                            onChange={(e) => handleEditFormChange('primaryColor', e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editForm.primaryColor}
                            onChange={(e) => handleEditFormChange('primaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="#3B82F6"
                          />
                          <div
                            className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                            style={{ backgroundColor: editForm.primaryColor }}
                            title="Preview màu chính"
                          ></div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Màu phụ
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={editForm.secondaryColor}
                            onChange={(e) => handleEditFormChange('secondaryColor', e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editForm.secondaryColor}
                            onChange={(e) => handleEditFormChange('secondaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="#10B981"
                          />
                          <div
                            className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                            style={{ backgroundColor: editForm.secondaryColor }}
                            title="Preview màu phụ"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập mô tả về cửa hàng..."
                      />
                    </div>

                    <div className="border-t pt-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-blue-800">
                            <strong>Lưu ý:</strong> Những thay đổi sẽ được áp dụng ngay lập tức sau khi cập nhật.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={updateLoading}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateStore}
                          disabled={updateLoading || logoUploading || backgroundUploading || !editForm.name.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {logoUploading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Đang tải logo...
                            </div>
                          ) : backgroundUploading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Đang tải hình nền...
                            </div>
                          ) : updateLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Đang cập nhật...
                            </div>
                          ) : (
                            '💾 Cập nhật thông tin'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tạo mã giảm giá mới</h3>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const couponData = {
                code: formData.get('code') as string,
                discount: Number(formData.get('discount')),
                usageLimit: formData.get('usageLimit') ? Number(formData.get('usageLimit')) : undefined,
              };

              const success = await createCoupon(couponData);
              if (success) {
                setShowCreateCouponModal(false);
                (e.target as HTMLFormElement).reset();
              }
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    pattern="[0-9]{4}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="VD: 1234"
                    maxLength={4}
                    minLength={4}
                    title="Mã phải là 4 chữ số"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phần trăm giảm giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discount"
                    required
                    min="1"
                    max="900"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Từ 1 đến 900</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới hạn sử dụng (tùy chọn)
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Không giới hạn"
                  />
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Mã giảm giá sẽ có hiệu lực trong 1 ngày kể từ khi tạo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo mã giảm giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`max-w-sm w-full rounded-lg shadow-lg border-l-4 p-4 ${toast.type === 'success'
            ? 'bg-green-50 border-green-400 text-green-800'
            : 'bg-red-50 border-red-400 text-red-800'
            }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setToast({ show: false, message: '', type: 'success' })}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
