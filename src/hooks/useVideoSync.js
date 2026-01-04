import { useState, useEffect, useCallback, useRef } from 'react';

const useVideoSync = (player, listRef, { secondsPerItem = 1, itemSize = 50 }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // We use a ref to track if the last scroll was triggered by the code (auto-scroll)
    // react-window's onScroll provides { scrollUpdateWasRequested }, but we need it for our logic
    const isAutoScrolling = useRef(false);

    // Update current time from player every 0.1s for smoother UI updates (optional, keeping 1s for now matching original logic? 
    // User requested 60fps smooth. 1s interval is too slow for "smooth" sync if we rely on it for UI highlights.
    // But let's stick to 500ms or 250ms or keep standard and rely on events.
    // Original was 1000ms. Let's make it faster: 200ms.
    useEffect(() => {
        if (player) {
            const interval = setInterval(() => {
                setCurrentTime(player.getCurrentTime());
            }, 200);
            return () => clearInterval(interval);
        }
    }, [player]);

    // Sync Video -> List Scroll
    useEffect(() => {
        if (player && listRef.current && !isHovering) {
            const index = Math.floor(currentTime / secondsPerItem);
            // react-window scrollToItem handles centering
            isAutoScrolling.current = true;
            listRef.current.scrollToItem(index, 'center');
            // Reset flag after a short delay to allow scroll event to fire and be ignored
            setTimeout(() => { isAutoScrolling.current = false; }, 100);
        }
    }, [currentTime, player, listRef, isHovering, secondsPerItem]);

    // Handler for react-window onScroll
    // logic: Center of Viewport Time
    const onListScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }, listHeight) => {
        // Ignore if this scroll was caused by scrollToItem (Video->Scroll sync)
        if (scrollUpdateWasRequested || isAutoScrolling.current) return;

        if (player && listRef.current) {
            const centerOffset = scrollOffset + listHeight / 2;
            const index = centerOffset / itemSize;
            const newTime = index * secondsPerItem;

            if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0) {
                player.seekTo(newTime, true);
                setCurrentTime(newTime);
            }
        }
    }, [player, listRef, itemSize, secondsPerItem]);

    const handlers = {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => {
            setIsHovering(false);
        },
        // We expose a specialized scroll handler for the List component
        onListScroll
    };

    return {
        currentTime,
        isHovering,
        handlers
    };
};

export default useVideoSync;
