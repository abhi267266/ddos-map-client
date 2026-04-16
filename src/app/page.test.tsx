import { render, screen } from '@testing-library/react'
import Home from './page'
import { expect, test, vi } from 'vitest'

// Mock the GlobeScene because canvas WebGL isn't supported in happy-dom
vi.mock('./components/GlobeScene', () => ({
  GlobeScene: () => <div data-testid="mock-globe-scene">Globe Scene</div>
}))

test('renders the threat dashboard', () => {
  render(<Home />)
  
  const heading = screen.getByText(/Total Attacks \(24h\)/i)
  expect(heading).toBeDefined()
  
  const liveFeed = screen.getByText(/Live Threat Feed/i)
  expect(liveFeed).toBeDefined()
  
  const mockGlobe = screen.getByTestId('mock-globe-scene')
  expect(mockGlobe).toBeDefined()
})
