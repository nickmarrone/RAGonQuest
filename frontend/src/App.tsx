import './App.css'
import { useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Corpora } from './components/Corpora';
import ConversationsList from './components/ConversationsList';
import ConversationInput from './components/ConversationInput';
import { conversationPartsAtom } from './atoms/conversationsAtoms';
import ConversationView from './components/ConversationView';
import Toast from './components/Toast';
import GlobalDialog from './components/GlobalDialog';

function App() {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [conversationParts] = useAtom(conversationPartsAtom);

  // Scroll to bottom when conversation parts change (new part added)
  useEffect(() => {
    if (mainContentRef.current && conversationParts.length > 0) {
      // Try multiple times with different delays to ensure content is rendered
      const scrollToBottom = () => {
        if (mainContentRef.current) {
          const container = mainContentRef.current;
          container.scrollTop = container.scrollHeight;
        }
      };

      // Delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [conversationParts.length]);

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 min-w-[250px] bg-zinc-800 border-r border-zinc-700 p-4 flex flex-col overflow-y-auto">
        <Corpora />
        <ConversationsList />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto" ref={mainContentRef}>
          <ConversationView scrollContainerRef={mainContentRef} />
        </div>
        <ConversationInput />
      </div>
      <Toast />
      <GlobalDialog />
    </div>
  );
}

export default App
