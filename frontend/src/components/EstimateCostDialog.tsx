import React from "react";

interface FileCost {
  corpus_file_id: string;
  filename: string;
  tokens: number;
  cost: number;
  is_ingested: boolean;
}

export interface CostEstimateData {
  corpus_id: string;
  corpus_name: string;
  model: string;
  files: FileCost[];
  total_tokens: number;
  total_cost: number;
  file_count: number;
  ingested_count: number;
  uningested_count: number;
}

interface EstimateCostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  costData?: CostEstimateData;
  loading?: boolean;
  error?: string | null;
}

const EstimateCostDialog: React.FC<EstimateCostDialogProps> = ({
  isOpen,
  onClose,
  costData,
  loading = false,
  error,
}) => {
  if (!isOpen) return null;

  const unIngestedFiles = costData?.files.filter(f => !f.is_ingested) || [];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Estimate Embedding Cost</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-zinc-300">Loading...</div>
        ) : error ? (
          <div className="text-red-400 mb-4">{error}</div>
        ) : !costData ? null : unIngestedFiles.length === 0 ? (
          <div className="text-green-400 text-center py-8">All files in this corpus have already been ingested.</div>
        ) : (
          <>
            <table className="w-full text-sm mb-4 border-separate border-spacing-y-1">
              <thead>
                <tr className="text-zinc-300">
                  <th className="text-left pb-2">Filename</th>
                  <th className="text-right pb-2">Tokens</th>
                  <th className="text-right pb-2">Estimated Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {unIngestedFiles.map(file => (
                  <tr key={file.corpus_file_id} className="bg-zinc-800">
                    <td className="py-1 pr-2 text-zinc-100">{file.filename}</td>
                    <td className="py-1 pr-2 text-right">{file.tokens !== undefined ? file.tokens.toLocaleString() : "—"}</td>
                    <td className="py-1 text-right">{file.cost !== undefined ? `$${file.cost.toFixed(6)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end font-semibold text-zinc-200 border-t border-zinc-700 pt-3">
              Total: ${costData.total_cost.toFixed(6)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EstimateCostDialog; 