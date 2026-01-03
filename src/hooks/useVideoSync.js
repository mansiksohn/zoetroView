import { useState, useEffect, useCallback } from 'react';

const useVideoSync = (player, scriptRef) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPointerInScript, setIsPointerInScript] = useState(false);
    const [isTouchScrolling, setIsTouchScrolling] = useState(false);

    // Update current time from player every second
    useEffect(() => {
        if (player) {
            const interval = setInterval(() => {
                setCurrentTime(player.getCurrentTime());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [player]);

    // Sync Script Scroll -> Video Time
    const syncVideoToScroll = useCallback(() => {
        if (scriptRef.current && player) {
            const scrollTop = scriptRef.current.scrollTop;
            const scrollHeight = scriptRef.current.scrollHeight - scriptRef.current.clientHeight;
            const scrollFraction = scrollTop / scrollHeight;
            const videoDuration = player.getDuration();
            const newTime = scrollFraction * videoDuration;

            if (!isNaN(newTime) && isFinite(newTime)) {
                player.seekTo(newTime, true);
            }
        }
    }, [player, scriptRef]);

    const handleScroll = () => {
        if (isPointerInScript && !isTouchScrolling) {
            syncVideoToScroll();
        }
    };

    const handleTouchEnd = () => {
        syncVideoToScroll();
        setIsTouchScrolling(false);
    };

    // Sync Video Time -> Script Scroll
    useEffect(() => {
        if (player && !isPointerInScript && !isTouchScrolling && scriptRef.current) {
            const videoDuration = player.getDuration();
            const scrollFraction = currentTime / videoDuration;
            const targetScrollTop = scrollFraction * (scriptRef.current.scrollHeight - scriptRef.current.clientHeight);

            if (!isNaN(targetScrollTop) && isFinite(targetScrollTop)) {
                scriptRef.current.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentTime, player, isPointerInScript, isTouchScrolling, scriptRef]);

    // Event Handlers
    const handlers = {
        onScroll: handleScroll,
        onMouseEnter: () => setIsPointerInScript(true),
        onMouseLeave: () => setIsPointerInScript(false),
        onTouchStart: () => setIsTouchScrolling(true),
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd
    };

    return {
        currentTime,
        isPointerInScript,
        handlers
    };
};

export default useVideoSync;
