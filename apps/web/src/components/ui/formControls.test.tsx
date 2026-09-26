import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';
import { Select } from './Select';
import { Textarea } from './Textarea';

describe('Input', () => {
  it('binds its label to the control', () => {
    render(<Input label="Amount" />);
    expect(screen.getByLabelText('Amount')).toBeInstanceOf(HTMLInputElement);
  });

  it('describes the control with its hint', () => {
    render(<Input label="Amount" hint="In yen" />);
    expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription('In yen');
  });

  it('announces an error and ties it to the control', () => {
    render(<Input label="Amount" hint="In yen" error="Enter a number" />);
    const input = screen.getByLabelText('Amount');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('In yen Enter a number');
  });

  it('is valid and has no alert when there is no error', () => {
    render(<Input label="Amount" />);
    expect(screen.getByLabelText('Amount')).toBeValid();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('marks required fields without putting the asterisk in the accessible name', () => {
    render(<Input label="Amount" required />);
    expect(screen.getByRole('textbox', { name: 'Amount' })).toBeRequired();
  });

  it('keeps the label available to assistive tech when visually hidden', () => {
    render(<Input label="Search tools" hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Search tools' })).toBeInTheDocument();
  });

  it('uses a caller-supplied id', () => {
    render(<Input label="Amount" id="amount" />);
    expect(screen.getByLabelText('Amount')).toHaveAttribute('id', 'amount');
  });

  it('forwards native props such as onChange and disabled', () => {
    const onChange = vi.fn();
    render(<Input label="Amount" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('gives two fields different ids so labels never cross-wire', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );
    expect(screen.getByLabelText('First')).not.toBe(screen.getByLabelText('Second'));
  });
});

describe('Textarea', () => {
  it('binds its label and shows an announced error', () => {
    render(<Textarea label="JSON" error="Invalid JSON" mono />);
    expect(screen.getByLabelText('JSON')).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByLabelText('JSON')).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON');
  });

  it('defaults to a usable height and accepts a row count', () => {
    const { rerender } = render(<Textarea label="Text" />);
    expect(screen.getByLabelText('Text')).toHaveAttribute('rows', '6');
    rerender(<Textarea label="Text" rows={12} />);
    expect(screen.getByLabelText('Text')).toHaveAttribute('rows', '12');
  });
});

describe('Select', () => {
  it('binds its label and lets the user choose an option', () => {
    render(
      <Select label="Currency" defaultValue="jpy">
        <option value="jpy">Yen</option>
        <option value="usd">Dollar</option>
      </Select>,
    );
    const select = screen.getByLabelText('Currency');
    expect(select).toHaveValue('jpy');
    fireEvent.change(select, { target: { value: 'usd' } });
    expect(select).toHaveValue('usd');
  });

  it('shows hint and error like the other controls', () => {
    render(
      <Select label="Currency" hint="Pick one" error="Required">
        <option value="">Choose</option>
      </Select>,
    );
    expect(screen.getByLabelText('Currency')).toHaveAccessibleDescription('Pick one Required');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
