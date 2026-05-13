import axiosApi from "@/app/lib/axios";

/**
 * Geographical API Service
 * Handles all region, province, city, and barangay operations
 */

// ===== REGIONS =====

export const getAllRegions = async () => {
  const response = await axiosApi.get("/geographical/regions");
  return response.data?.data || [];
}

export const getRegionByCode = async (regCode: string) => {
  const response = await axiosApi.get(`/geographical/regions/${regCode}`);
  return response.data?.data || {};
}

// ===== PROVINCES =====
export const getProvincesByRegion = async (regCode: string) => {
  const response = await axiosApi.get(`/geographical/regions/${regCode}/provinces`);
  return response.data?.data || [];
}

export const getProvinceByCode = async (provCode: string) => {
  const response = await axiosApi.get(`/geographical/provinces/${provCode}`);
  return response.data?.data || {};
}

// ===== CITIES =====
export const getCitiesByProvince = async (provCode: string) => {
  const response = await axiosApi.get(`/geographical/provinces/${provCode}/cities`);
  return response.data?.data || [];
}

export const getCityByCode = async (cityCode: string) => {
  const response = await axiosApi.get(`/geographical/cities/${cityCode}`);
  return response.data?.data || {};
}

// ===== BARANGAYS =====
export const getBarangaysByCity = async (cityCode: string) => {
  const response = await axiosApi.get(`/geographical/cities/${cityCode}/barangays`);
  return response.data?.data || [];
}

export const getBarangayByCode = async (brgyCode: string) => {
  const response = await axiosApi.get(`/geographical/barangays/${brgyCode}`);
  return response.data?.data || {};
}

// ===== SEARCH =====
export const searchGeographical = async (query: string, type?: string) => {
  const params = new URLSearchParams({ query });
  if (type) params.append("type", type);
  
  const response = await axiosApi.get(`/geographical/search?${params}`);
  return response.data?.data || {};
}

// ===== HIERARCHY =====
export const getRegionHierarchy = async (regCode: string) => {
  const response = await axiosApi.get(`/geographical/hierarchy/${regCode}`);
  return response.data?.data || {};
}
