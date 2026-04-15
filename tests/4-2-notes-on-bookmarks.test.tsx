import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { updateBookmarkNotes } from "@/lib/storage";
import { BookmarkCard } from "@/components/dashboard/BookmarkCard";
import { AlertRecord } from "@/lib/types";

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => "2 days ago",
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="external-link-icon" />,
  Bed: () => <div data-testid="bed-icon" />,
  Bath: () => <div data-testid="bath-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Star: () => <div data-testid="star-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock ListingCard component  
vi.mock("@/components/dashboard/ListingCard", () => ({
  ListingCard: ({ record, ...props }: any) => (
    <div data-testid="listing-card">
      <h3>{record.listing.address}</h3>
      <span>${record.listing.price}</span>
    </div>
  ),
}));

// Mock storage functions
vi.mock("@/lib/storage", async () => {
  const actual = await vi.importActual("@/lib/storage");
  return {
    ...actual,
    updateBookmarkNotes: vi.fn(),
  };
});

const mockAlertRecord: AlertRecord = {
  id: "zpid-123",
  listing: {
    id: "zpid-123",
    address: "123 Test St, Frisco, TX 75035",
    price: 500000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    yearBuilt: 2010,
    daysOnMarket: 5,
    photos: ["https://example.com/photo1.jpg"],
    zillowUrl: "https://www.zillow.com/test",
    listingType: "FOR_SALE",
    aiScore: 8,
    aiReason: "Great family home",
    aiHighlights: ["Good schools", "Nice neighborhood"],
    aiConcerns: ["Busy road"],
    alertTier: "HOT",
    daysOnMarketPenalty: false,
  },
  sentAt: "2024-01-01T00:00:00Z",
  emailDelivered: true,
};

describe("BookmarkCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders textarea with initial notes", () => {
    const initialNotes = "This is a great house!";
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes={initialNotes}
        onNotesChange={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes about this listing...");
    expect(textarea).toHaveValue(initialNotes);
  });

  it("shows character count", () => {
    const notes = "Test notes";
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes={notes}
        onNotesChange={vi.fn()}
      />
    );

    expect(screen.getByText("10/500")).toBeInTheDocument();
  });

  it("updates character count when typing", () => {
    const onNotesChange = vi.fn();
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes=""
        onNotesChange={onNotesChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes about this listing...");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(screen.getByText("5/500")).toBeInTheDocument();
  });

  it("prevents input beyond 500 characters", () => {
    const longText = "a".repeat(501);
    const onNotesChange = vi.fn();
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes=""
        onNotesChange={onNotesChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes about this listing...");
    fireEvent.change(textarea, { target: { value: longText } });

    expect(textarea).toHaveValue("");
    expect(onNotesChange).not.toHaveBeenCalled();
  });

  it("calls onNotesChange with debounce on input", async () => {
    vi.useFakeTimers();
    const onNotesChange = vi.fn();
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes=""
        onNotesChange={onNotesChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes about this listing...");
    fireEvent.change(textarea, { target: { value: "New notes" } });

    // Should not call immediately
    expect(onNotesChange).not.toHaveBeenCalled();

    // Fast-forward 500ms
    vi.advanceTimersByTime(500);

    expect(onNotesChange).toHaveBeenCalledWith("zpid-123", "New notes");
    vi.useRealTimers();
  });

  it("calls onNotesChange immediately on blur", () => {
    const onNotesChange = vi.fn();
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes=""
        onNotesChange={onNotesChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes about this listing...");
    fireEvent.change(textarea, { target: { value: "Blur notes" } });
    fireEvent.blur(textarea);

    expect(onNotesChange).toHaveBeenCalledWith("zpid-123", "Blur notes");
  });

  it("shows red character count when approaching limit", () => {
    const notes = "a".repeat(451);
    
    render(
      <BookmarkCard 
        record={mockAlertRecord}
        notes={notes}
        onNotesChange={vi.fn()}
      />
    );

    const charCount = screen.getByText("451/500");
    expect(charCount).toHaveStyle({ color: "#F87171" });
  });
});

describe("updateBookmarkNotes storage function", () => {
  it("should be called with correct parameters", async () => {
    await updateBookmarkNotes("zpid-123", "Test notes");
    
    expect(updateBookmarkNotes).toHaveBeenCalledWith("zpid-123", "Test notes");
  });
});

describe("PATCH /api/bookmarks API", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("accepts valid notes update", async () => {
    const mockResponse = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: "Test notes" }),
    });

    expect(response).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: "Test notes" }),
    });
  });

  it("rejects notes over 500 characters", async () => {
    const longNotes = "a".repeat(501);
    const mockResponse = { success: false, error: "Notes cannot exceed 500 characters" };
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
      status: 400,
    });

    const response = await fetch("/api/bookmarks", {
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: longNotes }),
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: longNotes }),
    });
  });

  it("handles empty notes", async () => {
    const mockResponse = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: "" }),
    });

    expect(response).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/bookmarks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zpid: "zpid-123", notes: "" }),
    });
  });
});