import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { dialogAtom, closeDialogAtom } from '../atoms/dialogAtom';
import CreateCorpusDialog from './CreateCorpusDialog';
import DeleteCorpusDialog from './DeleteCorpusDialog';
import EstimateCostDialog from './EstimateCostDialog';
import ContextChunksDialog from './ContextChunksDialog';

const GlobalDialog: React.FC = () => {
  const dialogState = useAtomValue(dialogAtom);
  const closeDialog = useSetAtom(closeDialogAtom);

  const handleClose = () => {
    closeDialog();
  };

  const renderDialog = () => {
    switch (dialogState.type) {
      case 'create-corpus':
        return (
          <CreateCorpusDialog
            isOpen={true}
            onClose={handleClose}
            onSuccess={dialogState.props?.onSuccess}
            initialData={dialogState.props?.editingCorpus}
          />
        );
      
      case 'delete-corpus':
        return (
          <DeleteCorpusDialog
            isOpen={true}
            onClose={handleClose}
            onConfirm={dialogState.props?.onConfirm}
            corpus={dialogState.props?.corpus}
            isLoading={dialogState.props?.isLoading}
          />
        );
      
      case 'estimate-cost':
        return (
          <EstimateCostDialog
            isOpen={true}
            onClose={handleClose}
            costData={dialogState.props?.costData}
            loading={dialogState.props?.loading}
            error={dialogState.props?.error}
          />
        );
      
      case 'context-chunks':
        return (
          <ContextChunksDialog
            isOpen={true}
            onClose={handleClose}
            chunks={dialogState.props?.chunks}
          />
        );
      
      default:
        return null;
    }
  };

  return renderDialog();
};

export default GlobalDialog; 