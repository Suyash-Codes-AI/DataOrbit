import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, CheckCircle2, ChevronRight, Layers, ExternalLink, X } from 'lucide-react';
import { DocumentItem } from '../types';
import { useTheme } from '../context/ThemeContext';

export const DocumentCenterView: React.FC = () => {
  const { isDark } = useTheme();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Logistics & Operations');
  const [newContent, setNewContent] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
      if (data.documents?.length > 0 && !selectedDoc) {
        setSelectedDoc(data.documents[0]);
        fetchChunks(data.documents[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const fetchChunks = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/chunks`);
      const data = await res.json();
      setDocChunks(data.chunks || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    }
  };

  const handleSelectDoc = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    fetchChunks(doc.id);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setUploading(true);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          text: newContent.trim()
        })
      });

      if (res.ok) {
        setShowUploadModal(false);
        setNewTitle('');
        setNewContent('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 transition-colors ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
        isDark ? 'border-[#20293d]' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Document Intelligence & RAG Center</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                Vector Retrieval Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Corporate policies, SLA agreements, and regional circulars synthesized by DataOrbit
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search indexed policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-hidden focus:border-blue-500 ${
                isDark
                  ? 'bg-[#0e121a] border-[#242e44] text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
              }`}
            />
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedDoc?.id === doc.id
                    ? 'bg-purple-950/20 border-purple-500/40 text-purple-400 font-semibold'
                    : isDark
                    ? 'bg-[#121620] border-[#20293d] text-slate-400 hover:text-slate-200 hover:bg-[#151c2a]'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-semibold text-xs text-slate-200 leading-snug">{doc.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center shrink-0 ml-2">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Indexed
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>{doc.category}</span>
                  <span>{doc.chunksCount} chunks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Document Details & Chunks */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="bg-[#121620] border border-[#20293d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e273a]">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedDoc.title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span>Category: <strong className="text-slate-200">{selectedDoc.category}</strong></span>
                    <span>• File: <strong className="text-slate-200 font-mono">{selectedDoc.filename}</strong></span>
                    <span>• {selectedDoc.chunksCount} Indexed Chunks</span>
                  </div>
                </div>
              </div>

              {/* Chunks Inspector */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Document Chunks & Embeddings ({docChunks.length})</span>
                </h4>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {docChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id || idx}
                      className="p-3.5 rounded-lg bg-[#0b0e14] border border-[#1b2234] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-300 font-mono text-[11px]">
                          {chunk.metadata?.section || `Chunk ${idx + 1}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {chunk.id}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans text-xs">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-[#121620] border border-[#20293d] rounded-xl text-xs">
              Select a document to inspect its chunks and semantic indexes.
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121622] border border-[#263147] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#232d42] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-slate-200 text-sm">Upload Business Knowledge Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Regional Promotional Policy Memo"
                  className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="Logistics & Operations">Logistics & Operations</option>
                  <option value="Sales Strategy">Sales Strategy</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Compliance & Legal">Compliance & Legal</option>
                  <option value="Financial Planning">Financial Planning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document Content (Markdown / Text)
                </label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Section 1: Policy Guidelines..."
                  className="w-full px-3 py-2 bg-[#0c0f17] border border-[#263147] rounded-lg text-xs text-slate-200 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Indexing...' : 'Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
