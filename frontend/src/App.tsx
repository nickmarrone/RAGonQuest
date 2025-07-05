import './App.css'
import Corpora from './components/Corpora';
import ConversationsList from './components/ConversationsList';

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
        <h1 className="text-2xl font-bold mb-4">Main Content</h1>
        <p>This is where your main content will appear.</p>
      </div>
    </div>
  );
}

export default App
