import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#39D353",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* House shape: roof triangle + body */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* Roof — triangle via borders */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderBottom: "8px solid #080E0A",
              display: "flex",
            }}
          />
          {/* Body */}
          <div
            style={{
              width: 14,
              height: 10,
              background: "#080E0A",
              borderRadius: "0 0 2px 2px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 1,
            }}
          >
            {/* Door */}
            <div
              style={{
                width: 4,
                height: 6,
                background: "#39D353",
                borderRadius: "2px 2px 0 0",
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
