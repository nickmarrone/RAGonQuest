import React, { useState, useEffect } from "react";
import Dialog from "./Dialog";
import type { Corpus } from "../types";

interface CreateCorpusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (corpus: Corpus) => void;
  initialData?: Corpus;
}

// Form data type that excludes read-only fields from Corpus
type CorpusFormData = Omit<Corpus, 'id' | 'created_at' | 'updated_at' | 'files'>;

const initialFormData: CorpusFormData = {
  name: "",
  description: "",
  default_prompt: "You are a helpful assistant. Answer the user's question based on the provided context.",
  qdrant_collection_name: "",
  path: "",
  embedding_model: "text-embedding-3-small",
  completion_model: "gpt-4o-mini",
  similarity_threshold: 0.7,
};

// Helper to omit fields from an object
type OmitFields<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
function omitFields<T, K extends keyof T>(obj: T, keys: K[]): OmitFields<T, K> {
  const clone = { ...obj };
  keys.forEach((key) => { delete clone[key]; });
  return clone;
}

const CreateCorpusDialog: React.FC<CreateCorpusDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<CorpusFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<CorpusFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Determine if we're in edit mode based on presence of id
  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // Omit read-only fields
        setFormData(omitFields(initialData, ['id', 'created_at', 'updated_at', 'files']));
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setApiError(null);
    }
  }, [isOpen, isEditMode, initialData]);

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

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const url = isEditMode ? `/corpora/${initialData?.id}` : '/corpora';
      const method = isEditMode ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} corpus`);
      }
      const updatedCorpus = await response.json();
      onSuccess(updatedCorpus);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleInputChange = (field: keyof CorpusFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onCancel={onClose}
      onCommit={handleSave}
      title={isEditMode ? 'Edit Corpus' : 'Create New Corpus'}
      commitButtonLabel={isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Corpus" : "Create Corpus")}
      commitButtonVariant="primary"
      commitButtonDisabled={isLoading}
      commitButtonLoading={isLoading}
    >
      {apiError && (
        <div className="mb-2 p-2 bg-red-900 border border-red-700 rounded text-red-200">
          {apiError}
        </div>
      )}
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

          <div>
            <label className="block text-sm font-medium mb-1">
              Similarity Threshold
            </label>
            <input
              type="number"
              step="0.1"
              min="0.0"
              max="1.0"
              value={formData.similarity_threshold}
              onChange={(e) => handleInputChange("similarity_threshold", parseFloat(e.target.value) || 0.7)}
              className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              placeholder="0.7"
            />
            <p className="text-zinc-400 text-sm mt-1">
              Minimum similarity score (0.0 to 1.0) for vector search results. Higher values mean more relevant results but fewer matches.
            </p>
          </div>
        </form>
      </Dialog>
    );
  };

export default CreateCorpusDialog; 