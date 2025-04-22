import { logInfo } from './logger';

describe('logInfo', () => {
  it('should be a function', () => {
    expect(typeof logInfo).to.equal('function');
  });

  it('should not throw when called', () => {
    expect(() => logInfo('Test message')).to.not.throw();
  });
});
