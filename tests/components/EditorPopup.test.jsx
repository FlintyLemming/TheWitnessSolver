import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorPopup from '../../src/components/EditorPopup.jsx';

describe('EditorPopup', () => {
  it('node panel: clicking an option applies and closes', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'node', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('node-opt-START'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'node', x: 0, y: 0, value: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  it('edge panel: clicking an option applies and closes', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'edge', orientation: 'hor', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('edge-opt-OBSTACLE'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'edge', orientation: 'hor', x: 0, y: 0, value: 2 });
    expect(onClose).toHaveBeenCalled();
  });

  it('cell panel: type and color buttons apply without auto-closing', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'cell', x: 0, y: 0 }}
        cell={{ type: 0, color: 0 }}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('cell-type-SQUARE'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'cell', x: 0, y: 0, type: 1 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('cell-color-RED'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'cell', x: 0, y: 0, color: 5 });
    // close button
    fireEvent.click(screen.getByTestId('popup-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc closes the popup', () => {
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'node', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
