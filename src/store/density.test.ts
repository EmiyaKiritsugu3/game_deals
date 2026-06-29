import { afterEach, describe, expect, it } from 'vitest';
import { useDensity } from './density';

describe('density', () => {
  afterEach(() => {
    useDensity.setState({ density: 'comfortable' });
  });

  it('starts as comfortable', () => {
    expect(useDensity.getState().density).toBe('comfortable');
  });

  it('setDensity updates value', () => {
    useDensity.getState().setDensity('compact');
    expect(useDensity.getState().density).toBe('compact');
  });

  it('setDensity accepts comfortable', () => {
    useDensity.getState().setDensity('compact');
    useDensity.getState().setDensity('comfortable');
    expect(useDensity.getState().density).toBe('comfortable');
  });

  it('toggle flips comfortable→compact', () => {
    useDensity.getState().toggle();
    expect(useDensity.getState().density).toBe('compact');
  });

  it('toggle flips compact→comfortable', () => {
    useDensity.getState().setDensity('compact');
    useDensity.getState().toggle();
    expect(useDensity.getState().density).toBe('comfortable');
  });

  it('toggle called multiple times alternates correctly', () => {
    const toggle = useDensity.getState().toggle;
    toggle();
    expect(useDensity.getState().density).toBe('compact');
    toggle();
    expect(useDensity.getState().density).toBe('comfortable');
    toggle();
    expect(useDensity.getState().density).toBe('compact');
  });
});
