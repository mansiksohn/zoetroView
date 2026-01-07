/* global chrome */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { HashRouter as Router, Route, Routes, useNavigate, useParams, Link } from 'react-router-dom';
import YouTubeWithScript from './YouTubeWithScript';
import './App.css';

// 유튜브 URL에서 videoId를 추출하는 함수
const extractVideoId = (url) => {
  if (!url) return null;
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const Home = () => {
  // 샘플 URL을 기본값으로 설정
  const SAMPLE_URL = 'https://youtu.be/JVxe5NIABsI';
  const [url, setUrl] = useState(SAMPLE_URL);
  const [error, setError] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Chrome Active Tab Detection
  useEffect(() => {
    // Check if running as extension
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          const currentTabId = extractVideoId(tabs[0].url);
          if (currentTabId) {
            navigate(`/${currentTabId}`);
          }
        }
      });
    }
  }, [navigate]);

  // 개선사항 1: extractVideoId를 여러 번 호출하지 않고, 한 번 계산하여 재사용
  const videoId = extractVideoId(url);

  // 페이지 로드 시 input 요소에 포커스 및 전체 선택
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // 개선사항 4: SAMPLE_URL은 상수이므로 의존성 배열에서 제거 (url만 감지)
  useEffect(() => {
    if (url === SAMPLE_URL || url === "") {
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
    }
  }, [url]);

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const handleButtonClick = () => {
    if (videoId) {
      navigate(`/${videoId}`);
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

  // 기본 URL일 경우 테스트 문구, 그 외에는 일반 안내 문구
  const tooltipText = url === SAMPLE_URL ? "Try the sample video!" : "Paste your YouTube URL or type here!";

  return (
    <div className="p-0 flex flex-col items-center justify-center h-screen bg-black text-white relative">
      <img
        src={`${process.env.PUBLIC_URL}/logo192.png`}
        alt="ZoetroView Logo"
        className="w-24 h-24 mb-4"
      />
      <h1 className="text-5xl font-bold mb-4">ZoetroView</h1>

      <p className="text-sm max-w-md mb-8 text-center border-0">
        A desktop viewer that allows users to explore YouTube videos seamlessly through vertical scrolling with a mouse.
      </p>

      <div className="w-full max-w-md">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter YouTube URL"
            className="p-2 mb-1 border border-gray-700 rounded w-full bg-gray-900 text-white"
          />
          {showTooltip && (
            <div className="absolute left-1 bottom-9 mb-1">
              <div className="speech-bubble text-white p-1 text-xs z-10">
                {tooltipText}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mb-4 w-full max-w-md">
        <Link
          to={videoId ? `/${videoId}` : '#'}
          onClick={(e) => {
            if (!videoId) {
              e.preventDefault();
              setError('Invalid YouTube URL. Please enter a valid URL.');
            }
          }}
          className={`button ${videoId ? '' : 'disabled'}`}
        >
          Load Video
        </Link>
        {error && <p className="mt-2 text-red-500 border-0">{error}</p>}
      </div>
    </div>
  );
};

const VideoPage = () => {
  const { videoId } = useParams();

  // 개선사항 2 & 3: useLayoutEffect를 사용하여 타이틀 업데이트를 빠르게 적용하고, AbortController를 통해 fetch 취소 처리
  useLayoutEffect(() => {
    if (videoId) {
      // fetch 전 임시 타이틀 설정
      document.title = 'ZoetroView | Loading...';
      const controller = new AbortController();

      const fetchVideoTitle = async () => {
        try {
          const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
            { signal: controller.signal }
          );
          const data = await response.json();
          document.title = `ZoetroView | ${data.title}`;
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Fetch aborted');
          } else {
            console.error('Error fetching video title:', error);
            document.title = `ZoetroView | Unknown Video`;
          }
        }
      };

      fetchVideoTitle();

      return () => {
        controller.abort();
      };
    }
  }, [videoId]);

  return <YouTubeWithScript videoId={videoId} onBackClick={() => window.history.back()} />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:videoId" element={<VideoPage />} />
      </Routes>
    </Router>
  );
};

export default App;
