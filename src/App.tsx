import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import TestamentPage from './pages/TestamentPage';
import BookChaptersPage from './pages/BookChaptersPage';
import ReadPage from './pages/ReadPage';
import MemorizePage from './pages/MemorizePage';
import MyVersesPage from './pages/MyVersesPage';
import ProgressPage from './pages/ProgressPage';
import AboutPage from './pages/AboutPage';
import TopicPage from './pages/TopicPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/testament/:testament" element={<TestamentPage />} />
          <Route path="/library/:book" element={<BookChaptersPage />} />
          <Route path="/read/:book/:chapter" element={<ReadPage />} />
          <Route path="/memorize" element={<MemorizePage />} />
          <Route path="/my-verses" element={<MyVersesPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/topics/:slug" element={<TopicPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
