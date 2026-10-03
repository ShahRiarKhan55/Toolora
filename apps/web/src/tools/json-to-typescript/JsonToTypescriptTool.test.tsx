import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonToTypescriptTool } from './JsonToTypescriptTool';

function generate(json: string) {
  fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: json } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate TypeScript' }));
}

describe('JsonToTypescriptTool', () => {
  it('generates an interface from valid JSON', () => {
    render(<JsonToTypescriptTool />);
    generate('{"a":1,"b":{"c":null}}');
    const result = screen.getByLabelText<HTMLTextAreaElement>('Result').value;
    expect(result).toContain('export interface Root');
    expect(result).toContain('b: B;');
    expect(result).toContain('c: null;');
  });

  it('uses the chosen root type name', () => {
    render(<JsonToTypescriptTool />);
    fireEvent.change(screen.getByLabelText('Root type name'), { target: { value: 'ApiUser' } });
    generate('{"a":1}');
    expect(screen.getByLabelText('Result')).toHaveValue(
      'export interface ApiUser {\n  a: number;\n}',
    );
  });

  it('announces invalid JSON and shows no result', () => {
    render(<JsonToTypescriptTool />);
    generate('{bad');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('flags an invalid root name next to its field', () => {
    render(<JsonToTypescriptTool />);
    fireEvent.change(screen.getByLabelText('Root type name'), { target: { value: '1bad' } });
    generate('{"a":1}');
    expect(screen.getByRole('alert')).toHaveTextContent(/start with a digit/i);
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('shows an error for empty input', () => {
    render(<JsonToTypescriptTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate TypeScript' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter some json/i);
  });

  it('loads an example, offers copy, and resets', () => {
    render(<JsonToTypescriptTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate TypeScript' }));
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('JSON input')).toHaveValue('');
    expect(screen.getByLabelText('Root type name')).toHaveValue('Root');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
