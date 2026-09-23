import { expect, it } from 'vitest';
import { isElectron } from '../../../../shared/src/platform/adapter';

it('does not require a browser global during environment detection', () => {
  expect(isElectron()).toBe(false);
});
