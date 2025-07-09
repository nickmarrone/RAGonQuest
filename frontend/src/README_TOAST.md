# Toast System

The application now uses a centralized toast notification system managed through Jotai atoms.

## Usage

### Basic Usage

```tsx
import { useToast } from '../hooks/useToast';

const MyComponent = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!');
  };

  const handleInfo = () => {
    showInfo('Here is some information');
  };

  return (
    // Your component JSX
  );
};
```

### Advanced Usage

```tsx
import { useToast } from '../hooks/useToast';

const MyComponent = () => {
  const { showToast } = useToast();

  const handleCustomToast = () => {
    showToast('Custom message', 'success', 5000); // 5 second duration
  };

  return (
    // Your component JSX
  );
};
```

## Toast Types

- `success` (default): Green background
- `error`: Red background  
- `info`: Blue background

## Features

- **Global Management**: Only one toast can be shown at a time
- **Auto-dismiss**: Toasts automatically disappear after 3 seconds (configurable)
- **Manual Dismiss**: Users can click the × button to dismiss early
- **Consistent Styling**: All toasts use the same design system
- **Type Safety**: Full TypeScript support

## Implementation Details

- **Atom**: `toastAtom` in `src/atoms/toastAtom.ts`
- **Component**: `Toast` in `src/components/Toast.tsx`
- **Hook**: `useToast` in `src/hooks/useToast.ts`
- **Global Mount**: Added to `App.tsx`

## Migration from Old System

The old toast system had duplicate code in `ConversationsList` and `Corpora` components. This has been replaced with the centralized system above. 