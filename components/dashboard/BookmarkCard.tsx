"use client";

import { useState, useEffect, useRef } from "react";
import { AlertRecord, AIScoredListing } from "@/lib/types";
import { ListingCard } from "./ListingCard";

interface BookmarkCardProps {
  record: AlertRecord;
  index?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (listing: AIScoredListing) => void;
  showSoldBanner?: boolean;
  notes?: string;
  onNotesChange?: (zpid: string, notes: string) => void;
}

export function BookmarkCard({ 
  record, 
  index, 
  isBookmarked, 
  onToggleBookmark, 
  showSoldBanner,
  notes = "",
  onNotesChange
}: BookmarkCardProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [charCount, setCharCount] = useState(notes.length);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setLocalNotes(notes);
    setCharCount(notes.length);
  }, [notes]);

  const handleNotesChange = (value: string) => {
    if (value.length > 500) return;
    
    setLocalNotes(value);
    setCharCount(value.length);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onNotesChange) {
        onNotesChange(record.listing.id, value);
      }
    }, 500);
  };

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (onNotesChange) {
      onNotesChange(record.listing.id, localNotes);
    }
  };

  return (
    <div className="space-y-3">
      <ListingCard
        record={record}
        index={index}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        showSoldBanner={showSoldBanner}
      />
      
      <div className="space-y-2">
        <textarea
          value={localNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add notes about this listing..."
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg resize-none text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{
            background: "#141C16",
            border: "1px solid #21262D",
            color: "#E6EDF3",
            fontFamily: "var(--font-inter, sans-serif)",
            minHeight: "60px",
            maxHeight: "120px",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#30363D";
            e.target.style.boxShadow = "0 0 0 2px rgba(57,211,83,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#21262D";
            e.target.style.boxShadow = "none";
            handleBlur();
          }}
        />
        
        <div className="flex justify-end">
          <span
            className="text-xs"
            style={{
              color: charCount > 450 ? "#F87171" : "#8B949E",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            {charCount}/500
          </span>
        </div>
      </div>
    </div>
  );
}