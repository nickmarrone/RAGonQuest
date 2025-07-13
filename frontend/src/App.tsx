import './App.css'
import { useRef } from 'react';
import Corpora from './components/Corpora';
import ConversationsList from './components/ConversationsList';
import ConversationInput from './components/ConversationInput';
import ConversationView from './components/ConversationView';
import Toast from './components/Toast';
import GlobalDialog from './components/GlobalDialog';

function App() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 min-w-[250px] bg-zinc-800 border-r border-zinc-700 p-4 flex flex-col overflow-y-auto">
        <Corpora />
        <ConversationsList />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto" ref={scrollContainerRef}>
          <ConversationView scrollContainerRef={scrollContainerRef} />
        </div>
        <ConversationInput />
      </div>
      <Toast />
      <GlobalDialog />
    </div>
  );
}

export default App
