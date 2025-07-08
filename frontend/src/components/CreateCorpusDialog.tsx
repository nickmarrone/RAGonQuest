import React, { useState, useEffect } from "react";

interface CreateCorpusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (corpusData: CorpusFormData) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  initialData?: CorpusFormData;
}

export interface CorpusFormData {
  name: string;
  description: string;
  default_prompt: string;
  qdrant_collection_name: string;
  path: string;
  embedding_model: string;
  completion_model: string;
}

const initialFormData: CorpusFormData = {
  name: "",
  description: "",
  default_prompt: "You are a helpful assistant. Answer the user's question based on the provided context.",
  qdrant_collection_name: "",
  path: "",
  embedding_model: "text-embedding-3-small",
  completion_model: "gpt-4o-mini",
};

const CreateCorpusDialog: React.FC<CreateCorpusDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  mode,
  initialData,
}) => {
  const [formData, setFormData] = useState<CorpusFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<CorpusFormData>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData(initialData);
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<CorpusFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.qdrant_collection_name.trim()) {
      newErrors.qdrant_collection_name = "Qdrant collection name is required";
    }

    if (!formData.path.trim()) {
      newErrors.path = "Path is required";
    }

    if (!formData.default_prompt.trim()) {
      newErrors.default_prompt = "Default prompt is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof CorpusFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{mode === 'create' ? 'Create New Corpus' : 'Edit Corpus'}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-2 bg-zinc-800 border rounded ${
                errors.name ? "border-red-500" : "border-zinc-600"
              } focus:border-blue-500 focus:outline-none`}
              placeholder="Enter corpus name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Enter corpus description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Default Prompt *
            </label>
            <textarea
              value={formData.default_prompt}
              onChange={(e) => handleInputChange("default_prompt", e.target.value)}
              className={`w-full p-2 bg-zinc-800 border rounded ${
                errors.default_prompt ? "border-red-500" : "border-zinc-600"
              } focus:border-blue-500 focus:outline-none`}
              rows={4}
              placeholder="Enter the default prompt for this corpus"
            />
            {errors.default_prompt && (
              <p className="text-red-500 text-sm mt-1">{errors.default_prompt}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Qdrant Collection Name *
            </label>
            <input
              type="text"
              value={formData.qdrant_collection_name}
              onChange={(e) => handleInputChange("qdrant_collection_name", e.target.value)}
              className={`w-full p-2 bg-zinc-800 border rounded ${
                errors.qdrant_collection_name ? "border-red-500" : "border-zinc-600"
              } focus:border-blue-500 focus:outline-none`}
              placeholder="Enter Qdrant collection name"
            />
            {errors.qdrant_collection_name && (
              <p className="text-red-500 text-sm mt-1">{errors.qdrant_collection_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Path *
            </label>
            <input
              type="text"
              value={formData.path}
              onChange={(e) => handleInputChange("path", e.target.value)}
              className={`w-full p-2 bg-zinc-800 border rounded ${
                errors.path ? "border-red-500" : "border-zinc-600"
              } focus:border-blue-500 focus:outline-none`}
              placeholder="Enter path to corpus directory"
            />
            {errors.path && (
              <p className="text-red-500 text-sm mt-1">{errors.path}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Embedding Model
              </label>
              <select
                value={formData.embedding_model}
                onChange={(e) => handleInputChange("embedding_model", e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="text-embedding-3-small">text-embedding-3-small</option>
                <option value="text-embedding-3-large">text-embedding-3-large</option>
                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Completion Model
              </label>
              <select
                value={formData.completion_model}
                onChange={(e) => handleInputChange("completion_model", e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {isLoading ? (mode === 'create' ? "Creating..." : "Updating...") : (mode === 'create' ? "Create Corpus" : "Update Corpus")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCorpusDialog; 