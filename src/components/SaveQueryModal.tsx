import React, { useState } from 'react';
import { Bookmark, X, Check } from 'lucide-react';

interface SaveQueryModalProps {
  question: string;
  sql?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const SaveQueryModal: React.FC<SaveQueryModalProps> = ({
  question,
  sql = '',
  onClose,
  onSaved
}) => {
  const [name, setName] = useState(question.substring(0, 40));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Revenue Analytics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          question,
          sql,
          category
        })
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to save query:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#121622] border border-[#263147] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#232d42] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Save Analysis to Workspace</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Report Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
              placeholder="e.g. Q3 Regional Performance Audit"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="Revenue Analytics">Revenue Analytics</option>
              <option value="Regional Performance">Regional Performance</option>
              <option value="Product Trends">Product Trends</option>
              <option value="Operational Diagnostics">Operational Diagnostics</option>
              <option value="Executive Briefing">Executive Briefing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
              placeholder="Context or notes for team members..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || savedSuccess}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
