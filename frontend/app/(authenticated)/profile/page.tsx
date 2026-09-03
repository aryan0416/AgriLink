'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Shield, Loader2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  
  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setEmail(session.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      let currentRole = profile?.role;
      if (!currentRole && session.user.user_metadata?.role) {
        currentRole = session.user.user_metadata.role;
      }
      setRole(currentRole || 'consumer');
      
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
      } else {
        setFullName(session.user.user_metadata?.full_name || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        role: role,
      })
      .eq('id', session.user.id);

    setSaving(false);
    
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert('Error updating profile: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">My Profile</h1>
        <p className="text-sm text-emerald-900/60 mt-1">Manage your account settings and personal information</p>
      </div>

      <div className="glass-panel p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Read-only sections */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm font-medium">
                {email}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Account Role
              </label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-emerald-900/20 text-emerald-950 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none uppercase"
              >
                <option value="consumer">Consumer</option>
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="fpo">FPO</option>
                <option value="transporter">Transporter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <hr className="border-emerald-900/5" />

          {/* Editable sections */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-emerald-900/20 text-emerald-950 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-emerald-900/20 text-emerald-950 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                placeholder="+91 00000 00000"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4 border-t border-emerald-900/5">
            {saveSuccess && (
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Profile saved!
              </span>
            )}
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
