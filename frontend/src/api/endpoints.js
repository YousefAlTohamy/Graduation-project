import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/register', data),
  login: (data) => apiClient.post('/login', data),
  logout: () => apiClient.post('/logout'),
  getUser: () => apiClient.get('/user'),
};

export const jobsAPI = {
  getJobs: () => apiClient.get('/jobs'),
  getJobById: (id) => apiClient.get(`/jobs/${id}`),
  scrapeJobs: () => apiClient.post('/jobs/scrape'),
  // On-Demand Scraping
  scrapeJobIfMissing: (jobTitle, maxResults = 30) =>
    apiClient.post('/jobs/scrape-if-missing', { job_title: jobTitle, max_results: maxResults }),
  checkScrapingStatus: (jobId) => apiClient.get(`/scraping-status/${jobId}`),
};

export const cvAPI = {
  uploadCV: (formData) => apiClient.post('/upload-cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUserSkills: () => apiClient.get('/user/skills'),
  removeSkill: (skillId) => apiClient.delete(`/user/skills/${skillId}`),
};

export const gapAnalysisAPI = {
  analyzeJob: (jobId) => apiClient.get(`/gap-analysis/job/${jobId}`),
  analyzeMultipleJobs: (jobIds) => apiClient.post('/gap-analysis/batch', { job_ids: jobIds }),
  getRecommendations: () => apiClient.get('/gap-analysis/recommendations'),
};

// Market Intelligence API
export const marketIntelligenceAPI = {
  getOverview: () => apiClient.get('/market/overview'),
  getRoleStatistics: (roleTitle) => apiClient.get(`/market/role-statistics/${encodeURIComponent(roleTitle)}`),
  getTrendingSkills: (limit = 20, type = null) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    return apiClient.get(`/market/trending-skills?${params.toString()}`);
  },
  getSkillDemand: (roleTitle) => apiClient.get(`/market/skill-demand/${encodeURIComponent(roleTitle)}`),
};
