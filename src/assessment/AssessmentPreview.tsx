import React from "react";
import type { AssessmentRecord } from "./types";
export function AssessmentPreview({ record }: { record: AssessmentRecord }) {
  return (
    <div
      dir="rtl"
      aria-label="معاينة التقويم"
      style={{
        direction: "rtl",
        fontFamily: "AssessmentArabic, Cairo, Tahoma, Arial, sans-serif",
        background: "#fff",
        color: "#172033",
        padding: "24px",
        lineHeight: 1.9,
        textAlign: "right",
        maxWidth: "794px",
        margin: "auto",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>
        التقويم
      </h1>
      {record.assessmentItems.map((item, index) => (
        <section
          key={item.id}
          style={{
            breakInside: "avoid",
            marginBottom: "24px",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>
            السؤال {index + 1}
            {item.points !== undefined ? ` (${item.points} ن)` : ""}
          </h2>
          <p style={{ margin: "10px 0" }}>{item.question}</p>
          {record.assessment.variant === "correction" ? (
            <div
              style={{
                background: "#f0fdfa",
                padding: "12px",
                borderRight: "3px solid #0f766e",
              }}
            >
              <strong>الإجابة المنتظرة</strong>
              <p>
                {item.expectedAnswer || "لم تُضف إجابة منتظرة؛ يراجعها الأستاذ."}
              </p>
            </div>
          ) : (
            <div
              aria-hidden="true"
              style={{ color: "#94a3b8", lineHeight: 2.4 }}
            >
              ................................................................................
              <br />
              ................................................................................
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
