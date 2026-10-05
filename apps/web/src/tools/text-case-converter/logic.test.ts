import { describe, expect, it } from 'vitest';
import { CASE_OPTIONS, convertCase } from './logic';

describe('convertCase', () => {
  it('lowercases and uppercases', () => {
    expect(convertCase('Hello World', 'lower')).toBe('hello world');
    expect(convertCase('Hello World', 'upper')).toBe('HELLO WORLD');
  });

  it('title-cases every word and keeps apostrophes inside words', () => {
    expect(convertCase('the QUICK brown fox', 'title')).toBe('The Quick Brown Fox');
    expect(convertCase("don't stop-me now", 'title')).toBe("Don't Stop-Me Now");
    expect(convertCase('3rd place', 'title')).toBe('3rd Place');
  });

  it('sentence-cases the start and after sentence ends', () => {
    expect(convertCase('hELLO there. how ARE you? fine! ok', 'sentence')).toBe(
      'Hello there. How are you? Fine! Ok',
    );
    expect(convertCase('first line\nsecond line', 'sentence')).toBe('First line\nSecond line');
    expect(convertCase('v1.2 is out', 'sentence')).toBe('V1.2 is out');
  });

  it('converts to camelCase and PascalCase', () => {
    expect(convertCase('hello world example', 'camel')).toBe('helloWorldExample');
    expect(convertCase('Hello_World-Example', 'camel')).toBe('helloWorldExample');
    expect(convertCase('hello world example', 'pascal')).toBe('HelloWorldExample');
    expect(convertCase('SOME_CONSTANT_NAME', 'pascal')).toBe('SomeConstantName');
  });

  it('converts to snake_case and kebab-case, splitting camelCase and acronyms', () => {
    expect(convertCase('Hello World', 'snake')).toBe('hello_world');
    expect(convertCase('helloWorldExample', 'snake')).toBe('hello_world_example');
    expect(convertCase('HTTPServerError', 'kebab')).toBe('http-server-error');
    expect(convertCase('  Hello,   World!  ', 'kebab')).toBe('hello-world');
  });

  it('keeps line breaks, blank lines and CRLF for the programming cases', () => {
    expect(convertCase('one two\n\nthree four', 'snake')).toBe('one_two\n\nthree_four');
    expect(convertCase('one two\r\nthree four', 'camel')).toBe('oneTwo\r\nthreeFour');
  });

  it('handles punctuation-only and empty input', () => {
    expect(convertCase('', 'camel')).toBe('');
    expect(convertCase('!!! ???', 'snake')).toBe('');
    expect(convertCase('', 'title')).toBe('');
  });

  it('handles Unicode letters', () => {
    expect(convertCase('élan vital über', 'title')).toBe('Élan Vital Über');
    expect(convertCase('ÉLAN VITAL', 'lower')).toBe('élan vital');
    expect(convertCase('café au lait', 'camel')).toBe('caféAuLait');
    expect(convertCase('日本語 テキスト', 'kebab')).toBe('日本語-テキスト');
    expect(convertCase('こんにちは。ありがとう', 'sentence')).toBe('こんにちは。ありがとう');
  });

  it('offers every case it supports exactly once', () => {
    expect(new Set(CASE_OPTIONS.map((o) => o.id)).size).toBe(CASE_OPTIONS.length);
    for (const option of CASE_OPTIONS)
      expect(typeof convertCase('Sample text', option.id)).toBe('string');
  });
});
