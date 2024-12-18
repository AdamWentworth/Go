// Button.test.js

import React from 'react'; // Add this line
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders the button with the correct text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);

  fireEvent.click(screen.getByText('Click Me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

