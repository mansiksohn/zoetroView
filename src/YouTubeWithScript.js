import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

const YouTubeWithScript = ({ videoId, onBackClick }) => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [script, setScript] = useState([]);
  const scriptRef = useRef(null);

  useEffect(() => {
    if (player) {
      const interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player]);

  const onReady = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);

    const videoDuration = ytPlayer.getDuration();
    const interval = 5; // 5초 간격으로 스크립트 생성
    const newScript = [];

    for (let time = 0; time < videoDuration; time += interval) {
      newScript.push({ time, text: `${formatTime(time)}` });
    }
    setScript(newScript);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleScriptScroll = () => {
    if (scriptRef.current && player) {
      const scrollTop = scriptRef.current.scrollTop;
      const scrollHeight = scriptRef.current.scrollHeight - scriptRef.current.clientHeight;
      const scrollFraction = scrollTop / scrollHeight;
      const videoDuration = player.getDuration();
      const newTime = scrollFraction * videoDuration;
      player.seekTo(newTime);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <div className="w-full top-0">
        <YouTube videoId={videoId} opts={{ width: '100%', height: '480vh' }} onReady={onReady} />
      </div>
      <div 
        ref={scriptRef} 
        className="w-full overflow-y-auto p-4 h-full mt-4 max-w-full bg-gray-950" 
        onScroll={handleScriptScroll}
      >
        {script.map((line, index) => {
          const nextTime = script[index + 1] ? script[index + 1].time : Number.MAX_SAFE_INTEGER;
          const isActive = currentTime >= line.time && currentTime < nextTime;
          return (
            <p 
              key={index} 
              data-time={line.time}
              className={`text-2xl text-center p-2 m-0 rounded ${isActive ? 'bg-purple' : 'bg-black'}`}
              style={{ border: '0px solid #222222' }}
            >
              {line.text}
            </p>
          );
        })}
      </div>
      <div className="p-4">
        <button
          onClick={onBackClick}
          className="w-full p-2 text-white rounded mt-4"
          style={{ zIndex: 10 }}
        >
          Enter Another URL
        </button>
      </div>
    </div>
  );
};

export default YouTubeWithScript;
