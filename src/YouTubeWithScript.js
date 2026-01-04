/* global chrome */
import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import YouTube from 'react-youtube';
import { FixedSizeList as List } from 'react-window';
import useIsMobile from './useIsMobile';
import useVideoSync from './hooks/useVideoSync';
import RemotePlayer from './utils/RemotePlayer';
import { useContainerDimensions } from './hooks/useContainerDimensions';

// Row Component for Detailed Timeline (1s)
const DetailedRow = ({ index, style, data }) => {
  const { script, currentTime, player, paddingCount } = data;

  // Checking for Padding Indices
  if (index < paddingCount || index >= script.length + paddingCount) {
    return <div style={style} />;
  }

  const realIndex = index - paddingCount;
  const line = script[realIndex];
  if (!line) return null;

  const isCurrentSecond = Math.floor(currentTime) === line.time;
  const isMajor = realIndex % 10 === 0;

  return (
    <div style={style} className="flex items-center justify-center">
      {isMajor ? (
        <div
          className={`w-full text-center transition-colors duration-200 cursor-pointer ${isCurrentSecond ? 'text-purple-400 font-bold text-2xl' : 'text-gray-400 text-xl hover:text-white'}`}
          onClick={() => player && player.seekTo(line.time, true)}
        >
          {line.text}
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer group"
          onClick={() => player && player.seekTo(line.time, true)}
          title={line.text}
        >
          <div className={`w-2 h-2 rounded-full ${isCurrentSecond ? 'bg-purple-500 scale-150' : 'bg-gray-600 group-hover:bg-gray-400'}`} />
        </div>
      )}
    </div>
  );
};

