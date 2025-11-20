import React, { useState, useEffect } from 'react';
import { Trash2, BarChart2, Copy, ExternalLink, ArrowRight, Link as LinkIcon, Activity, AlertCircle } from 'lucide-react';

// Configuration
const API_BASE_URL = 'https://urlshortner-e1n4.onrender.com/'; 

function App() {
  // State
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'stats'
  const [links, setLinks] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [targetUrl, setTargetUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // --- API Interactions ---

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/links`);
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (code) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/links/${code}`);
      if (!res.ok) throw new Error('Link not found');
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code, e) => {
    e.stopPropagation();
    if(!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/links/${code}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLinks(); // Refresh list
        if (view === 'stats' && selectedCode === code) setView('dashboard');
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');

    // Frontend Validation
    if (customCode && !/^[A-Za-z0-9]{6,8}$/.test(customCode)) {
      setCreateError('Code must be 6-8 alphanumeric characters');
      setCreateLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetUrl, code: customCode || undefined })
      });

      const data = await res.json();

      if (res.status === 201) {
        setCreateSuccess(`Link created: ${data.code}`);
        setTargetUrl('');
        setCustomCode('');
        fetchLinks(); // Refresh list
      } else if (res.status === 409) {
        setCreateError('Custom code already exists');
      } else {
        setCreateError(data.error || 'Error creating link');
      }
    } catch (err) {
      setCreateError('Network error');
    } finally {
      setCreateLoading(false);
    }
  };

  // --- Helpers ---
  const navigateToStats = (code) => {
    setSelectedCode(code);
    setView('stats');
    fetchStats(code);
  };

  const copyToClipboard = (code) => {
    const url = `${API_BASE_URL}/${code}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // --- Views ---

  const renderHeader = () => (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <LinkIcon size={24} />
          <h1 className="text-xl font-bold">BitLinker</h1>
        </div>
        <nav>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-3 py-1 rounded ${view === 'dashboard' ? 'bg-indigo-800' : 'hover:bg-indigo-500'}`}
          >
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );

  const renderCreateForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Create New Short Link</h2>
      <form onSubmit={handleCreate} className="space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-grow">
          <input 
            type="url" 
            required
            placeholder="Paste long URL (https://...)" 
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
        </div>
        <div className="md:w-48">
          <input 
            type="text" 
            placeholder="Code (opt)" 
            title="6-8 alphanumeric characters"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          disabled={createLoading}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded transition flex items-center justify-center disabled:opacity-50"
        >
          {createLoading ? '...' : 'Shorten'}
        </button>
      </form>
      
      {createError && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {createError}
        </div>
      )}
      
      {createSuccess && (
        <div className="mt-3 p-3 bg-green-50 text-green-700 rounded flex items-center gap-2 text-sm">
          <Activity size={16} /> {createSuccess}
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <>
      {renderCreateForm()}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Active Links</h2>
        <span className="text-sm text-gray-500">{links.length} links found</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading links...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target URL</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigateToStats(link.code)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-indigo-600">/{link.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={link.target}>{link.target}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {link.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(link.code); }}
                        className="text-gray-400 hover:text-green-600 p-1"
                        title="Copy Link"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigateToStats(link.code); }}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="View Stats"
                      >
                        <BarChart2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(link.code, e)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                      No links created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderStats = () => {
    if (loading) return <div className="text-center py-20">Loading stats...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (!statsData) return null;

    return (
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => setView('dashboard')}
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
        >
          <ArrowRight className="rotate-180 mr-1" size={16} /> Back to Dashboard
        </button>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-2">/{statsData.code}</h1>
            <p className="opacity-80">Link Statistics</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="bg-gray-50 p-4 rounded border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Destination URL</p>
              <a 
                href={statsData.target} 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-600 break-all hover:underline font-medium flex items-start gap-2"
              >
                {statsData.target} <ExternalLink size={14} className="mt-1 flex-shrink-0" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded border border-blue-100 text-center">
                <p className="text-xs text-blue-500 uppercase font-bold">Total Clicks</p>
                <p className="text-5xl font-bold text-blue-700 mt-2">{statsData.clicks}</p>
              </div>
              <div className="bg-green-50 p-6 rounded border border-green-100 text-center">
                <p className="text-xs text-green-500 uppercase font-bold">Last Activity</p>
                <p className="text-lg font-bold text-green-700 mt-4">
                  {statsData.lastClicked 
                    ? new Date(statsData.lastClicked).toLocaleDateString() 
                    : 'Never'}
                </p>
                {statsData.lastClicked && (
                  <p className="text-xs text-green-600">
                    {new Date(statsData.lastClicked).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between text-xs text-gray-400">
              <span>Created: {new Date(statsData.createdAt).toLocaleDateString()}</span>
              <span>ID: {statsData._id}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {renderHeader()}
      <main className="container mx-auto max-w-5xl p-6">
        {view === 'dashboard' ? renderDashboard() : renderStats()}
      </main>
    </div>
  );
}

export default App;