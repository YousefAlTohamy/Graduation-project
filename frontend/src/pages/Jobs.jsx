import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, gapAnalysisAPI } from '../api/endpoints';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await jobsAPI.getJobs();
      const jobsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setJobs(jobsData);
      
      if (jobsData.length === 0) {
        setError('No jobs available at the moment. Please check back later.');
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load jobs. Please ensure the backend is running.';
      setError(errorMsg);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeJobGap = async (jobId) => {
    try {
      setAnalyzing(true);
      setError('');
      const response = await gapAnalysisAPI.analyzeJob(jobId);
      setGapAnalysis(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to analyze job gap:', err);
      const errorMsg = err.response?.data?.message || 'Failed to analyze job gap. Please try again.';
      setError(errorMsg);
      setGapAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    analyzeJobGap(job.id);
  };

  const handleViewFullAnalysis = (jobId) => {
    navigate(`/gap-analysis/${jobId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading job opportunities..." />;
  }

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Opportunities</h1>
          <p className="text-gray-600">Browse jobs and analyze skill gaps</p>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            title="Error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-200">
                Available Jobs ({jobs.length})
              </h2>
              {jobs.length === 0 ? (
                <p className="text-gray-600 py-8 text-center">No jobs available</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleJobSelect(job)}
                      className={`w-full text-left p-4 rounded-lg transition border-2 ${
                        selectedJob?.id === job.id
                          ? 'border-primary bg-accent'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                      <p className="text-xs text-gray-600">{job.company}</p>
                      {job.salary_range && (
                        <p className="text-xs text-primary mt-1">{job.salary_range}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={loadJobs}
                className="w-full mt-4 text-sm text-primary hover:text-secondary font-semibold"
              >
                Refresh Jobs
              </button>
            </div>
          </div>

          {/* Job Details & Gap Analysis */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="space-y-6">
                {/* Job Details */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900">{selectedJob.title}</h3>
                      <p className="text-xl text-primary mt-1">{selectedJob.company}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {selectedJob.location && (
                      <div className="p-4 bg-light rounded-lg">
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold">{selectedJob.location}</p>
                      </div>
                    )}
                    {selectedJob.salary_range && (
                      <div className="p-4 bg-accent rounded-lg">
                        <p className="text-sm text-gray-600">Salary Range</p>
                        <p className="font-semibold">{selectedJob.salary_range}</p>
                      </div>
                    )}
                    {selectedJob.job_type && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-white">Job Type</p>
                        <p className="font-semibold text-white">{selectedJob.job_type}</p>
                      </div>
                    )}
                    {selectedJob.experience && (
                      <div className="p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Experience</p>
                        <p className="font-semibold">{selectedJob.experience}</p>
                      </div>
                    )}
                  </div>

                  {selectedJob.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Gap Analysis */}
                {analyzing ? (
                  <LoadingSpinner message="Analyzing skill gaps..." />
                ) : gapAnalysis ? (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Gap Analysis</h3>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-semibold mb-2">Matched Skills</p>
                        <p className="text-3xl font-bold text-green-600">
                          {gapAnalysis.matched_skills?.length || 0}
                        </p>
                      </div>
                      <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 font-semibold mb-2">Missing Skills</p>
                        <p className="text-3xl font-bold text-amber-600">
                          {gapAnalysis.missing_skills?.length || 0}
                        </p>
                      </div>
                      <div className="p-6 bg-accent border-2 border-secondary rounded-lg">
                        <p className="text-sm text-secondary font-semibold mb-2">Match %</p>
                        <p className="text-3xl font-bold text-secondary">
                          {gapAnalysis.match_percentage || '0'}%
                        </p>
                      </div>
                    </div>

                    {gapAnalysis.matched_skills?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Your Matching Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {gapAnalysis.matched_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {gapAnalysis.missing_skills?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Skills to Acquire</h4>
                        <div className="flex flex-wrap gap-2">
                          {gapAnalysis.missing_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleViewFullAnalysis(selectedJob.id)}
                      className="w-full mt-6 bg-primary text-white py-2 rounded-lg hover:bg-secondary transition font-semibold"
                    >
                      View Full Analysis
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                <p className="text-gray-400 text-lg">Select a job to view details and gap analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
