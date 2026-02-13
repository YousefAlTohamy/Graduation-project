import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gapAnalysisAPI } from '../api/endpoints';

export default function GapAnalysis() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, [jobId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await gapAnalysisAPI.analyzeJob(jobId);
      setAnalysis(response.data.data || response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load gap analysis:', err);
      setError(err.response?.data?.message || 'Failed to analyze job gap');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Analyzing job gap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/jobs')}
          className="text-primary hover:text-secondary mb-8 transition font-semibold"
        >
          Back to Jobs
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Analysis */}
            <div className="md:col-span-2 space-y-6">
              {/* Job Title */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {analysis.job?.title || 'Job Analysis'}
                </h1>
                <p className="text-gray-600 mb-4">
                  {analysis.job?.company || 'Company Name'}
                </p>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="bg-accent px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {analysis.match_percentage || 0}%
                    </p>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Your Skills</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysis.matched_skills?.length || 0}
                    </p>
                  </div>
                  <div className="bg-amber-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Missing Skills</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {analysis.missing_skills?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Skills */}
              {analysis.matched_skills && analysis.matched_skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Your Skills
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {analysis.matched_skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
                      >
                        <p className="font-semibold text-green-700 text-sm">{skill}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {analysis.missing_skills && analysis.missing_skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Skills to Develop
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {analysis.missing_skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center"
                      >
                        <p className="font-semibold text-amber-700 text-sm">{skill}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Recommendations
                  </h2>
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-accent border border-secondary rounded-lg">
                        <p className="font-semibold text-secondary mb-2">{rec.title}</p>
                        <p className="text-gray-600 text-sm">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-4">
                {analysis.job?.salary && (
                  <div>
                    <p className="text-gray-600 text-sm">Salary Range</p>
                    <p className="font-semibold text-gray-900">{analysis.job.salary}</p>
                  </div>
                )}
                {analysis.job?.experience && (
                  <div>
                    <p className="text-gray-600 text-sm">Experience Required</p>
                    <p className="font-semibold text-gray-900">{analysis.job.experience}</p>
                  </div>
                )}
                {analysis.job?.location && (
                  <div>
                    <p className="text-gray-600 text-sm">Location</p>
                    <p className="font-semibold text-gray-900">{analysis.job.location}</p>
                  </div>
                )}
                <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition font-semibold">
                  Apply for Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
