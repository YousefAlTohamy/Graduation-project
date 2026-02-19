/**
 * scrapingSourcesApi.js
 * Axios-based helpers for the Admin Scraping Sources CRUD API.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/** Return config object with auth header */
const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

/** GET /api/admin/scraping-sources?page=N */
export const getSources = (page = 1) =>
    axios.get(`${BASE_URL}/admin/scraping-sources?page=${page}`, authConfig());

/** POST /api/admin/scraping-sources */
export const createSource = (data) =>
    axios.post(`${BASE_URL}/admin/scraping-sources`, data, authConfig());

/** PUT /api/admin/scraping-sources/:id */
export const updateSource = (id, data) =>
    axios.put(`${BASE_URL}/admin/scraping-sources/${id}`, data, authConfig());

/** DELETE /api/admin/scraping-sources/:id */
export const deleteSource = (id) =>
    axios.delete(`${BASE_URL}/admin/scraping-sources/${id}`, authConfig());

/** PATCH /api/admin/scraping-sources/:id/toggle */
export const toggleSource = (id) =>
    axios.patch(`${BASE_URL}/admin/scraping-sources/${id}/toggle`, {}, authConfig());
