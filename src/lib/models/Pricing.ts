export interface Pricing {
  id: string;
  name: string;
  priceOnePhoto: number;
  priceTwoPhoto: number;
  priceThreePhoto: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePricingRequest {
  name: string;
  priceOnePhoto: number;
  priceTwoPhoto: number;
  priceThreePhoto: number;
  isDefault?: boolean;
}

export interface UpdatePricingRequest extends CreatePricingRequest {
  id: string;
}

export interface UpdatePricingStatusRequest {
  id: string;
  isActive?: boolean;
  isDefault?: boolean;
}
