import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const router = useRouter();

  const handleCreateBoard = async () => {
    // Basic session handling for simple owner identification
    let ownerId = localStorage.getItem('userId');
    if (!ownerId) {
      ownerId = uuidv4();
      localStorage.setItem('userId', ownerId);
    }

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId })
      });
      const data = await res.json();
      if (data.boardId) {
        router.push(`/board/${data.boardId}`);
      } else {
        alert(data.error || 'Failed to create board. Check server terminal for database connection errors!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server. Is it running?');
    }
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-indigo-50 to-white ${inter.className}`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-6">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          plano<span className="text-indigo-600">.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-md text-center">
          Collaborative whiteboard for design thinking and ideation. Works in real-time.
        </p>
        <button 
          onClick={handleCreateBoard}
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          Create New Board
        </button>
      </div>
    </main>
  );
}
