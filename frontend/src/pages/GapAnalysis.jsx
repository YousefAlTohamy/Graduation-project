import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gapAnalysisAPI } from '../api/endpoints';
import { useScrapingStatus } from '../hooks/useScrapingStatus';

// ── SVG Circular Gauge ──────────────────────────────────────────────────────
function MatchGauge({ percentage }) {
  const pct = Math.min(100, Math.max(0, percentage || 0));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 75 ? '#16a34a'   // green-600
    : pct >= 50 ? '#d97706'  // amber-600
    : '#dc2626';              // red-600

  const level =
    pct >= 90 ? 'Excellent Match'
    : pct >= 75 ? 'Good Match'
    : pct >= 60 ? 'Fair Match'
    : pct >= 40 ? 'Moderate Gap'
    : 'Large Gap';

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        {/* progress arc */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        {/* label */}
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="26" fontWeight="700">
          {Math.round(pct)}
        </text>
        <text x="70" y="82" textAnchor="middle" fill={color} fontSize="13" fontWeight="600">
          %
        </text>
      </svg>
      <span
        className="mt-1 px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {level}
      </span>
    </div>
  );
}

// ── Phase 1 Skill Cards ──────────────────────────────────────────────────────
const CARD_CONFIG = {
  strengths: {
    title: '✅ Your Strengths',
    subtitle: 'Skills you already have',
    bg: 'bg-green-50',
    border: 'border-green-300',
    headerText: 'text-green-700',
    chipBg: 'bg-white border border-green-300',
    chipText: 'text-green-800',
    badgeBg: 'bg-green-100 text-green-700',
    emptyText: 'No matching skills found — try adding skills to your profile.',
  },
  critical: {
    title: '🔴 Critical Missing Skills',
    subtitle: 'High-importance gaps (must-have)',
    bg: 'bg-red-50',
    border: 'border-red-300',
    headerText: 'text-red-700',
    chipBg: 'bg-white border border-red-300',
    chipText: 'text-red-800',
    badgeBg: 'bg-red-100 text-red-700',
    emptyText: "🎉 No critical gaps — you're well-matched for this role!",
  },
  nicetohave: {
    title: '💼 Nice-to-Have',
    subtitle: 'Bonus skills to stand out',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    headerText: 'text-blue-700',
    chipBg: 'bg-white border border-blue-300',
    chipText: 'text-blue-800',
    badgeBg: 'bg-blue-100 text-blue-700',
    emptyText: 'No nice-to-have skills listed for this job.',
  },
};

function SkillCard({ variant, skills }) {
  const cfg = CARD_CONFIG[variant];
  return (
    <div className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl p-6`}>
      <div className="mb-4">
        <h3 className={`text-lg font-bold ${cfg.headerText}`}>{cfg.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{cfg.subtitle}</p>
      </div>
      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => {
            const name = typeof skill === 'object' ? skill.name : skill;
            const score = typeof skill === 'object' ? skill.importance_score : null;
            return (
              <div
                key={idx}
                className={`${cfg.chipBg} rounded-lg px-3 py-2 flex flex-col items-center min-w-[80px]`}
              >
                <span className={`text-xs font-semibold ${cfg.chipText} text-center`}>{name}</span>
                {score != null && (
                  <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full font-bold ${cfg.badgeBg}`}>
                    {Math.round(score)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={`text-sm ${cfg.headerText} opacity-70`}>{cfg.emptyText}</p>
      )}
    </div>
  );
}


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
          <>
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

                {/* Match Gauge + counter strip */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                  <MatchGauge percentage={analysis.analysis?.match_percentage ?? analysis.match_percentage ?? 0} />
                  <div className="flex flex-wrap gap-4 flex-1">
                    <div className="flex-1 min-w-[100px] bg-green-50 rounded-xl px-5 py-4">
                      <p className="text-xs text-gray-500 mb-1">Your Skills</p>
                      <p className="text-3xl font-bold text-green-600">
                        {analysis.analysis?.matched_skills_count ?? analysis.matched_skills?.length ?? 0}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[100px] bg-red-50 rounded-xl px-5 py-4">
                      <p className="text-xs text-gray-500 mb-1">Critical Gaps</p>
                      <p className="text-3xl font-bold text-red-600">
                        {analysis.critical_skills?.length ?? 0}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[100px] bg-blue-50 rounded-xl px-5 py-4">
                      <p className="text-xs text-gray-500 mb-1">Nice-to-Have</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {analysis.nice_to_have_skills?.length ?? 0}
                      </p>
                    </div>
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

              {/* ── Phase 1: Three Skill Cards ────────────────────────────── */}
              <div className="space-y-4">
                <SkillCard
                  variant="strengths"
                  skills={analysis.analysis?.matched_skills || analysis.matched_skills}
                />
                <SkillCard
                  variant="critical"
                  skills={analysis.critical_skills}
                />
                <SkillCard
                  variant="nicetohave"
                  skills={analysis.nice_to_have_skills}
                />
              </div>

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

          {/* ── Recommended Jobs Based on Your CV ──────────────────────────── */}
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💼</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs Based on Your CV</h2>
                <p className="text-sm text-gray-500">Jobs that match your detected role and skills</p>
              </div>
            </div>

            {analysis.recommended_jobs && analysis.recommended_jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {analysis.recommended_jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {/* Job header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                          {job.title}
                        </h3>
                        {job.source && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                            {job.source}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{job.company}</p>
                      {job.location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {job.location}</p>
                      )}
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.job_type && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {job.job_type}
                        </span>
                      )}
                      {job.salary_range && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          💰 {job.salary_range}
                        </span>
                      )}
                    </div>

                    {/* Apply button */}
                    <a
                      href={job.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gradient-to-r from-primary to-secondary text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Apply Now ↗
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-600 font-semibold">No matching jobs found yet.</p>
                <p className="text-gray-400 text-sm mt-1">
                  As more jobs are scraped that match your detected role, they'll appear here.
                </p>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
