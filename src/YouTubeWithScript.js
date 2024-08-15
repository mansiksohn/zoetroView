import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

const YouTubeWithScript = ({ videoId, onBackClick }) => {
    const [player, setPlayer] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [script, setScript] = useState([]);
    const scriptRef = useRef(null);
    const [isPointerInScript, setIsPointerInScript] = useState(false);

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
        const interval = 1; // 스크립트 항목을 1초 간격으로 생성
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
        if (scriptRef.current && player && isPointerInScript) {
            const scrollTop = scriptRef.current.scrollTop;
            const scrollHeight = scriptRef.current.scrollHeight - scriptRef.current.clientHeight;
            const scrollFraction = scrollTop / scrollHeight;
            const videoDuration = player.getDuration();
            const newTime = scrollFraction * videoDuration;
            player.seekTo(newTime, true); // 즉시 영상 재생 위치 조정
        }
    };

    const handleMouseEnter = () => {
        setIsPointerInScript(true);
    };

    const handleMouseLeave = () => {
        setIsPointerInScript(false);
    };

    useEffect(() => {
        if (player && !isPointerInScript) {
            const interval = requestAnimationFrame(() => {
                const videoDuration = player.getDuration();
                const scrollFraction = currentTime / videoDuration;
                const scrollTop = scrollFraction * (scriptRef.current.scrollHeight - scriptRef.current.clientHeight);
                scriptRef.current.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            });
            return () => cancelAnimationFrame(interval);
        }
    }, [currentTime, player, isPointerInScript]);

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="w-full top-0">
                <YouTube videoId={videoId} opts={{ width: '100%', height: '560vh' }} onReady={onReady} />
            </div>
            <div 
                ref={scriptRef} 
                className={`w-full overflow-y-auto p-4 h-full mt-4 max-w-full bg-gray-950 ${isPointerInScript ? 'border-4 rounded-lg border-purple' : 'border-4 border-purple-ghost rounded-lg'}`} 
                onScroll={handleScriptScroll}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
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
