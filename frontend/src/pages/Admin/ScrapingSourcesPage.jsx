import { useEffect, useState } from 'react';
import {
  getSources,
  createSource,
  updateSource,
  deleteSource,
  toggleSource,
} from '../../api/scrapingSourcesApi';
import ErrorAlert from '../../components/ErrorAlert';
import SuccessAlert from '../../components/SuccessAlert';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = {
  name: '',
  endpoint: '',
  type: 'api',
  status: 'active',
  headers: '',
  params: '',
};

function parseJson(str) {
  if (!str || str.trim() === '') return null;
  try {
    return JSON.parse(str);
  } catch {
    return null; // validation handled in form
  }
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function TypeBadge({ type }) {
  const isApi = type === 'api';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
        isApi ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
      }`}
    >
      {type}
    </span>
  );
}

export default function ScrapingSourcesPage() {
  const [sources, setSources]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [editingId, setEditingId]     = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [formError, setFormError]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [pagination, setPagination]   = useState({ current_page: 1, last_page: 1 });

  /* ── Load data ── */
  const loadSources = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await getSources(page);
      const payload = res.data;
      setSources(payload.data || []);
      setPagination({
        current_page: payload.current_page || 1,
        last_page:    payload.last_page    || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scraping sources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSources(); }, []);

  /* ── Form helpers ── */
  const openAddForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (src) => {
    setFormData({
      name:     src.name,
      endpoint: src.endpoint,
      type:     src.type,
      status:   src.status,
      headers:  src.headers && Object.keys(src.headers).length ? JSON.stringify(src.headers, null, 2) : '',
      params:   src.params  && Object.keys(src.params).length  ? JSON.stringify(src.params,  null, 2) : '',
    });
    setEditingId(src.id);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── Validate JSON fields ── */
  const validateForm = () => {
    if (!formData.name.trim())     return 'Name is required.';
    if (!formData.endpoint.trim()) return 'Endpoint URL is required.';
    try { new URL(formData.endpoint); } catch { return 'Endpoint must be a valid URL.'; }
    if (formData.headers && parseJson(formData.headers) === null && formData.headers.trim())
      return 'Headers must be valid JSON (e.g. {"Authorization": "Bearer token"}).';
    if (formData.params && parseJson(formData.params) === null && formData.params.trim())
      return 'Params must be valid JSON (e.g. {"app_id": "..."}).';
    return null;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }

    const payload = {
      name:     formData.name.trim(),
      endpoint: formData.endpoint.trim(),
      type:     formData.type,
      status:   formData.status,
      headers:  parseJson(formData.headers) || null,
      params:   parseJson(formData.params)  || null,
    };

    try {
      setSubmitting(true);
      setFormError('');

      if (editingId) {
        await updateSource(editingId, payload);
        setSuccess('Source updated successfully.');
      } else {
        await createSource(payload);
        setSuccess('Source created successfully.');
      }

      closeForm();
      await loadSources(pagination.current_page);
    } catch (submitErr) {
      const msg =
        submitErr.response?.data?.errors
          ? Object.values(submitErr.response.data.errors).flat().join(' ')
          : submitErr.response?.data?.message || 'Failed to save source.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete source "${name}"? This cannot be undone.`)) return;
    try {
      await deleteSource(id);
      setSuccess(`Source "${name}" deleted.`);
      await loadSources(pagination.current_page);
    } catch {
      setError('Failed to delete source. Please try again.');
    }
  };

  /* ── Toggle ── */
  const handleToggle = async (id) => {
    try {
      const res = await toggleSource(id);
      setSuccess(res.data.message || 'Status updated.');
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...res.data.data } : s))
      );
    } catch {
      setError('Failed to toggle source status.');
    }
  };

  /* ── Render ── */
  if (loading && sources.length === 0) {
    return <LoadingSpinner fullScreen message="Loading scraping sources..." />;
  }

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Scraping Sources</h1>
            <p className="text-gray-500 text-sm">
              Manage the data sources used by the hybrid scraper (APIs and HTML boards).
            </p>
          </div>
          <button
            id="btn-add-source"
            onClick={openAddForm}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary transition shadow"
          >
            <span className="text-lg leading-none">+</span> Add Source
          </button>
        </div>

        {/* ── Alerts ── */}
        {error   && <ErrorAlert   title="Error"   message={error}   onClose={() => setError('')}   />}
        {success && <SuccessAlert title="Success" message={success} onClose={() => setSuccess('')} />}

        {/* ── Add / Edit Form (slide-in card) ── */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Source' : 'Add New Source'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Row 1: Name + Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-name">
                    Source Name *
                  </label>
                  <input
                    id="src-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Remotive API"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-type">
                    Source Type *
                  </label>
                  <select
                    id="src-type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="api">API (JSON endpoint)</option>
                    <option value="html">HTML (Website scraping)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Endpoint + Status */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-endpoint">
                    Endpoint URL *
                  </label>
                  <input
                    id="src-endpoint"
                    name="endpoint"
                    type="url"
                    value={formData.endpoint}
                    onChange={handleChange}
                    placeholder="https://remotive.com/api/remote-jobs"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-status">
                    Status
                  </label>
                  <select
                    id="src-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Headers + Params (optional JSON) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-headers">
                    Headers <span className="font-normal text-gray-400">(JSON, optional)</span>
                  </label>
                  <textarea
                    id="src-headers"
                    name="headers"
                    value={formData.headers}
                    onChange={handleChange}
                    rows={4}
                    placeholder={'{\n  "Authorization": "Bearer token"\n}'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="src-params">
                    Query Params <span className="font-normal text-gray-400">(JSON, optional)</span>
                  </label>
                  <textarea
                    id="src-params"
                    name="params"
                    value={formData.params}
                    onChange={handleChange}
                    rows={4}
                    placeholder={'{\n  "app_id": "your_id",\n  "app_key": "your_key"\n}'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  id="btn-submit-source"
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-secondary transition disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : editingId ? 'Update Source' : 'Create Source'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Sources Table ── */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading && sources.length > 0 && (
            <div className="px-6 py-2 bg-blue-50 text-blue-700 text-sm">Refreshing…</div>
          )}

          {sources.length === 0 && !loading ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-5xl mb-4">🔌</p>
              <p className="text-lg font-medium">No scraping sources configured yet.</p>
              <p className="text-sm mt-1">Click <strong>Add Source</strong> to register your first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Endpoint</th>
                    <th className="text-left px-4 py-4 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-4 py-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{src.name}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        <a
                          href={src.endpoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition underline underline-offset-2"
                          title={src.endpoint}
                        >
                          {src.endpoint}
                        </a>
                      </td>
                      <td className="px-4 py-4">
                        <TypeBadge type={src.type} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge active={src.is_active} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle */}
                          <button
                            id={`btn-toggle-${src.id}`}
                            onClick={() => handleToggle(src.id)}
                            title={src.is_active ? 'Deactivate' : 'Activate'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              src.is_active
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {src.is_active ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Edit */}
                          <button
                            id={`btn-edit-${src.id}`}
                            onClick={() => openEditForm(src)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition"
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            id={`btn-delete-${src.id}`}
                            onClick={() => handleDelete(src.id, src.name)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination.last_page > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadSources(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    page === pagination.current_page
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info footer ── */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Active sources are sent to the AI Engine on every scheduled scraping job.
          Inactive sources are ignored until re-activated.
        </p>
      </div>
    </div>
  );
}
