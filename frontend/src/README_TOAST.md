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

- **Multiple Toasts**: Up to 5 toasts can be shown simultaneously
- **Smooth Animations**: Toasts fade in from the right and fade out when dismissed
- **Auto-dismiss**: Toasts automatically disappear after 3 seconds (configurable)
- **Manual Dismiss**: Users can click the × button to dismiss early
- **Stacked Layout**: New toasts appear at the top, pushing existing ones down with proper spacing
- **Consistent Styling**: All toasts use the same design system
- **Type Safety**: Full TypeScript support

## Implementation Details

- **Atom**: `toastsAtom` in `src/atoms/toastAtom.ts` (manages array of toasts)
- **Component**: `Toast` in `src/components/Toast.tsx` (renders multiple toast items)
- **Hook**: `useToast` in `src/hooks/useToast.ts` (provides toast management functions)
- **Global Mount**: Added to `App.tsx`

## Migration from Old System

The old toast system had duplicate code in `ConversationsList` and `Corpora` components. This has been replaced with the centralized system above.

## Animation Behavior

- **Fade In**: New toasts slide in from the right with opacity transition
- **Fade Out**: Toasts fade out smoothly when dismissed or timed out
- **Stacking**: New toasts appear at the top, each positioned 80px below the previous one
- **Independent Timeouts**: Each toast maintains its own timeout duration regardless of new toasts
- **Maximum**: System limits to 5 simultaneous toasts, removing oldest when limit exceeded 