import { marketIntelligenceAPI } from '../api/endpoints';
import { useState, useEffect } from 'react';

export default function MarketIntelligence() {
  const [overview, setOverview] = useState(null);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [overviewRes, skillsRes] = await Promise.all([
        marketIntelligenceAPI.getOverview(),
        marketIntelligenceAPI.getTrendingSkills(15),
      ]);

      setOverview(overviewRes.data.data || overviewRes.data);
      setTrendingSkills(skillsRes.data.data || skillsRes.data || []);
    } catch (err) {
      console.error('Failed to load market intelligence:', err);
      setError(err.response?.data?.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Market Intelligence</h1>
          <p className="text-gray-600">Real-time job market insights and trending skills</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Overview Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Jobs</p>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {overview?.total_jobs?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Companies</p>
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-3xl font-bold text-secondary">
              {overview?.total_companies?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Job Roles</p>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {overview?.unique_roles?.toLocaleString() || '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Last Updated</p>
              <span className="text-2xl">🕐</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {overview?.last_scrape ? new Date(overview.last_scrape).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Trending Skills */}
        {trendingSkills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Top Trending Skills</h2>
            <p className="text-gray-600 text-sm mb-6">
              Most in-demand skills across all job postings
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{skill.skill_name || skill.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                        skill.type === 'technical' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {skill.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-primary">#{idx + 1}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Job Demand</span>
                      <span className="text-sm font-bold text-secondary">
                        {skill.job_count || 0} jobs
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Importance</span>
                      <span className="text-sm font-bold text-purple-600">
                        {skill.importance_score ? `${skill.importance_score.toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((skill.importance_score || 0), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">💡 Market Insights</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <p>
                <strong>Data-Driven Decisions:</strong> Our market intelligence analyzes real job postings to give you accurate skill demand insights.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <p>
                <strong>Regular Updates:</strong> Job market data is automatically refreshed twice weekly (Monday & Thursday) to keep insights current.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <p>
                <strong>Skill Prioritization:</strong> Focus your learning on skills marked as "Essential" - they appear in 70%+ of relevant job postings.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
