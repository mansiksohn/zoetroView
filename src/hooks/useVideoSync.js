import { useState, useEffect, useCallback, useRef } from 'react';

const useVideoSync = (player, listRef, { secondsPerItem = 1, itemSize = 50 }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // Track internal state for the animation loop
    const isAutoScrolling = useRef(false);
    const lastVideoTime = useRef(0);

    // Animation Loop
    useEffect(() => {
        let animationFrameId;

        const loop = () => {
            if (player && typeof player.getCurrentTime === 'function') {
                const time = player.getCurrentTime();

                // Only update if time has changed significantly to avoid thrashing, 
                // but for smooth scroll we want every frame.
                if (Math.abs(time - lastVideoTime.current) > 0.01) {
                    setCurrentTime(time);
                    lastVideoTime.current = time;

                    // Sync Video -> List Scroll (Smooth)
                    if (listRef.current && !isHovering && !isAutoScrolling.current) {
                        // Calculate exact pixel offset
                        // time / secondsPerItem = index (float)
                        // index * itemSize = pixel offset
                        const scrollOffset = (time / secondsPerItem) * itemSize;
                        listRef.current.scrollTo(scrollOffset);
                    }
                }
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        // Start loop
        animationFrameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [player, listRef, isHovering, secondsPerItem, itemSize]);

    // Handler for react-window onScroll (Manual Scroll -> Video)
    const onListScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }, listHeight) => {
        // Ignore if this scroll was caused by our own scrollTo
        // react-window passes scrollUpdateWasRequested=true when scrollTo is called
        if (scrollUpdateWasRequested) return;

        // If user is hovering/scrolling manually
        if (isHovering && player) {
            isAutoScrolling.current = true;

            // Calculate time from center of viewport
            // We assume the list has padding so item 0 starts at 'padding'
            // effectively, scrollOffset=0 means item 0 is at top (if no padding) 
            // BUT with padding, scrollOffset=0 means we are at the top of the padding.
            // Let's rely on strict math:
            // scrollOffset corresponds to the position of the scrollbar.
            // If we center-align behavior is desired:
            // Center Pixel = scrollOffset + listHeight / 2
            // But we actually want the time corresponding to the "center line".

            // If we added padding = listHeight/2 to Top, then:
            // At scrollOffset=0, the pixel at the "physical center" of the viewport is actually...
            // Wait, if we use padding, react-window's "scrollOffset" 0 is still the top of the content?
            // "scrollTo(0)" goes to top. The validation in YouTubeWithScript will handle padding.
            // Here we just map scrollOffset -> Time.
            // If we pad the top by H/2, then the item at scrollOffset 0 is actually hidden?
            // No, fixed size list with innerElementType padding:
            // Item 0 is at y=paddingTop.
            // Visual Center is at scrollOffset + H/2.
            // So we want the item whose center is at (scrollOffset + H/2).
            // Item Center Y = paddingTop + index * itemSize + itemSize/2.
            // approx: index * itemSize + paddingTop = scrollOffset + H/2 - itemSize/2
            // Simplest: Time = (scrollOffset) / itemSize * secondsPerItem
            // This maps Top-of-Screen to Time.
            // The user requested Center-to-Time.
            // Let's simply map the scroll offset directly and let the padding handle the alignment visually?
            // No, strictly: 
            const index = scrollOffset / itemSize;
            const newTime = index * secondsPerItem;

            if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0) {
                // Seek, but don't force state update heavily
                // Debouncing seeking might be needed if it lags, but try direct first.
                // To update the UI number:
                setCurrentTime(newTime);

                // Debounce actual video seek to avoid audio stutter?
                // For now, direct seek.
                if (Math.abs(newTime - player.getCurrentTime()) > 0.5) {
                    player.seekTo(newTime, true);
                }
            }

            // Reset auto-scroll flag shortly after interaction stops? 
            // Actually we rely on `isHovering` to gate the loop.
            // But we need to unset isAutoScrolling if we use it elsewhere.
            setTimeout(() => { isAutoScrolling.current = false; }, 100);
        }
    }, [player, listRef, itemSize, secondsPerItem, isHovering]);

    const handlers = {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => setIsHovering(false),
        onListScroll
    };

    return {
        currentTime,
        isHovering,
        handlers
    };
};

export default useVideoSync;
