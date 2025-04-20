import { logInfo } from './logger';

describe('logInfo', () => {
  it('should be a function', () => {
    expect(typeof logInfo).toBe('function');
  });

  it('should not throw when called', () => {
    expect(() => logInfo('Test message')).not.toThrow();
  });
});
