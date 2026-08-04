import type { Modifier } from '@dnd-kit/core';

export const snapCenterToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (draggingNodeRect && activatorEvent instanceof PointerEvent) {
    return {
      ...transform,
      x:
        transform.x +
        (activatorEvent.clientX - draggingNodeRect.left) -
        draggingNodeRect.width / 2,
      y:
        transform.y +
        (activatorEvent.clientY - draggingNodeRect.top) -
        draggingNodeRect.height / 2,
    };
  }
  return transform;
};
