import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page';

describe('inventory safety landing page', () => {
  it('puts the local safety check before marketing content', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', {
        name: /catch dangerous inventory changes before shopify does/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /upload current supplier file/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/files are processed in your browser and are not uploaded/i),
    ).toBeInTheDocument();
  });
});
