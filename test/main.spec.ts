import { add } from '@/main';

describe('main test suite', () => {
  it('should add two numbers', () => {
    expect(add(1, 1)).toBe(2);
  });
});