// Row Component for Fast Timeline (10s)
const FastRow = ({ index, style, data }) => {
  const { script, currentTime, player, paddingCount } = data;

  // Checking for Padding Indices
  if (index < paddingCount || index >= script.length + paddingCount) {
    return <div style={style} />;
  }

  const realIndex = index - paddingCount;
  const line = script[realIndex];
  if (!line) return null;

  const isActiveBlock = currentTime >= line.time && currentTime < (line.time + 10);
  const isMajor = realIndex % 6 === 0;

  return (
    <div style={style} className="flex items-center justify-center">
      {isMajor ? (
        <div
          className={`w-full text-center transition-colors duration-200 cursor-pointer ${isActiveBlock ? 'text-purple-400 font-bold text-xl' : 'text-gray-500 text-lg hover:text-white'}`}
          onClick={() => player && player.seekTo(line.time, true)}
        >
          {line.text}
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer group"
          onClick={() => player && player.seekTo(line.time, true)}
          title={line.text}
        >
          <div className={`w-4 h-2 rounded ${isActiveBlock ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
        </div>
      )}
    </div>
  );
};

const YouTubeWithScript = ({ videoId, onBackClick }) => {
  const [player, setPlayer] = useState(null);
  const [script, setScript] = useState([]);
  const [fastScript, setFastScript] = useState([]);

  const scriptListRef = useRef(null);
  const fastListRef = useRef(null);

  const [detailedContainerRef, detailedDim] = useContainerDimensions();
  const [fastContainerRef, fastDim] = useContainerDimensions();

  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.tabs;
  const isMobile = useIsMobile();
  const ITEM_SIZE = 50;

  // DUMMY ITEM STRATEGY
  // 12 items * 50px = 600px padding.
  // This ensures that Index 0 (Time 0) can be pushed to the center (~300px)
  // and Index Max can be pulled to the center.
  const PADDING_COUNT = 12;

  const {
    currentTime,
    isHovering: isHoveringDetail,
    handlers: detailHandlers
  } = useVideoSync(player, scriptListRef, { secondsPerItem: 1, itemSize: ITEM_SIZE, paddingCount: PADDING_COUNT });

  const {
    currentTime: fastCurrentTime,
    isHovering: isHoveringFast,
    handlers: fastHandlers
  } = useVideoSync(player, fastListRef, { secondsPerItem: 10, itemSize: ITEM_SIZE, paddingCount: PADDING_COUNT });

  const detailItemData = useMemo(() => ({ script, currentTime, player, paddingCount: PADDING_COUNT }), [script, currentTime, player]);
  const fastItemData = useMemo(() => ({ script: fastScript, currentTime: fastCurrentTime, player, paddingCount: PADDING_COUNT }), [fastScript, fastCurrentTime, player]);

  const videoOpts = useMemo(() => ({
    width: '100%',
    height: isMobile ? '300px' : '560px',
    playerVars: {
      origin: window.location.origin,
    },
  }), [isMobile]);

  // Removed old dynamic padding logic.
  // const getPadding = ... (Unused)
  // const detailedPadding = ... (Unused)
  // const fastPadding = ... (Unused)

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
      setScript(prev => (prev.length === newScript.length ? prev : newScript));

      const fastInterval = 10;
      const newFastScript = [];
      for (let time = 0; time < videoDuration; time += fastInterval) {
        newFastScript.push({ time, text: formatTime(time) });
      }
      setFastScript(prev => (prev.length === newFastScript.length ? prev : newFastScript));
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

  useEffect(() => {
    if (isExtension) {
      const remote = new RemotePlayer();
      setPlayer(remote);
      const checkDuration = setInterval(() => {
        if (remote.getDuration() > 0) updateScript(remote);
      }, 1000);
      return () => clearInterval(checkDuration);
    }
  }, [isExtension]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-black text-white">
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

      {/* Timeline Container */}
      <div className="flex flex-row grow basis-0 min-h-0 mt-4 mx-4 max-w-full gap-4 overflow-hidden">

        {/* Fast Timeline (10s) */}
        {fastScript.length > 0 && (
          <div
            className={`w-1/4 h-full bg-gray-950 transition-colors duration-200 flex flex-col items-stretch ${isHoveringFast ? 'border-4 rounded-lg border-purple-500' : 'border-4 border-purple-900 rounded-lg'}`}
            onMouseEnter={fastHandlers.onMouseEnter}
            onMouseLeave={fastHandlers.onMouseLeave}
          >
            <div className="text-center text-xs text-purple-300 py-1 bg-purple-900/20 font-mono">FAST (10s)</div>
            <div ref={fastContainerRef} className="flex-1 min-h-0 relative" style={{ height: '100%' }}>
              {fastDim.height > 0 && (
                <List
                  ref={fastListRef}
                  height={fastDim.height}
                  width="100%"
                  itemCount={fastScript.length + (PADDING_COUNT * 2)}
                  itemSize={ITEM_SIZE}
                  itemData={fastItemData}
                  onScroll={(props) => fastHandlers.onListScroll(props, fastDim.height)}
                >
                  {FastRow}
                </List>
              )}
            </div>
          </div>
        )}

        {/* Detailed Timeline (1s) */}
        <div
          className={`flex-1 h-full bg-gray-950 transition-colors duration-200 flex flex-col items-stretch ${isHoveringDetail ? 'border-4 rounded-lg border-purple-500' : 'border-4 border-purple-900 rounded-lg'}`}
          onMouseEnter={detailHandlers.onMouseEnter}
          onMouseLeave={detailHandlers.onMouseLeave}
        >
          <div className="text-center text-xs text-purple-300 py-1 bg-purple-900/20 font-mono">DETAILED (1s)</div>
          <div ref={detailedContainerRef} className="flex-1 min-h-0 relative" style={{ height: '100%' }}>
            {detailedDim.height > 0 && (
              <List
                ref={scriptListRef}
                height={detailedDim.height}
                width="100%"
                itemCount={script.length + (PADDING_COUNT * 2)}
                itemSize={ITEM_SIZE}
                itemData={detailItemData}
                onScroll={(props) => detailHandlers.onListScroll(props, detailedDim.height)}
              >
                {DetailedRow}
              </List>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-4 shrink-0">
        {isExtension ? (
          <a
            href={`https://zoetroview.vercel.app/#/${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center p-2 text-white rounded bg-purple-700 hover:bg-purple-600 transition-colors"
          >
            Open ZoetroView Web
          </a>
        ) : (
          <button
            onClick={onBackClick}
            className="w-full p-2 text-white rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Enter Another URL
          </button>
        )}
      </div>
    </div>
  );
};
export default YouTubeWithScript;