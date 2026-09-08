import { resolveAnimationState } from '../constants/animationMapping.js';

/**
 * Diễn giải action từ backend. Phase 0 chỉ giữ dispatcher an toàn.
 * @param {object} action - Action object theo API_SPEC mục 5.2.
 * @returns {Promise<void>}
 */
export async function runAction(action) {
  if (!action?.type || action.type === 'none') {
    return;
  }

  switch (action.type) {
    case 'set_animation':
      resolveAnimationState(action.params?.emotion_label);
      return;
    default:
      return;
  }
}
