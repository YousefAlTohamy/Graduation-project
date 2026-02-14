import { useEffect, useState } from 'react';
import { cvAPI, gapAnalysisAPI } from '../api/endpoints';

export default function Dashboard() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadSkills();
    loadRecommendations();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await cvAPI.getUserSkills();
      const skillsData = response.data.data?.skills || response.data.data || [];
      setSkills(Array.isArray(skillsData) ? skillsData : []);
    } catch (error) {
      console.error('Error loading skills:', error);
      setMessage('Failed to load skills');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await gapAnalysisAPI.getRecommendations();
      const recsData = response.data.data?.recommendations || response.data.data || {};
      setRecommendations(recsData);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations({});
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    try {
      setUploading(true);
      setMessage('');
      await cvAPI.uploadCV(formData);
      setMessage('CV uploaded successfully! Skills extracted.');
      await loadSkills();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('CV upload error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload CV';
      setMessage(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const removeSkill = async (skillId) => {
    try {
      await cvAPI.removeSkill(skillId);
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      setMessage('Failed to remove skill');
    }
  };

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* CV Upload Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your CV</h2>
              
              {message && (
                <div className="mb-4 p-4 rounded-lg" style={{
                  backgroundColor: message.includes('Failed') ? '#FEE2E2' : '#ECFDF5',
                  borderColor: message.includes('Failed') ? '#FCA5A5' : '#86EFAC',
                  borderWidth: '1px'
                }}>
                  <p style={{ color: message.includes('Failed') ? '#DC2626' : '#16A34A' }}>
                    {message}
                  </p>
                </div>
              )}

              <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:bg-accent transition">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="text-lg font-semibold text-primary">
                    {uploading ? 'Uploading...' : 'Click to upload CV'}
                  </span>
                  <p className="text-gray-600 text-sm mt-2">
                    Supported formats: PDF, DOC, DOCX
                  </p>
                </label>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Skills</h3>
              
              {loading ? (
                <p className="text-gray-600">Loading skills...</p>
              ) : skills.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Upload a CV to extract your skills
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-light border border-primary rounded-lg p-3 flex items-center justify-between group hover:shadow-md transition"
                    >
                      <span className="font-semibold text-primary text-sm">{skill.name}</span>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Recommendations</h3>
            {!recommendations || (Object.keys(recommendations).length === 0 && !Array.isArray(recommendations)) ? (
              <p className="text-gray-600 text-sm">
                Upload a CV to get personalized recommendations
              </p>
            ) : Array.isArray(recommendations) ? (
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <div key={idx} className="p-3 bg-accent border border-secondary rounded-lg">
                    <p className="font-semibold text-secondary text-sm">{rec.name || rec}</p>
                    <p className="text-gray-600 text-xs mt-1">{rec.description || ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {recommendations.critical?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-red-500 mb-2">Critical Demand</h4>
                    <div className="space-y-2">
                      {recommendations.critical.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-2 bg-red-50 border border-red-100 rounded">
                          <p className="font-bold text-red-700 text-xs">{rec.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {recommendations.important?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-amber-500 mb-2">Important</h4>
                    <div className="space-y-2">
                      {recommendations.important.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-2 bg-amber-50 border border-amber-100 rounded">
                          <p className="font-bold text-amber-700 text-xs">{rec.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
