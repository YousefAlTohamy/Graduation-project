import apiClient from './client';

const BASE_URL = '/admin/scraping-sources';

export const getAllSources = async () => {
    const response = await apiClient.get(BASE_URL);
    return response.data;
};

export const createSource = async (data) => {
    const response = await apiClient.post(BASE_URL, data);
    return response.data;
};

export const updateSource = async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data;
};

export const deleteSource = async (id) => {
    await apiClient.delete(`${BASE_URL}/${id}`);
};

export const toggleSourceStatus = async (id) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/toggle`);
    return response.data;
};

export const testSources = async () => {
    const response = await apiClient.post(`${BASE_URL}/test`, {}, { timeout: 120000 });
    return response.data;
};
