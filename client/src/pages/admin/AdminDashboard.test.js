/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../../context/auth';

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../components/AdminMenu', () => () => <div data-testid="admin-menu">Admin Menu</div>);
jest.mock('../../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the admin dashboard with correct details', () => {
        const mockAuth = {
            user: {
                name: 'Admin John',
                email: 'admin@example.com',
                phone: '123-456-7890',
            },
        };

        useAuth.mockReturnValue([mockAuth]);

        const { getByText, getByTestId } = render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        expect(getByTestId('layout')).toBeInTheDocument();
        expect(getByTestId('admin-menu')).toBeInTheDocument();
        expect(getByText('Admin Name : Admin John')).toBeInTheDocument();
        expect(getByText('Admin Email : admin@example.com')).toBeInTheDocument();
        expect(getByText('Admin Contact : 123-456-7890')).toBeInTheDocument();
    });

    it('handles missing user data gracefully', () => {
        useAuth.mockReturnValue([null]);

        const { getByTestId, getByText } = render(
            <MemoryRouter>
                <AdminDashboard />
            </MemoryRouter>
        );

        expect(getByTestId('layout')).toBeInTheDocument();
        expect(getByTestId('admin-menu')).toBeInTheDocument();
        expect(getByText(/Admin Name/i)).toHaveTextContent('Admin Name :');
        expect(getByText(/Admin Email/i)).toHaveTextContent('Admin Email :');
        expect(getByText(/Admin Contact/i)).toHaveTextContent('Admin Contact :');
    });
});
