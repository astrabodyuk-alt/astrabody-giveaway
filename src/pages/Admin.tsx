import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Participant } from '../supabase';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [approvalData, setApprovalData] = useState({ tier: 'bronze', entries: 1, google_review: false, notes: '' });

  // Manual Add state
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualData, setManualData] = useState({ firstName: '', lastName: '', email: '', phone: '', tier: 'bronze', entries: 1, notes: '' });

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    
    if (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchParticipants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setParticipants(data as Participant[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchParticipants();
    }
  }, [isAuthenticated]);

  const handleApproveClick = (p: Participant) => {
    setSelectedParticipant(p);
    setApprovalData({
      tier: p.tier || 'bronze',
      google_review: p.google_review || false,
      entries: p.entries || 1,
      notes: p.notes || ''
    });
  };

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value;
    let base = 1;
    if (t === 'silver') base = 3;
    if (t === 'vip') base = 8;
    
    setApprovalData(prev => ({
      ...prev,
      tier: t,
      entries: base + (prev.google_review ? 1 : 0)
    }));
  };

  const handleGoogleReviewToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    let base = 1;
    if (approvalData.tier === 'silver') base = 3;
    if (approvalData.tier === 'vip') base = 8;
    
    setApprovalData(prev => ({
      ...prev,
      google_review: isChecked,
      entries: base + (isChecked ? 1 : 0)
    }));
  };

  const submitApproval = async () => {
    if (!selectedParticipant) return;
    
    const { error } = await supabase
      .from('participants')
      .update({
        status: 'approved',
        tier: approvalData.tier,
        google_review: approvalData.google_review,
        entries: approvalData.entries,
        notes: approvalData.notes
      })
      .eq('id', selectedParticipant.id);

    if (error) {
      alert('Error updating participant');
    } else {
      setSelectedParticipant(null);
      fetchParticipants();
    }
  };

  const submitReject = async (id: string) => {
    if(!confirm("Are you sure you want to completely delete this entry? This cannot be undone.")) return;
    
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error rejecting participant');
    } else {
      fetchParticipants();
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedTicket = `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('participants').insert([
      {
        first_name: manualData.firstName,
        last_name: manualData.lastName,
        email: manualData.email,
        phone: manualData.phone,
        ticket_number: generatedTicket,
        tier: manualData.tier,
        entries: manualData.entries,
        status: 'approved',
        google_review: false,
        notes: manualData.notes
      }
    ]);

    if (error) {
      alert('Error adding participant manually (ensure phone is unique).');
    } else {
      setIsAddingManual(false);
      setManualData({ firstName: '', lastName: '', email: '', phone: '', tier: 'bronze', entries: 1, notes: '' });
      fetchParticipants();
    }
  };

  const Stats = () => {
    const approved = participants.filter(p => p.status === 'approved');
    const totalEntries = approved.reduce((acc, curr) => acc + (curr.entries || 0), 0);
    return (
      <div className="admin-stats">
        <div className="stat-card">
          <h4>Total Approved</h4>
          <div className="stat-number">{approved.length}</div>
        </div>
        <div className="stat-card">
          <h4>Total Entries in Draw</h4>
          <div className="stat-number highlight-gold">{totalEntries}</div>
        </div>
        <div className="stat-action">
          <button className="btn-primary" onClick={() => navigate('/draw')}>LAUNCH DRAW DISPLAY</button>
        </div>
      </div>
    );
  };

  if (authChecking) {
    return <div className="admin-login-container">Loading secure environment...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <form className="admin-login-form" onSubmit={handleLogin}>
          <h2>Admin Access</h2>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              required
              type="email" 
              className="form-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              required
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%'}} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    );
  }

  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const approvedParticipants = participants.filter(p => p.status === 'approved');

  return (
    <div className="admin-container container">
      <div className="admin-header">
        <h2>Dashboard</h2>
        <button className="btn-outline logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <Stats />

      <div className="admin-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingParticipants.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedParticipants.length})
          </button>
        </div>
        {activeTab === 'approved' && (
          <button className="btn-outline btn-sm" onClick={() => setIsAddingManual(true)}>
            + Add Participant
          </button>
        )}
      </div>

      <div className="table-responsive">
        {loading ? <p>Loading participants...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Google Review</th>
                <th>Tier</th>
                <th>Entries</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'pending' ? pendingParticipants : approvedParticipants).map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-terracotta)' }}>
                      {p.ticket_number || 'AST-XXXX'}
                    </span>
                  </td>
                  <td><strong>{p.first_name} {p.last_name}</strong></td>
                  <td>
                    <div className="contact-info">{p.email}</div>
                    <div className="contact-info">{p.phone}</div>
                  </td>
                  <td>{p.google_review ? <span className="badge badge-gold">Yes</span> : <span className="badge">No</span>}</td>
                  <td><span className={`badge tier-${p.tier}`}>{p.tier?.toUpperCase()}</span></td>
                  <td><strong>{p.entries}</strong></td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    {activeTab === 'pending' ? (
                      <div className="action-buttons">
                        <button className="btn-sm btn-approve" onClick={() => handleApproveClick(p)}>Approve</button>
                        <button className="btn-sm btn-reject" onClick={() => submitReject(p.id)}>Reject</button>
                      </div>
                    ) : (
                      <span className="text-muted">Approved</span>
                    )}
                  </td>
                </tr>
              ))}
              {(activeTab === 'pending' ? pendingParticipants : approvedParticipants).length === 0 && (
                <tr>
                  <td colSpan={7} style={{textAlign: 'center', padding: '40px'}}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedParticipant && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Approve Participant</h3>
            <p><strong>{selectedParticipant.first_name} {selectedParticipant.last_name}</strong></p>
            <p className="text-muted mb-4">{selectedParticipant.email}</p>
            
            <div className="form-group">
              <label className="form-label">Selected Tier</label>
              <select className="form-input" value={approvalData.tier} onChange={handleTierChange}>
                <option value="bronze">Bronze (£150-£299) - 1 Entry</option>
                <option value="silver">Silver (£300-£499) - 3 Entries</option>
                <option value="vip">VIP (£500+) - 8 Entries</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={approvalData.google_review} 
                  onChange={handleGoogleReviewToggle} 
                />
                <span>Verify Google Review (+1 Bonus Entry)</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Total Entries Calculated</label>
              <div className="entries-calc">
                <input type="number" className="form-input" value={approvalData.entries} onChange={(e) => setApprovalData({...approvalData, entries: parseInt(e.target.value)})} />
                {approvalData.google_review && <span className="bonus-tag">Including Google Review</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Notes (Optional)</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={approvalData.notes}
                onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setSelectedParticipant(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitApproval}>Finalize Approval</button>
            </div>
          </div>
        </div>
      )}

      {isAddingManual && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Participant Manually</h3>
            <p className="text-muted mb-4">Participant will be added directly to the Approved list.</p>
            
            <form onSubmit={handleManualAddSubmit}>
              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">First Name</label>
                  <input required type="text" className="form-input" value={manualData.firstName} onChange={e => setManualData({...manualData, firstName: e.target.value})} />
                </div>
                <div className="form-group half">
                  <label className="form-label">Last Name</label>
                  <input required type="text" className="form-input" value={manualData.lastName} onChange={e => setManualData({...manualData, lastName: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Email</label>
                  <input required type="email" className="form-input" value={manualData.email} onChange={e => setManualData({...manualData, email: e.target.value})} />
                </div>
                <div className="form-group half">
                  <label className="form-label">Phone</label>
                  <input required type="text" className="form-input" value={manualData.phone} onChange={e => setManualData({...manualData, phone: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">Tier</label>
                  <select className="form-input" value={manualData.tier} onChange={e => {
                    const t = e.target.value;
                    let base = 1;
                    if (t === 'silver') base = 3;
                    if (t === 'vip') base = 8;
                    setManualData({...manualData, tier: t, entries: base});
                  }}>
                    <option value="bronze">Bronze (1 Entry)</option>
                    <option value="silver">Silver (3 Entries)</option>
                    <option value="vip">VIP (8 Entries)</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label className="form-label">Entries</label>
                  <input type="number" className="form-input" value={manualData.entries} onChange={e => setManualData({...manualData, entries: parseInt(e.target.value)})} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-input" rows={2} value={manualData.notes} onChange={e => setManualData({...manualData, notes: e.target.value})} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddingManual(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Participant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
