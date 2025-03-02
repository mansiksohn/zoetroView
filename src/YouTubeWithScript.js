import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import YouTube from 'react-youtube';
import useIsMobile from './useIsMobile'; // 커스텀 훅 import

const YouTubeWithScript = ({ videoId, onBackClick }) => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [script, setScript] = useState([]);
  const scriptRef = useRef(null);
  const [isPointerInScript, setIsPointerInScript] = useState(false); // 기존: 마우스 커서가 영역 내에 있는지
  const [isTouchScrolling, setIsTouchScrolling] = useState(false);     // 추가: 터치 스크롤 여부

  const isMobile = useIsMobile(); // 모바일 여부 확인

  // 모바일/데스크톱에 따라 다른 높이 지정
  const videoOpts = {
    width: '100%',
    height: isMobile ? '300px' : '560px'
  };

  // 매 1초마다 현재 시간을 업데이트 (플레이어가 준비되었을 때)
  useEffect(() => {
    if (player) {
      const interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player]);
  
  // 시간을 "hh:mm:ss" 형식으로 포맷팅하는 함수
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // YouTube 플레이어 준비 시 실행되는 함수
  const onReady = (event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);

    const videoDuration = ytPlayer.getDuration();
    const interval = 1; // 스크립트 항목을 1초 간격으로 생성
    const newScript = [];

    for (let time = 0; time < videoDuration; time += interval) {
      newScript.push({ time, text: formatTime(time) });
    }
    setScript(newScript);
  };

  // 스크롤 이벤트 핸들러
  // 마우스 스크롤의 경우에만 실시간 업데이트 (터치 중에는 onTouchEnd에서 업데이트)
  const handleScriptScroll = () => {
    if (scriptRef.current && player && isPointerInScript && !isTouchScrolling) {
      const scrollTop = scriptRef.current.scrollTop;
      const scrollHeight = scriptRef.current.scrollHeight - scriptRef.current.clientHeight;
      const scrollFraction = scrollTop / scrollHeight;
      const videoDuration = player.getDuration();
      const newTime = scrollFraction * videoDuration;
      player.seekTo(newTime, true); // 즉시 영상 재생 위치 조정
    }
  };

  // 마우스 또는 터치 이벤트로 스크립트 영역에 들어갔음을 처리
  const handlePointerEnter = () => {
    setIsPointerInScript(true);
  };

  // 마우스 또는 터치 이벤트로 스크립트 영역에서 벗어났음을 처리
  const handlePointerLeave = () => {
    setIsPointerInScript(false);
  };

  // 터치가 끝난 시점에 스크롤 위치를 반영하여 재생시간 업데이트하는 함수
  const handleTouchEnd = () => {
    // 터치 인터랙션 종료 후 최종 위치 업데이트
    if (scriptRef.current && player) {
      const scrollTop = scriptRef.current.scrollTop;
      const scrollHeight = scriptRef.current.scrollHeight - scriptRef.current.clientHeight;
      const scrollFraction = scrollTop / scrollHeight;
      const videoDuration = player.getDuration();
      const newTime = scrollFraction * videoDuration;
      player.seekTo(newTime, true);
    }
    setIsTouchScrolling(false);
  };

  // 마우스 및 터치 이벤트 처리
  const handleMouseEnter = () => {
    setIsPointerInScript(true);
  };

  const handleMouseLeave = () => {
    setIsPointerInScript(false);
  };

  // 터치 이벤트: 시작 시 터치 스크롤 플래그 활성화
  const handleTouchStart = () => {
    setIsTouchScrolling(true);
  };

  // 영상 진행 상황에 따라 스크립트 자동 스크롤 (사용자가 스크롤 중이 아닐 때)
  useEffect(() => {
    if (player && !isPointerInScript && !isTouchScrolling && scriptRef.current) {
      const videoDuration = player.getDuration();
      const scrollFraction = currentTime / videoDuration;
      const targetScrollTop = scrollFraction * (scriptRef.current.scrollHeight - scriptRef.current.clientHeight);
      scriptRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentTime, player, isPointerInScript, isTouchScrolling]);

  return (
    <div className="flex flex-col h-screen w-full">
      <div className="w-full top-0">
        <YouTube 
          videoId={videoId} 
          opts={videoOpts} 
          onReady={onReady} 
        />
      </div>
      <div 
        ref={scriptRef} 
        className={`w-full overflow-y-auto p-4 h-full mt-4 max-w-full bg-gray-950 ${isPointerInScript ? 'border-4 rounded-lg border-purple' : 'border-4 border-purple-ghost rounded-lg'}`}
        onScroll={handleScriptScroll}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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