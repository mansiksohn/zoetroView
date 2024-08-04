import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import YouTubeWithScript from './YouTubeWithScript';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

// 유튜브 URL에서 videoId를 추출하는 함수
const extractVideoId = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const Home = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const handleButtonClick = () => {
    const id = extractVideoId(url);
    if (id) {
      navigate(`/${id}`);
      setError('');
    } else {
      setError('Invalid YouTube URL. Please enter a valid URL.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleButtonClick();
    }
  };

  return (
    <div className="p-0 flex items-center justify-center h-screen bg-black">
      <div className="mb-4 w-full max-w-md">
        <input
          type="text"
          value={url}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter YouTube URL"
          className="p-2 border border-gray-700 rounded w-full bg-gray-900 text-white"
        />
        <button
          onClick={handleButtonClick}
          className="mt-2 p-2 bg-purple text-white rounded w-full"
        >
          Load Video
        </button>
        {error && <p className="mt-2 text-red-500 border-0">{error}</p>}
      </div>
    </div>
  );
};

const VideoPage = () => {
  const { videoId } = useParams();

  return <YouTubeWithScript videoId={videoId} onBackClick={() => window.history.back()} />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:videoId" element={<VideoPage />} />
      </Routes>
      <Analytics />
    </Router>
  );
};

export default App;
