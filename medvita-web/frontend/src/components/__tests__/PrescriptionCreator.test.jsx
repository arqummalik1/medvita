import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrescriptionCreator from '../PrescriptionCreator'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

// Mock the dependencies
vi.mock('../../context/AuthContext')
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://fake-url.com' } }),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}))

vi.mock('@headlessui/react', () => {
  const Dialog = ({ open, children }) => open ? <div data-testid="dialog">{children}</div> : null
  Dialog.Panel = ({ children }) => <div data-testid="dialog-panel">{children}</div>
  Dialog.Title = ({ children }) => <h2>{children}</h2>
  return { Dialog }
})

// Need to mock Dialog.Panel, Dialog.Title too since they are dot notation components
// Actually, Headless UI components often work in JSDOM, but if not, we can rely on standard behavior.
// Let's try rendering without deep mocking first, usually it works if we polyfill ResizeObserver.

// Polyfill ResizeObserver for Headless UI
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('PrescriptionCreator', () => {
  const mockSetIsOpen = vi.fn()
  const mockPatient = { id: '123', name: 'John Doe' }
  const mockUser = { id: 'doctor-1' }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: mockUser })
  })

  it('renders correctly when open', () => {
    render(
      <PrescriptionCreator 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        patient={mockPatient} 
      />
    )

    expect(screen.getByText(/New Prescription for/i)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. Acute Bronchitis/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter medications and instructions.../i)).toBeInTheDocument()
  })

  it('combines diagnosis and rx on submit', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    supabase.from.mockReturnValue({ insert: mockInsert })

    render(
      <PrescriptionCreator 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        patient={mockPatient} 
      />
    )

    // Fill in Diagnosis
    fireEvent.change(screen.getByPlaceholderText(/e.g. Acute Bronchitis/i), {
      target: { value: 'Common Cold' },
    })

    // Fill in Rx
    fireEvent.change(screen.getByPlaceholderText(/Enter medications and instructions.../i), {
      target: { value: 'Rest and fluids' },
    })

    // Submit
    fireEvent.click(screen.getByText('Create Prescription'))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          patient_id: '123',
          doctor_id: 'doctor-1',
          prescription_text: expect.stringContaining('Diagnosis: Common Cold'),
        }),
      ])
      
      // Check full string format
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          prescription_text: "Diagnosis: Common Cold\n\nRx:\nRest and fluids"
        })
      ])
    })
  })
})
