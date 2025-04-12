import ChessGame from '../components/XChessGame';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 w-full text-center z-10 flex flex-col justify-center items-center py-4">
      <main className="flex-grow container mx-auto px-2 sm:px-4 md:px-6">
        <ChessGame />
      </main>
      
      <footer className="text-center text-sm text-gray-500 pb-1 mt-auto">
        <p>LLMChess - Watch language models compete in chess</p>
      </footer>
    </div>
  );
};

export default Home;