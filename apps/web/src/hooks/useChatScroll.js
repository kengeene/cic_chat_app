import { useCallback, useLayoutEffect, useRef } from 'react';

const NEAR_BOTTOM_PX = 120;

/**
 * Keeps the message list pinned to the bottom for new messages (only if the reader is already near it)
 * and preserves the viewport when older messages are prepended.
 */
export const useChatScroll = ({ firstMessageId, lastMessageId }) => {
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const distanceFromBottomRef = useRef(null);

  const handleScroll = useCallback(() => {
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX;
  }, []);

  const anchorBeforeLoadingOlder = useCallback(() => {
    const { scrollHeight, scrollTop } = containerRef.current;
    distanceFromBottomRef.current = scrollHeight - scrollTop;
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || distanceFromBottomRef.current === null) return;
    container.scrollTop = container.scrollHeight - distanceFromBottomRef.current;
    distanceFromBottomRef.current = null;
  }, [firstMessageId]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !isNearBottomRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [lastMessageId]);

  return { containerRef, handleScroll, anchorBeforeLoadingOlder };
};
