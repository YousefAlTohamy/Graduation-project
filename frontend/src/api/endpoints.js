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
