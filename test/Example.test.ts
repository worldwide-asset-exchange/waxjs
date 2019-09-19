import { expect } from 'chai';
import { Example } from '../src';

describe('My Example', () => {
  it('should return hello wax', () => {
    const result = Example('wax');
    expect(result).to.equal('Hello wax');
  });
});