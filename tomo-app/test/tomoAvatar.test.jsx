import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from 'vitest';

import TomoAvatar from '../src/components/TomoAvatar.jsx';

describe('TomoAvatar mascot emotions', () => {
  it.each([
    ['idle', 'idle'],
    ['happy', 'happy'],
    ['comfort', 'comfort'],
    ['focused', 'focused'],
    ['speaking', 'speaking'],
    ['celebrating', 'celebrating'],
  ])('shows the correct image for %s', async (animationState, expectedState) => {
    await render(<TomoAvatar animationState={animationState} />);

    expect(screen.getByTestId(`tomo-mascot-${expectedState}`)).toBeTruthy();
  });

  it('falls back to the idle image for an unknown state', async () => {
    await render(<TomoAvatar animationState="unknown" />);

    expect(screen.getByTestId('tomo-mascot-idle')).toBeTruthy();
  });
});
