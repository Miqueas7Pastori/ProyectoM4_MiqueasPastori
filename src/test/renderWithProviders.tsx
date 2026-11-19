import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../context/AuthContext.tsx'

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...renderOptions } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}
