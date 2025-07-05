import './App.css'
import Corpora from './components/Corpora';
import ConversationsList from './components/ConversationsList';
import ConversationView from './components/ConversationView';

function App() {

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Sidebar */}
      <div className="w-64 min-w-[200px] bg-zinc-800 border-r border-zinc-700 p-4 flex flex-col">
        <Corpora />
        <ConversationsList />
      </div>
      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <ConversationView />
      </div>
    </div>
  );
}

export default App
