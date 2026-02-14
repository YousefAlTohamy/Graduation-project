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
                      {analysis.analysis?.match_percentage || analysis.match_percentage || 0}%
                    </p>
                    <p className="text-xs font-semibold text-secondary">
                      {analysis.analysis?.match_level || ''}
                    </p>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Your Skills</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysis.analysis?.matched_skills_count || analysis.matched_skills?.length || 0}
                    </p>
                  </div>
                  <div className="bg-amber-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Missing Skills</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {analysis.analysis?.missing_skills_count || analysis.missing_skills?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Breakdown Progress Bars */}
                {analysis.analysis?.breakdown && (
                  <div className="space-y-4 mt-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Technical Skills Match</span>
                        <span>{analysis.analysis.breakdown.technical.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000" 
                          style={{ width: `${analysis.analysis.breakdown.technical.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Soft Skills Match</span>
                        <span>{analysis.analysis.breakdown.soft.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full transition-all duration-1000" 
                          style={{ width: `${analysis.analysis.breakdown.soft.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Your Skills */}
              {(analysis.analysis?.matched_skills || analysis.matched_skills)?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Your Skills
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(analysis.analysis?.matched_skills || analysis.matched_skills).map((skill, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
                      >
                        <p className="font-semibold text-green-700 text-sm">
                          {typeof skill === 'object' ? skill.name : skill}
                        </p>
                        {skill.type && (
                          <p className="text-[10px] uppercase text-green-500 font-bold">{skill.type}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {(analysis.analysis?.missing_skills || analysis.missing_skills)?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Skills to Develop
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(analysis.analysis?.missing_skills || analysis.missing_skills).map((skill, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center"
                      >
                        <p className="font-semibold text-amber-700 text-sm">
                          {typeof skill === 'object' ? skill.name : skill}
                        </p>
                        {skill.type && (
                          <p className="text-[10px] uppercase text-amber-500 font-bold">{skill.type}</p>
                        )}
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
                        <p className="text-gray-800 text-sm">{typeof rec === 'string' ? rec : rec.text}</p>
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
