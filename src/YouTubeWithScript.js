/* global chrome */
import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import useIsMobile from './useIsMobile';
import useVideoSync from './hooks/useVideoSync';
import RemotePlayer from './utils/RemotePlayer';

const YouTubeWithScript = ({ videoId, onBackClick }) => {
  const [player, setPlayer] = useState(null);
  const [script, setScript] = useState([]);
  const scriptRef = useRef(null);

  // Check if we are running as a Chrome Extension
  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.tabs;

  const {
    currentTime,
    isPointerInScript,
    handlers
  } = useVideoSync(player, scriptRef);

  const isMobile = useIsMobile();

  // Re-applied fix: useMemo + origin
  const videoOpts = React.useMemo(() => ({
    width: '100%',
    height: isMobile ? '300px' : '560px',
    playerVars: {
      origin: window.location.origin,
    },
  }), [isMobile]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateScript = (ytPlayer) => {
    const videoDuration = ytPlayer.getDuration();
    if (videoDuration > 0) {
      const interval = 1;
      const newScript = [];
      for (let time = 0; time < videoDuration; time += interval) {
        newScript.push({ time, text: formatTime(time) });
      }
      setScript(prev => {
        if (prev.length === newScript.length) return prev;
        return newScript;
      });
    }
  };

  const onReady = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    updateScript(ytPlayer);
  };

  const onStateChange = (event) => {
    updateScript(event.target);
  };

  // Initialize Remote Player for Extension
  useEffect(() => {
    if (isExtension) {
      const remote = new RemotePlayer();
      setPlayer(remote);

      // Poll for duration updates
      const checkDuration = setInterval(() => {
        if (remote.getDuration() > 0) {
          updateScript(remote);
        }
      }, 1000);

      return () => clearInterval(checkDuration);
    }
  }, [isExtension]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* If Extension: Hide Player */}
      {!isExtension && (
        <div className="w-full top-0 shrink-0">
          <YouTube
            videoId={videoId}
            opts={videoOpts}
            onReady={onReady}
            onStateChange={onStateChange}
          />
        </div>
      )}

      {/* Timeline */}
      <div
        ref={scriptRef}
        className={`w-full overflow-y-auto p-4 grow basis-0 min-h-0 mt-4 max-w-full bg-gray-950 ${isPointerInScript ? 'border-4 rounded-lg border-purple' : 'border-4 border-purple-ghost rounded-lg'}`}
        {...handlers}
      >
        {script.map((line, index) => {
          const nextTime = script[index + 1] ? script[index + 1].time : Number.MAX_SAFE_INTEGER;
          const isActive = currentTime >= line.time && currentTime < nextTime;
          return (
            <p
              key={index}
              data-time={line.time}
              className={`text-2xl text-center p-2 m-0 rounded ${isActive ? 'bg-purple-ghost' : 'bg-black'}`}
              style={{ border: '0px solid #222222' }}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Bottom Button */}
      <div className="p-4 shrink-0">
        {isExtension ? (
          <a
            href={`https://zoetroview.vercel.app/${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center p-2 text-white rounded mt-4 bg-purple-ghost hover:bg-purple"
          >
            Open ZoetroView Website
          </a>
        ) : (
          <button
            onClick={onBackClick}
            className="w-full p-2 text-white rounded mt-4"
            style={{ zIndex: 10 }}
          >
            Enter Another URL
          </button>
        )}
      </div>
    </div>
  );
};

export default YouTubeWithScript;