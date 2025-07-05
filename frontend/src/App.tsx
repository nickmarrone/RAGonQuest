import './App.css'
import { useRef } from 'react';
import Corpora from './components/Corpora';
import ConversationsList from './components/ConversationsList';
import ConversationView from './components/ConversationView';

function App() {
  const mainContentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 min-w-[200px] bg-zinc-800 border-r border-zinc-700 p-4 flex flex-col overflow-y-auto">
        <Corpora />
        <ConversationsList />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto" ref={mainContentRef}>
          <ConversationView scrollContainerRef={mainContentRef} />
        </div>
      </div>
    </div>
  );
}

export default App
