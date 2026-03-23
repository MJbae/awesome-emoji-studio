import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders Awesome Emoji Studio heading after hydration', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Awesome Emoji Studio')).toBeInTheDocument();
    });
  });
});
