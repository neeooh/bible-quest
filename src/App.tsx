import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ReadPage from './pages/ReadPage';
import MemorizePage from './pages/MemorizePage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/library' element={<LibraryPage />} />
          <Route path='/read/:chapter' element={<ReadPage />} />
          <Route path='/memorize' element={<MemorizePage />} />
          <Route path='/progress' element={<ProgressPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
