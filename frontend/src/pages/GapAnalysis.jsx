import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gapAnalysisAPI } from '../api/endpoints';
import { useScrapingStatus } from '../hooks/useScrapingStatus';

// Priority badge configurations
const PRIORITY_CONFIG = {
  essential: {
    label: 'Essential',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    emoji: '🔴',
    description: 'Required by 70%+ of jobs',
  },
  important: {
    label: 'Important',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300', 
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    emoji: '🟡',
    description: 'Required by 40-70% of jobs',
  },
  nice_to_have: {
    label: 'Nice to Have',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    emoji: '💼',
    description: 'Required by <40% of jobs',
  },
};

export default function GapAnalysis() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrapingJobId, setScrapingJobId] = useState(null);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await gapAnalysisAPI.analyzeJob(jobId);
      const data = response.data.data || response.data;

      // Check if scraping is in progress
      if (data.status === 'processing' && data.scraping_job_id) {
        // Trigger polling via useScrapingStatus hook
        setScrapingJobId(data.scraping_job_id);
        setLoading(false); // Let the polling UI take over
        return;
      }

      // Check if scraping failed
      if (data.status === 'failed') {
        setError(data.error_message || 'Failed to gather market data. Please try again.');
        setLoading(false);
        return;
      }

      // Success - data is ready
      setAnalysis(data);
      setError('');
      setLoading(false);
    } catch (err) {
      console.error('Failed to load gap analysis:', err);
      setError(err.response?.data?.message || 'Failed to analyze job gap');
      setLoading(false);
    }
  };

  // Use the polling hook when we have a scraping job ID
  const { status, progress, error: scrapingError } = useScrapingStatus(scrapingJobId, {
    pollInterval: 3000,
    enabled: !!scrapingJobId,
    onCompleted: () => {
      // Clear scraping job ID and re-fetch analysis
      setScrapingJobId(null);
      loadAnalysis();
    },
    onFailed: (data) => {
      setScrapingJobId(null);
      setError(data.error_message || 'Failed to gather market data. Please try again.');
    },
  });

  useEffect(() => {
    loadAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const renderSkillsByPriority = (skills, priority) => {
    if (!skills || skills.length === 0) return null;

    const config = PRIORITY_CONFIG[priority];

    return (
      <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-2xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.emoji}</span>
            <div>
              <h3 className={`text-xl font-bold ${config.textColor}`}>
                {config.label} Skills
              </h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.badgeBg} ${config.badgeText}`}>
            {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className={`bg-white border-2 ${config.borderColor} rounded-lg p-3 text-center hover:shadow-md transition-shadow`}
            >
              <p className={`font-semibold ${config.textColor} text-sm`}>
                {typeof skill === 'object' ? skill.name : skill}
              </p>
              {skill.importance_score && (
                <p className="text-xs text-gray-500 mt-1">
                  {skill.importance_score.toFixed(0)}% demand
                </p>
              )}
              {skill.type && (
                <p className="text-[10px] uppercase text-gray-400 font-bold mt-1">{skill.type}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show "Gathering Live Data" UI when scraping is in progress
  if (scrapingJobId && status) {
    return (
      <div className="min-h-screen bg-light py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/jobs')}
            className="text-primary hover:text-secondary mb-8 transition font-semibold"
          >
            ← Back to Jobs
          </button>

          {/* Gathering Live Data Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <svg 
                  className="animate-spin h-10 w-10 text-primary" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🌐 Gathering Live Market Data
              </h2>
              <p className="text-gray-600 mb-4">
                We're analyzing the latest job market trends for this role...
              </p>
            </div>

            {/* Progress Bar */}
            {progress !== null && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">Progress</span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 font-semibold">
                {status === 'processing' 
                  ? '⚡ Scraping job postings from multiple sources...' 
                  : '⏳ Preparing your personalized analysis...'}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                This usually takes 30-60 seconds. Please don't close this page.
              </p>
            </div>

            {/* Error Display */}
            {scrapingError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{scrapingError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          ← Back to Jobs
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
              {/* Job Title & Match Score */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {analysis.job?.title || 'Job Analysis'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {analysis.job?.company || 'Company Name'}
                </p>

                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 px-6 py-4 rounded-xl flex-1">
                    <p className="text-sm text-gray-600 mb-1">Match Score</p>
                    <p className="text-4xl font-bold text-primary">
                      {analysis.analysis?.match_percentage || analysis.match_percentage || 0}%
                    </p>
                    <p className="text-xs font-semibold text-secondary mt-1">
                      {analysis.analysis?.match_level || ''}
                    </p>
                  </div>
                  <div className="bg-green-50 px-6 py-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Your Skills</p>
                    <p className="text-3xl font-bold text-green-600">
                      {analysis.analysis?.matched_skills_count || analysis.matched_skills?.length || 0}
                    </p>
                  </div>
                  <div className="bg-amber-50 px-6 py-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Skills to Learn</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {(analysis.missing_essential_skills?.length || 0) + 
                       (analysis.missing_important_skills?.length || 0) +
                       (analysis.missing_nice_to_have_skills?.length || 0)}
                    </p>
                  </div>
                </div>

                {/* Breakdown Progress Bars */}
                {analysis.analysis?.breakdown && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Technical Skills Match</span>
                        <span>{analysis.analysis.breakdown.technical.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-1000" 
                          style={{ width: `${analysis.analysis.breakdown.technical.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Soft Skills Match</span>
                        <span>{analysis.analysis.breakdown.soft.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-secondary h-3 rounded-full transition-all duration-1000" 
                          style={{ width: `${analysis.analysis.breakdown.soft.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Your Matching Skills */}
              {(analysis.analysis?.matched_skills || analysis.matched_skills)?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ✅ Your Matching Skills
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(analysis.analysis?.matched_skills || analysis.matched_skills).map((skill, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center"
                      >
                        <p className="font-semibold text-green-700 text-sm">
                          {typeof skill === 'object' ? skill.name : skill}
                        </p>
                        {skill.type && (
                          <p className="text-[10px] uppercase text-green-500 font-bold mt-1">{skill.type}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority-Based Skill Roadmap */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    📚 Your Learning Roadmap
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Skills prioritized by market demand - focus on Essential skills first
                  </p>
                </div>

                {renderSkillsByPriority(analysis.missing_essential_skills, 'essential')}
                {renderSkillsByPriority(analysis.missing_important_skills, 'important')}
                {renderSkillsByPriority(analysis.missing_nice_to_have_skills, 'nice_to_have')}

                {/* Learning Tips */}
                <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span>💡</span> Pro Learning Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Prioritize <strong>Essential skills</strong> - they appear in 70%+ of job postings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Complete at least 80% of Essential + Important skills to be competitive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Nice-to-have skills can set you apart from other candidates</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🎯 Personalized Recommendations
                  </h2>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-primary rounded-lg">
                        <p className="text-gray-800">{typeof rec === 'string' ? rec : rec.text}</p>
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
                {analysis.job?.url && (
                  <a
                    href={analysis.job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition font-semibold text-center"
                  >
                    Apply for Job ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
