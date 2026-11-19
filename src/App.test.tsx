import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { renderWithProviders } from './test/renderWithProviders.tsx'

describe('App', () => {
  it('muestra el título de la aplicación', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Gestor de tareas' }),
    ).toBeInTheDocument()
  })

  it('presenta el objetivo de la aplicación', () => {
    renderWithProviders(<App />)

    expect(
      screen.getByRole('heading', { name: 'Organizá el trabajo del día' }),
    ).toBeInTheDocument()
  })
})
