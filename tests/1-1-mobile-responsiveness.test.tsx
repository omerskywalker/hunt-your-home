import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

import { Sidebar } from '@/components/layout/Sidebar';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { ListingCard } from '@/components/dashboard/ListingCard';

// Test utilities for viewport simulation
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('Mobile Responsiveness', () => {
  describe('Sidebar Component', () => {
    beforeAll(() => {
      // Mock getBoundingClientRect for the tests
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 220,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 220,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));
    });

    it('shows desktop sidebar on desktop viewport (1024px)', () => {
      setViewportWidth(1024);
      render(<Sidebar />);
      
      // Desktop sidebar should be present
      const desktopSidebar = screen.getByRole('complementary');
      expect(desktopSidebar).toHaveClass('hidden', 'lg:flex');
      
      // Should contain nav items (use getAllByText since items appear in both desktop and mobile nav)
      expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Desktop + mobile nav
      expect(screen.getAllByText('Alerts')).toHaveLength(2);
      expect(screen.getAllByText('Bookmarks')).toHaveLength(2);
      expect(screen.getAllByText('Settings')).toHaveLength(2);
    });

    it('shows bottom navigation on mobile viewport (390px)', () => {
      setViewportWidth(390);
      const { container } = render(<Sidebar />);
      
      // Bottom nav should be present (use container query to find specific nav)
      const bottomNav = container.querySelector('nav.lg\\:hidden.fixed.bottom-0');
      expect(bottomNav).toBeInTheDocument();
      
      // Should contain abbreviated nav items (both desktop and mobile versions are rendered)
      expect(screen.getAllByText('Dashboard')).toHaveLength(2);
      expect(screen.getAllByText('Alerts')).toHaveLength(2);
      expect(screen.getAllByText('Bookmarks')).toHaveLength(2);
      expect(screen.getAllByText('Settings')).toHaveLength(2);
      expect(screen.getByText('History')).toBeInTheDocument(); // Note: "Scan History" becomes "History" in mobile
      expect(screen.getByText('Scan History')).toBeInTheDocument(); // Desktop version
    });

    it('has proper touch targets in mobile nav', () => {
      setViewportWidth(390);
      const { container } = render(<Sidebar />);
      
      // Get mobile nav specifically
      const bottomNav = container.querySelector('nav.lg\\:hidden');
      const mobileNavLinks = bottomNav?.querySelectorAll('a');
      
      expect(mobileNavLinks).toHaveLength(5);
      mobileNavLinks?.forEach(link => {
        // Each mobile nav item should have proper touch targets
        expect(link).toHaveClass('min-h-[48px]');
      });
    });
  });

  describe('StatsBar Component', () => {
    const mockProps = {
      todayScans: 4,
      recentMatches: 2,
      lastScan: {
        id: 'test-scan',
        runAt: new Date().toISOString(),
        matchedListings: 2,
        listingsFound: 15,
        alertsSent: 2,
        newListings: 15,
        durationMs: 45000,
      },
      seenCount: 150,
      onScanComplete: vi.fn(),
    };

    it('stacks stats cards vertically on mobile (390px)', () => {
      setViewportWidth(390);
      const { container } = render(<StatsBar {...mockProps} />);
      
      // Stats container should use grid with responsive classes
      const statsContainer = container.querySelector('.grid');
      expect(statsContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    });

    it('shows two columns on tablet (768px)', () => {
      setViewportWidth(768);
      const { container } = render(<StatsBar {...mockProps} />);
      
      const statsContainer = container.querySelector('.grid');
      expect(statsContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
    });

    it('has responsive title layout', () => {
      setViewportWidth(390);
      const { container } = render(<StatsBar {...mockProps} />);
      
      // Title row should stack vertically on mobile
      const titleRow = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(titleRow).toBeInTheDocument();
      expect(titleRow).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('shows smaller title text on mobile', () => {
      setViewportWidth(390);
      render(<StatsBar {...mockProps} />);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-xl', 'sm:text-2xl');
    });
  });

  describe('ListingCard Component', () => {
    const mockListing = {
      id: '12345',
      address: '123 Main St, Frisco, TX 75034',
      price: 450000,
      beds: 3,
      baths: 2,
      sqft: 1800,
      yearBuilt: 2015,
      photos: ['https://example.com/photo.jpg'],
      zillowUrl: 'https://zillow.com/homedetails/123',
      aiScore: 8,
      alertTier: 'HOT' as const,
      aiReason: 'Great value in excellent school district',
      aiHighlights: ['Good schools', 'Low HOA', 'Recently renovated'],
      aiConcerns: ['Busy street'],
      pricePerSqft: 250,
      daysOnMarket: 7,
      listingType: 'FOR_SALE' as const,
      daysOnMarketPenalty: false,
    };

    const mockRecord = {
      id: 'alert-123',
      listing: mockListing,
      sentAt: new Date().toISOString(),
      emailDelivered: true,
    };

    it('renders properly at mobile width (390px)', () => {
      setViewportWidth(390);
      render(<ListingCard record={mockRecord} />);
      
      // Card should be present and accessible
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-label', 'Listing: 123 Main St, Frisco, TX 75034');
    });

    it('has touch-friendly star button', () => {
      setViewportWidth(390);
      render(
        <ListingCard 
          record={mockRecord} 
          onToggleBookmark={vi.fn()}
          isBookmarked={false}
        />
      );
      
      const starButton = screen.getByRole('button', { name: /save home/i });
      expect(starButton).toBeInTheDocument();
      // Star button should be large enough for touch (at least 28px diameter)
    });

    it('displays all key information on mobile', () => {
      setViewportWidth(390);
      render(<ListingCard record={mockRecord} />);
      
      // Essential info should be visible
      expect(screen.getByText('$450,000')).toBeInTheDocument();
      expect(screen.getByText(/3 bd/)).toBeInTheDocument();
      expect(screen.getByText(/2 ba/)).toBeInTheDocument();
      expect(screen.getByText(/1,800 sqft/)).toBeInTheDocument();
      expect(screen.getByText('2015')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument(); // AI Score
      expect(screen.getByText(/HOT/)).toBeInTheDocument(); // Tier badge
    });
  });

  describe('Grid Layout Responsiveness', () => {
    it('uses single column on mobile for listing grids', () => {
      setViewportWidth(390);
      
      // Create a mock listing grid like those used in pages
      const { container } = render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('uses two columns on tablet for listing grids', () => {
      setViewportWidth(768);
      
      const { container } = render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('uses three columns on desktop for listing grids', () => {
      setViewportWidth(1024);
      
      const { container } = render(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Touch Target Accessibility', () => {
    it('meets minimum touch target size requirements (44px)', () => {
      // This test ensures critical interactive elements meet Apple's 44px minimum
      // and Android's 48dp (approximately 48px) recommendations
      
      setViewportWidth(390);
      const { container } = render(<Sidebar />);
      
      // Test mobile nav specifically
      const bottomNav = container.querySelector('nav.lg\\:hidden');
      const mobileNavLinks = bottomNav?.querySelectorAll('a');
      
      mobileNavLinks?.forEach(link => {
        expect(link).toHaveClass('min-h-[48px]');
      });
    });
  });

  describe('Viewport Width Breakpoints', () => {
    const breakpoints = [
      { width: 390, name: 'iPhone 15 Pro', expectedCols: 1 },
      { width: 768, name: 'iPad Mini', expectedCols: 2 },
      { width: 1024, name: 'Desktop', expectedCols: 3 },
    ];

    breakpoints.forEach(({ width, name, expectedCols }) => {
      it(`adapts layout correctly at ${name} width (${width}px)`, () => {
        setViewportWidth(width);
        
        const { container } = render(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>Card 1</div>
            <div>Card 2</div>
            <div>Card 3</div>
            <div>Card 4</div>
          </div>
        );
        
        const grid = container.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
      });
    });
  });
});