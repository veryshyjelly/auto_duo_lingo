import { describe, expect, it } from 'vitest';
import { getChips } from './Action';

describe('getChips', () => {
  it('matches a simple sentence', () => {
    const chips = ['I', 'am', 'happy'];
    expect(getChips(chips, 'I am happy')).toEqual(['I', 'am', 'happy']);
  });

  it('handles contractions when chips include the contraction', () => {
    const chips = ["I'm", 'fine'];
    expect(getChips(chips, "I'm fine")).toEqual(["I'm", 'fine']);
  });

  it('handles multi-word phrase chips', () => {
    const chips = ["don't", 'know'];
    expect(getChips(chips, "don't know")).toEqual(["don't", 'know']);
  });

  it('handles number synonyms', () => {
    const chips = ['one', 'apple'];
    expect(getChips(chips, '1 apple')).toEqual(['one', 'apple']);
  });

  it('returns null when no match exists', () => {
    const chips = ['hello', 'world'];
    expect(getChips(chips, 'goodbye')).toBeNull();
  });
});
