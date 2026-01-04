import { useState, useEffect, useCallback, useRef } from 'react';

const useVideoSync = (player, listRef, { secondsPerItem = 1, itemSize = 50, paddingCount = 0 }) => {
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
                    // OPTIMIZATION: Only trigger React Re-render (State Update) when the SECOND changes.
                    // This keeps the UI highlight (1s resolution) distinct from the smooth scroll (60fps).
                    // Prevents "Flickering" caused by 60fps React render thrashing.
                    const prevFloor = Math.floor(lastVideoTime.current);
                    const currFloor = Math.floor(time);
                    if (prevFloor !== currFloor) {
                        setCurrentTime(time);
                    }
                    lastVideoTime.current = time;

                    // Sync Video -> List Scroll (Smooth 60fps Direct DOM)
                    if (listRef.current && !isHovering && !isAutoScrolling.current) {
                        // Calculate exact pixel offset
                        // Logic: Item 0 (00:00) starts at index = paddingCount.
                        // We want to center it.
                        // Assuming paddingCount * itemSize approx equals ViewportHeight / 2.
                        // Then target pixel for alignment is just the physical position relative to start.
                        // Physical Index = paddingCount + (time / secondsPerItem)

                        if (listRef.current._outerRef) {
                            const viewportHeight = listRef.current._outerRef.clientHeight;
                            const logicalIndex = time / secondsPerItem;
                            const physicalIndex = paddingCount + logicalIndex;
                            const itemCenter = (physicalIndex * itemSize) + (itemSize / 2);
                            const scrollTop = itemCenter - (viewportHeight / 2);
                            listRef.current.scrollTo(scrollTop);
                        }
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
    }, [player, listRef, isHovering, secondsPerItem, itemSize, paddingCount]);

    // Handler for react-window onScroll (Manual Scroll -> Video)
    const onListScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }, listHeight) => {
        // Ignore if this scroll was caused by our own scrollTo
        if (scrollUpdateWasRequested) return;

        // If user is hovering/scrolling manually
        if (isHovering && player) {
            isAutoScrolling.current = true;

            // Reverse Logic:
            // Center of Viewport = scrollOffset + listHeight / 2.
            // Item Center Y = (paddingCount + LogicalIndex) * ItemSize + ItemSize/2.
            // Solve for LogicalIndex

            const centerViewport = scrollOffset + (listHeight / 2);
            const logicalIndex = ((centerViewport - (itemSize / 2)) / itemSize) - paddingCount;
            const newTime = logicalIndex * secondsPerItem;

            if (!isNaN(newTime) && isFinite(newTime)) {
                // Time can be negative if scrolled into top padding? 
                // Clamp it.
                const clampedTime = Math.max(0, newTime);

                // Debounce seeking slightly? Or direct?
                // Direct for responsiveness.
                if (Math.abs(clampedTime - player.getCurrentTime()) > 0.2) {
                    player.seekTo(clampedTime, true);
                    setCurrentTime(clampedTime);
                }
            }

            // Reset auto-scroll flag
            setTimeout(() => { isAutoScrolling.current = false; }, 100);
        }
    }, [player, listRef, itemSize, secondsPerItem, isHovering, paddingCount]);

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
