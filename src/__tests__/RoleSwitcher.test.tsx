import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleSwitcher } from '../components/RoleSwitcher';

describe('RoleSwitcher', () => {
  it('renders the Demo Mode badge and both role options', () => {
    const handleRoleChange = vi.fn();
    render(<RoleSwitcher currentRole="organizer" onRoleChange={handleRoleChange} />);

    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    expect(screen.getByText('Organizer')).toBeInTheDocument();
    expect(screen.getByText('Institution Staff')).toBeInTheDocument();
  });

  it('marks Organizer as pressed when currentRole is organizer', () => {
    const handleRoleChange = vi.fn();
    render(<RoleSwitcher currentRole="organizer" onRoleChange={handleRoleChange} />);

    const organizerBtn = screen.getByRole('button', { name: /switch to organizer/i });
    const staffBtn = screen.getByRole('button', { name: /switch to institution staff/i });

    expect(organizerBtn).toHaveAttribute('aria-pressed', 'true');
    expect(staffBtn).toHaveAttribute('aria-pressed', 'false');
    expect(organizerBtn).toHaveClass('role-button--active');
  });

  it('marks Institution Staff as pressed when currentRole is staff', () => {
    const handleRoleChange = vi.fn();
    render(<RoleSwitcher currentRole="staff" onRoleChange={handleRoleChange} />);

    const organizerBtn = screen.getByRole('button', { name: /switch to organizer/i });
    const staffBtn = screen.getByRole('button', { name: /switch to institution staff/i });

    expect(staffBtn).toHaveAttribute('aria-pressed', 'true');
    expect(organizerBtn).toHaveAttribute('aria-pressed', 'false');
    expect(staffBtn).toHaveClass('role-button--active');
  });

  it('calls onRoleChange with "staff" when clicking Institution Staff button', async () => {
    const handleRoleChange = vi.fn();
    const user = userEvent.setup();
    render(<RoleSwitcher currentRole="organizer" onRoleChange={handleRoleChange} />);

    const staffBtn = screen.getByRole('button', { name: /switch to institution staff/i });
    await user.click(staffBtn);

    expect(handleRoleChange).toHaveBeenCalledTimes(1);
    expect(handleRoleChange).toHaveBeenCalledWith('staff');
  });

  it('calls onRoleChange with "organizer" when clicking Organizer button', async () => {
    const handleRoleChange = vi.fn();
    const user = userEvent.setup();
    render(<RoleSwitcher currentRole="staff" onRoleChange={handleRoleChange} />);

    const organizerBtn = screen.getByRole('button', { name: /switch to organizer/i });
    await user.click(organizerBtn);

    expect(handleRoleChange).toHaveBeenCalledTimes(1);
    expect(handleRoleChange).toHaveBeenCalledWith('organizer');
  });
});
