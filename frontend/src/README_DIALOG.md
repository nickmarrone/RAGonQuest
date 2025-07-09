# Dialog System

This application uses a centralized dialog system that ensures only one dialog can be displayed at a time. All dialogs are managed through a global state and rendered in a single location in `App.tsx`.

## How to Use Existing Dialogs

### Opening a Dialog

To open a dialog from any component, use the `openDialogAtom`:

```typescript
import { useAtom } from 'jotai';
import { openDialogAtom } from '../atoms/dialogAtom';

const MyComponent = () => {
  const [, openDialog] = useAtom(openDialogAtom);

  const handleOpenDialog = () => {
    openDialog({
      type: 'your-dialog-type',
      props: {
        // Your dialog-specific props here
        data: someData,
        onSuccess: (result) => {
          // Handle success
        }
      }
    });
  };

  return (
    <button onClick={handleOpenDialog}>
      Open Dialog
    </button>
  );
};
```

### Closing a Dialog

Dialogs are automatically closed when the user clicks the close button or presses Escape. If you need to programmatically close a dialog, use the `closeDialogAtom`:

```typescript
import { useAtom } from 'jotai';
import { closeDialogAtom } from '../atoms/dialogAtom';

const MyComponent = () => {
  const [, closeDialog] = useAtom(closeDialogAtom);

  const handleClose = () => {
    closeDialog();
  };
};
```

## How to Add a New Dialog

### Step 1: Define the Dialog Type

Add your new dialog type to the `DialogType` union in `atoms/dialogAtom.ts`:

```typescript
export type DialogType = 'none' | 'create-corpus' | 'delete-corpus' | 'estimate-cost' | 'context-chunks' | 'your-new-dialog';
```

### Step 2: Define the Dialog Props Interface

Add a TypeScript interface for your dialog's props in `atoms/dialogAtom.ts`:

```typescript
export interface YourNewDialogProps {
  data: string;
  onSuccess: (result: any) => void;
  // Add other props your dialog needs
}
```

### Step 3: Create the Dialog Component

Create a new component file (e.g., `components/YourNewDialog.tsx`):

```typescript
import React from "react";
import Dialog from "./Dialog";

interface YourNewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
  onSuccess: (result: any) => void;
}

const YourNewDialog: React.FC<YourNewDialogProps> = ({
  isOpen,
  onClose,
  data,
  onSuccess,
}) => {
  const handleSubmit = () => {
    // Your dialog logic here
    onSuccess(result);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onCancel={onClose}
      onCommit={handleSubmit}
      title="Your Dialog Title"
      commitButtonLabel="Submit"
      commitButtonVariant="primary"
    >
      {/* Your dialog content here */}
      <div className="space-y-4">
        <p>Your dialog content goes here</p>
        <input 
          type="text" 
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded"
        />
      </div>
    </Dialog>
  );
};

export default YourNewDialog;
```

### Step 4: Add the Dialog to GlobalDialog

Import and add your dialog to the `GlobalDialog` component in `components/GlobalDialog.tsx`:

```typescript
import YourNewDialog from './YourNewDialog';

// In the renderDialog function, add a new case:
case 'your-new-dialog':
  return (
    <YourNewDialog
      isOpen={true}
      onClose={handleClose}
      data={dialogState.props?.data}
      onSuccess={dialogState.props?.onSuccess}
    />
  );
```

### Step 5: Use Your New Dialog

Now you can use your dialog from any component:

```typescript
const MyComponent = () => {
  const [, openDialog] = useAtom(openDialogAtom);

  const handleOpenMyDialog = () => {
    openDialog({
      type: 'your-new-dialog',
      props: {
        data: 'initial data',
        onSuccess: (result) => {
          console.log('Dialog completed:', result);
        }
      }
    });
  };

  return (
    <button onClick={handleOpenMyDialog}>
      Open My Dialog
    </button>
  );
};
```

## Dialog Component Guidelines

### Using the Base Dialog Component

All custom dialogs should use the base `Dialog` component which provides:
- Consistent styling and layout
- Escape key handling
- Backdrop and positioning
- Standard button layouts

### Dialog Props

The base `Dialog` component accepts these props:
- `isOpen`: Boolean to control visibility
- `onCancel`: Function called when dialog is cancelled/closed
- `onCommit`: Optional function for the primary action
- `title`: Optional dialog title
- `children`: Dialog content
- `buttons`: Optional custom button array
- `maxWidth`: Optional max width (default: "max-w-2xl")
- `maxHeight`: Optional max height (default: "max-h-[90vh]")
- `showCancelButton`: Whether to show cancel button (default: true)
- `cancelButtonLabel`: Cancel button text (default: "Cancel")
- `commitButtonLabel`: Primary button text
- `commitButtonVariant`: Button style ("primary" | "danger")
- `commitButtonDisabled`: Whether primary button is disabled
- `commitButtonLoading`: Whether to show loading state

### Best Practices

1. **Always provide an `onClose` handler** that calls the global `closeDialog` function
2. **Use TypeScript interfaces** for dialog props to ensure type safety
3. **Handle loading states** when dialogs perform async operations
4. **Provide meaningful error handling** and user feedback
5. **Keep dialog content focused** and avoid overly complex dialogs
6. **Use consistent styling** that matches the existing design system

## Architecture Overview

```
App.tsx
├── GlobalDialog (renders active dialog)
│   ├── CreateCorpusDialog
│   ├── DeleteCorpusDialog
│   ├── EstimateCostDialog
│   ├── ContextChunksDialog
│   └── YourNewDialog
└── Other Components
    └── use openDialogAtom to show dialogs
```

The dialog system ensures that only one dialog can be active at a time, providing a clean and consistent user experience across the application. 