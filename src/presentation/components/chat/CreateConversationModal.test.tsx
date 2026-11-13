import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateConversationModal } from './CreateConversationModal';

describe('CreateConversationModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateConversationModal isOpen={false} onClose={vi.fn()} onCreate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title input, close button, and submit action when open', () => {
    render(
      <CreateConversationModal isOpen={true} onClose={vi.fn()} onCreate={vi.fn()} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nueva Conversación')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Migración Kubernetes Enterprise/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Hilo/i })).toBeDisabled();
  });

  it('submits trimmed title and calls onCreate and onClose', async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateConversationModal
        isOpen={true}
        onClose={handleClose}
        onCreate={handleCreate}
      />
    );

    const input = screen.getByPlaceholderText(/Migración Kubernetes Enterprise/i);
    await act(async () => {
      await user.type(input, '  Auditoría de Seguridad Multi-Tenant  ');
    });

    const submitBtn = screen.getByRole('button', { name: /Crear Hilo/i });
    expect(submitBtn).toBeEnabled();
    await act(async () => {
      await user.click(submitBtn);
    });

    expect(handleCreate).toHaveBeenCalledWith('Auditoría de Seguridad Multi-Tenant');
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking Cancel or Close button', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateConversationModal
        isOpen={true}
        onClose={handleClose}
        onCreate={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await act(async () => {
      await user.click(cancelBtn);
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

