

import { useState, useCallback, useLayoutEffect } from 'react';

export const useContainerDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [node, setNode] = useState(null);

    const ref = useCallback((node) => {
        setNode(node);
    }, []);

    useLayoutEffect(() => {
        if (!node) return;

        console.log('[Debug] ResizeObserver observing:', node);

        const observer = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            console.log(`[Debug] ResizeObserver: ${width}x${height}`);
            setDimensions({ width, height });
        });

        observer.observe(node);

        // Initial check in case it already has size
        const rect = node.getBoundingClientRect();
        if (rect.height > 0) {
            setDimensions({ width: rect.width, height: rect.height });
        }

        return () => {
            observer.disconnect();
        };
    }, [node]);

    return [ref, dimensions];
};
