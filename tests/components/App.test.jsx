import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/components/App.jsx';

describe('App integration', () => {
  beforeEach(() => {
    window.location.hash = '';
  });
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the grid and toolbar', () => {
    render(<App />);
    expect(screen.getByText(/Solve/)).toBeInTheDocument();
    expect(document.querySelector('svg.puzzle-grid')).toBeInTheDocument();
  });

  it('opens a node popup on node click and applies a selection', async () => {
    render(<App />);
    // click any node hit area
    const nodeHits = document.querySelectorAll('circle.node-hit');
    expect(nodeHits.length).toBeGreaterThan(0);
    fireEvent.click(nodeHits[0]);
    expect(await screen.findByTestId('node-opt-NORMAL')).toBeInTheDocument();
  });

  it('solves the default swamp puzzle and shows the path', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Solve/));
    // at least one highlighted edge (COLOR_PATH) should appear after solve
    await waitFor(() => {
      const highlighted = document.querySelectorAll('svg .edge-hit[fill="#B1F514"]');
      expect(highlighted.length).toBeGreaterThan(0);
    });
  });
});
