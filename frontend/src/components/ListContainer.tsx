import { type ReactNode } from "react";

interface ListContainerProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  onNewClick: () => void;
  newButtonText?: string;
  newButtonDisabled?: boolean;
  className?: string;
  titleClassName?: string;
  emptyMessage?: string;
}

const ListContainer = <T,>({
  title,
  items,
  renderItem,
  getItemKey,
  onNewClick,
  newButtonText = "New",
  newButtonDisabled = false,
  className = "",
  titleClassName = "text-lg font-bold mb-4",
  emptyMessage = "No items yet."
}: ListContainerProps<T>) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={titleClassName}>{title}</h2>
        <button
          onClick={onNewClick}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
          disabled={newButtonDisabled}
        >
          {newButtonText}
        </button>
      </div>
      <ul>
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={getItemKey ? getItemKey(item, index) : index}>
              {renderItem(item, index)}
            </li>
          ))
        ) : (
          <li className="text-xs text-zinc-500">{emptyMessage}</li>
        )}
      </ul>
    </div>
  );
};

export default ListContainer;