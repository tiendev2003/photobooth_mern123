"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import { formatDateTime, generateRandomCode } from '../utils/formatters';
import Pagination from './Pagination';

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

interface CouponsTabProps {
    coupons: Coupon[];
    couponsLoading: boolean;
    defaultPricing: Pricing | null;
    onRefresh: () => void;
    onCreateCoupon: (couponData: {
        code: string;
        discount: number;
        usageLimit?: number;
    }) => Promise<boolean>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export default function CouponsTab({
    coupons,
    couponsLoading,
    defaultPricing,
    onRefresh,
    onCreateCoupon,
    showToast
}: CouponsTabProps) {
    const { user } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [quickCouponLoading, setQuickCouponLoading] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

     

    const totalItems = coupons.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCoupons = coupons.slice(startIndex, endIndex);

    // Reset to first page when items per page changes
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Reset to first page when coupons data changes
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handleQuickCoupon = async (type: string, discount: number) => {
        setQuickCouponLoading(type);
        const code = generateRandomCode();
        const success = await onCreateCoupon({ code, discount, usageLimit: 1 });
        if (success) {
            showToast(`Đã tạo mã ${code} giảm ${discount} xu`, 'success');
        }
        setQuickCouponLoading(null);
    };

    const getCouponStatusBadge = (coupon: Coupon) => {
        if (coupon.status === 'expired') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Hết hạn</span>;
        }
        if (!coupon.isActive) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Tạm dừng</span>;
        }
        if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Đã hết lượt</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Hoạt động</span>;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h2>
                <div className="flex space-x-3">
                    <button
                        onClick={onRefresh}
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
                            onClick={() => setShowCreateModal(true)}
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
                            onClick={() => handleQuickCoupon('1', defaultPricing?.priceOnePhoto || 50)}
                            disabled={quickCouponLoading !== null}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {quickCouponLoading === '1' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            ) : (
                                <span className="text-lg mr-2">🎯</span>
                            )}
                            Mã {defaultPricing?.priceOnePhoto || 50} xu
                        </button>
                        <button
                            onClick={() => handleQuickCoupon('2', defaultPricing?.priceTwoPhoto || 70)}
                            disabled={quickCouponLoading !== null}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {quickCouponLoading === '2' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            ) : (
                                <span className="text-lg mr-2">🔥</span>
                            )}
                            Mã {defaultPricing?.priceTwoPhoto || 70} xu
                        </button>
                        <button
                            onClick={() => handleQuickCoupon('3', defaultPricing?.priceThreePhoto || 120)}
                            disabled={quickCouponLoading !== null}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {quickCouponLoading === '3' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            ) : (
                                <span className="text-lg mr-2">💫</span>
                            )}
                            Mã {defaultPricing?.priceThreePhoto || 120} xu
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
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                Danh sách mã giảm giá ({totalItems})
                            </h3>
                            {totalItems > 0 && (
                                <div className="text-sm text-gray-500">
                                    Trang {currentPage} / {totalPages}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mã code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Giá trị
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sử dụng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người tạo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedCoupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                                            {coupon.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {coupon.discount} xu
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {coupon.currentUsage}
                                            {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getCouponStatusBadge(coupon)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDateTime(coupon.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coupon.creator?.name || '-'}
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
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Tạo mã giảm giá đầu tiên →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination Component */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </div>
            )}

            {/* Create Coupon Modal */}
            {showCreateModal && (
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

                            const success = await onCreateCoupon(couponData);
                            if (success) {
                                setShowCreateModal(false);
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
                                    onClick={() => setShowCreateModal(false)}
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
        </div>
    );
}
          