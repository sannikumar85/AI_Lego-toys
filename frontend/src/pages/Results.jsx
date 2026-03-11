import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getResult } from "../services/api";
import {
  ChevronLeft,
  Download,
  Share2,
  CheckCircle2,
  Package,
  Cpu,
  Box,
  Eye,
  Layers,
} from "lucide-react";
import ToyAssembly3D from "../components/3d/ToyAssembly3D";

const PART_COLORS = {
  head: "#ff6584",
  body: "#6c63ff",
  arm: "#43e97b",
  wheel: "#ffd93d",
  accessory: "#4ecdc4",
  unknown: "#a8a4ff",
};

function BoundingBoxCanvas({ imageUrl, detections }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const drawDetections = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(({ label, confidence, bbox }) => {
      if (!bbox) return;
      const [x1, y1, x2, y2] = bbox;
      const color = PART_COLORS[label] || "#a8a4ff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.fillStyle = color;
      ctx.font = "bold 14px Inter, sans-serif";
      const text = `${label} ${(confidence * 100).toFixed(0)}%`;
      const tw = ctx.measureText(text).width;
      ctx.fillRect(x1 - 1, y1 - 22, tw + 12, 22);
      ctx.fillStyle = "#000";
      ctx.fillText(text, x1 + 5, y1 - 5);
    });
  };

  return (
    <div
      className="detection-canvas-container"
      style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Toy part"
        onLoad={drawDetections}
        style={{ width: "100%", display: "block", borderRadius: 12 }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const { state } = useLocation();
  const [result, setResult] = useState(state?.result || null);
  const [loading, setLoading] = useState(!state?.result);
  const [viewMode, setViewMode] = useState("3d"); // '2d' | '3d' | 'both'

  useEffect(() => {
    if (!state?.result) {
      getResult(id)
        .then(setResult)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, state]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(108,99,255,0.2)",
            borderTop: "3px solid #6c63ff",
            borderRadius: "50%",
            animation: "spin-slow 1s linear infinite",
          }}
        />
        <p style={{ color: "#8a8ab0" }}>Loading results…</p>
      </div>
    );

  if (!result)
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#8a8ab0" }}>
        <Package size={48} style={{ marginBottom: "1rem", opacity: 0.4 }} />
        <p>Result not found.</p>
        <Link to="/" style={{ color: "#6c63ff" }}>
          ← Go back
        </Link>
      </div>
    );

  const {
    detections = [],
    predicted_toy,
    assembly_3d,
    generated_image_url,
    annotated_images = [],
    confidence_summary = {},
    processing_time,
  } = result;

  return (
    <div className="page-shell">
      <div className="page-shell__inner page-shell__inner--wide">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#8a8ab0",
              textDecoration: "none",
              fontSize: "0.9rem",
              background: "rgba(255,255,255,0.05)",
              padding: "0.7rem 1rem",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft size={16} /> Back
          </Link>
          <div style={{ flex: "1 1 360px" }}>
            <h1
              className="page-title page-title--compact"
              style={{ marginBottom: "0.35rem" }}
            >
              Detection Results
            </h1>
            {processing_time && (
              <p className="page-description" style={{ fontSize: "0.86rem" }}>
                Processed in {processing_time.toFixed(2)}s
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {annotated_images[0] && (
              <a
                href={`/api/image/${annotated_images[0]}`}
                download
                style={{ textDecoration: "none" }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.7rem 1rem",
                    borderRadius: 12,
                    background: "rgba(108,99,255,0.12)",
                    border: "1px solid rgba(108,99,255,0.3)",
                    color: "#a8a4ff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <Download size={15} /> Download
                </button>
              </a>
            )}
          </div>
        </div>

        {/* View Mode Selector */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { mode: "3d", icon: <Box size={16} />, label: "3D Assembly" },
            { mode: "2d", icon: <Eye size={16} />, label: "2D Detection" },
            { mode: "both", icon: <Layers size={16} />, label: "Both Views" },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.7rem 1.1rem",
                borderRadius: 12,
                background:
                  viewMode === mode
                    ? "rgba(108,99,255,0.2)"
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${viewMode === mode ? "rgba(108,99,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: viewMode === mode ? "#6c63ff" : "#8a8ab0",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Main Content Based on View Mode */}
        {viewMode === "3d" && (
          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontWeight: 600,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1.2rem",
              }}
            >
              <Box size={20} color="#6c63ff" /> 3D Toy Assembly
            </h2>
            <div className="glass-panel" style={{ padding: "1rem" }}>
              <ToyAssembly3D
                detections={detections}
                predictedToy={predicted_toy}
                className="h-[500px]"
              />
            </div>

            {/* Assembly Info Panel */}
            {assembly_3d && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                {/* Assembly Progress */}
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      marginBottom: "1rem",
                      color: "#6c63ff",
                      fontSize: "1rem",
                    }}
                  >
                    Assembly Status
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", color: "#8a8ab0" }}>
                        Completeness
                      </span>
                      <span
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          color: "#43e97b",
                        }}
                      >
                        {Math.round(
                          (assembly_3d.missing_parts?.assembly_completeness ||
                            0) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="conf-bar-bg">
                      <div
                        className="conf-bar-fill"
                        style={{
                          width: `${(assembly_3d.missing_parts?.assembly_completeness || 0) * 100}%`,
                          background:
                            "linear-gradient(90deg, #6c63ff, #43e97b)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        color: "#8a8ab0",
                      }}
                    >
                      <span>
                        Parts: {assembly_3d.missing_parts?.total_detected || 0}/
                        {assembly_3d.missing_parts?.total_expected || 0}
                      </span>
                      <span>Steps: {assembly_3d.total_steps || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Missing Parts */}
                {assembly_3d.missing_parts?.missing_parts?.length > 0 && (
                  <div className="glass-panel" style={{ padding: "1.5rem" }}>
                    <h3
                      style={{
                        fontWeight: 600,
                        marginBottom: "1rem",
                        color: "#ff6b6b",
                        fontSize: "1rem",
                      }}
                    >
                      Missing Parts
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {assembly_3d.missing_parts.missing_parts.map(
                        (part, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "0.4rem 0.8rem",
                              borderRadius: 8,
                              background: "rgba(255,107,107,0.15)",
                              border: "1px solid rgba(255,107,107,0.3)",
                              color: "#ff6b6b",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                            }}
                          >
                            {part}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Assembly Time */}
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      marginBottom: "1rem",
                      color: "#ffd93d",
                      fontSize: "1rem",
                    }}
                  >
                    Assembly Info
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#8a8ab0" }}>Complexity</span>
                      <span
                        style={{
                          color: "#ffd93d",
                          textTransform: "capitalize",
                        }}
                      >
                        {predicted_toy?.assembly_complexity || "Unknown"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#8a8ab0" }}>Est. Time</span>
                      <span style={{ color: "#ffd93d" }}>
                        {assembly_3d.estimated_assembly_time || 0}min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "2d" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            {/* Left: annotated images */}
            <div>
              <h2
                style={{
                  fontWeight: 600,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1.1rem",
                }}
              >
                <Cpu size={18} color="#6c63ff" /> Detected Components
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    annotated_images.length > 1 ? "1fr 1fr" : "1fr",
                  gap: "1rem",
                }}
              >
                {annotated_images.length > 0 ? (
                  annotated_images.map((imgPath, i) => (
                    <div
                      key={i}
                      className="glass-panel"
                      style={{ overflow: "hidden" }}
                    >
                      <img
                        src={`/api/image/${imgPath}`}
                        alt={`Detection ${i + 1}`}
                        style={{ width: "100%", display: "block" }}
                      />
                    </div>
                  ))
                ) : detections.length > 0 ? (
                  <div
                    className="glass-panel"
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#8a8ab0",
                    }}
                  >
                    <p>Annotated image processing…</p>
                  </div>
                ) : (
                  <div
                    className="glass-panel"
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#8a8ab0",
                    }}
                  >
                    No detections found in uploaded images.
                  </div>
                )}
              </div>
            </div>

            {/* Right: summary panel */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Predicted Toy */}
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <p
                  style={{
                    color: "#8a8ab0",
                    fontSize: "0.8rem",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Predicted Toy
                </p>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    fontFamily: "Space Grotesk, sans-serif",
                    color: "#6c63ff",
                  }}
                >
                  {predicted_toy?.name || "Unknown Toy"}
                </div>
                {predicted_toy?.confidence && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        color: "#8a8ab0",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span>Overall confidence</span>
                      <span>
                        {(predicted_toy.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="conf-bar-bg">
                      <div
                        className="conf-bar-fill"
                        style={{ width: `${predicted_toy.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {predicted_toy?.description && (
                  <p
                    style={{
                      color: "#8a8ab0",
                      fontSize: "0.82rem",
                      marginTop: "0.75rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {predicted_toy.description}
                  </p>
                )}
              </div>

              {/* Detected Parts */}
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <p
                  style={{
                    color: "#8a8ab0",
                    fontSize: "0.8rem",
                    marginBottom: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Detected Parts ({detections.length})
                </p>
                {detections.length === 0 ? (
                  <p style={{ color: "#8a8ab0", fontSize: "0.85rem" }}>
                    No parts detected. Try a clearer image.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {detections.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: PART_COLORS[d.label] || "#a8a4ff",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: "0.9rem",
                              textTransform: "capitalize",
                            }}
                          >
                            {d.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <div style={{ width: 60 }}>
                            <div className="conf-bar-bg">
                              <div
                                className="conf-bar-fill"
                                style={{ width: `${d.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#8a8ab0",
                              width: 36,
                              textAlign: "right",
                            }}
                          >
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/"
                style={{ textDecoration: "none", alignSelf: "stretch" }}
              >
                <button
                  className="btn-primary"
                  style={{ width: "100%", fontSize: "0.95rem" }}
                >
                  ← Analyze Another Toy
                </button>
              </Link>
            </div>
          </div>
        )}

        {viewMode === "both" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* 3D Assembly View */}
            <div>
              <h2
                style={{
                  fontWeight: 600,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1.2rem",
                }}
              >
                <Box size={20} color="#6c63ff" /> 3D Assembly View
              </h2>
              <div className="glass-panel" style={{ padding: "1rem" }}>
                <ToyAssembly3D
                  detections={detections}
                  predictedToy={predicted_toy}
                  className="h-[400px]"
                />
              </div>
            </div>

            {/* 2D Detection Results */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "2rem",
              }}
            >
              <div>
                <h2
                  style={{
                    fontWeight: 600,
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "1.1rem",
                  }}
                >
                  <Cpu size={18} color="#6c63ff" /> 2D Detection Results
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      annotated_images.length > 1 ? "1fr 1fr" : "1fr",
                    gap: "1rem",
                  }}
                >
                  {annotated_images.length > 0 ? (
                    annotated_images.map((imgPath, i) => (
                      <div
                        key={i}
                        className="glass-panel"
                        style={{ overflow: "hidden" }}
                      >
                        <img
                          src={`/api/image/${imgPath}`}
                          alt={`Detection ${i + 1}`}
                          style={{ width: "100%", display: "block" }}
                        />
                      </div>
                    ))
                  ) : (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#8a8ab0",
                      }}
                    >
                      <p>No detection images available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Stats Panel */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      color: "#6c63ff",
                      marginBottom: "1rem",
                    }}
                  >
                    {predicted_toy?.name || "Unknown Toy"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#8a8ab0" }}>Parts Found</span>
                      <span style={{ color: "#43e97b" }}>
                        {detections.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#8a8ab0" }}>Confidence</span>
                      <span style={{ color: "#6c63ff" }}>
                        {(predicted_toy?.confidence * 100 || 0).toFixed(0)}%
                      </span>
                    </div>
                    {assembly_3d?.missing_parts && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#8a8ab0" }}>Completeness</span>
                        <span style={{ color: "#ffd93d" }}>
                          {Math.round(
                            (assembly_3d.missing_parts.assembly_completeness ||
                              0) * 100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
