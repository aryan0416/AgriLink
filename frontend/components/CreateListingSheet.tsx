import { useState } from 'react';
import { Leaf } from 'lucide-react';

export function CreateListingSheet({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (data: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ crop: '', variety: '', grade: 'A', qty: '', price: '', harvest: new Date().toISOString().split('T')[0], shelf: '7', district: '', state: '' });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white/95 backdrop-blur-xl shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" /> List New Produce
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">✕</button>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Crop Name *', key: 'crop', type: 'text', placeholder: 'e.g. Tomato' },
              { label: 'Variety', key: 'variety', type: 'text', placeholder: 'e.g. Roma, Hybrid' },
              { label: 'Quantity (kg) *', key: 'qty', type: 'number', placeholder: '1000' },
              { label: 'Price per kg (₹) *', key: 'price', type: 'number', placeholder: '28' },
              { label: 'Harvest Date *', key: 'harvest', type: 'date', placeholder: '' },
              { label: 'Shelf Life (days)', key: 'shelf', type: 'number', placeholder: '7' },
              { label: 'District *', key: 'district', type: 'text', placeholder: 'Nashik' },
              { label: 'State *', key: 'state', type: 'text', placeholder: 'Maharashtra' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{field.label}</label>
                <input type={field.type} className="input-field" placeholder={field.placeholder} value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Grade *</label>
              <div className="flex gap-2">
                {['A', 'B', 'C'].map((g) => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, grade: g })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.grade === g ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={loading || !form.crop || !form.qty || !form.price} className="btn-primary flex-1 py-3 font-bold disabled:opacity-50">
              {loading ? 'Listing...' : 'List Produce'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
