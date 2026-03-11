import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory, deleteResult } from "../services/api";
import {
  Clock,
  Trash2,
  ChevronRight,
  Package,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getHistory()
      .then((d) => setItems(d.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    try {
      await deleteResult(id);
      toast.success("Result deleted");
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="page-shell">
      <div className="page-shell__inner">
        <div className="page-header page-header--left">
          <p className="page-eyebrow">Saved sessions</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.85rem",
              flexWrap: "wrap",
            }}
          >
            <Clock size={24} color="#6c63ff" />
            <h1
              className="page-title page-title--compact"
              style={{ marginBottom: 0 }}
            >
              Detection History
            </h1>
          </div>
          <p className="page-description" style={{ maxWidth: 680 }}>
            Review previous assembly detections, reopen detailed results, and
            keep the page structure aligned with the rest of the app.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel shimmer"
                style={{ height: 108 }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              color: "#8a8ab0",
            }}
          >
            <Package size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
            <p
              style={{
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#f0f0ff",
              }}
            >
              No detections yet
            </p>
            <p style={{ fontSize: "0.92rem" }}>
              Upload your first toy part image to get started.
            </p>
            <Link
              to="/"
              style={{ display: "inline-block", marginTop: "1.5rem" }}
            >
              <button className="btn-primary">Start Building</button>
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {items.map((item) => (
              <div
                key={item._id}
                className="glass-panel"
                style={{ padding: "1.25rem 1.5rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      flex: "1 1 460px",
                      minWidth: 0,
                    }}
                  >
                    {item.annotated_images?.[0] ? (
                      <img
                        src={`/api/image/${item.annotated_images[0]}`}
                        alt=""
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(108,99,255,0.2)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 14,
                          background: "rgba(108,99,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Package size={26} color="#6c63ff" />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1.02rem",
                          marginBottom: "0.25rem",
                          color: "#f0f0ff",
                        }}
                      >
                        {item.predicted_toy?.name || "Unknown Toy"}
                      </div>
                      <div
                        style={{
                          color: "#8a8ab0",
                          fontSize: "0.82rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.detections?.length || 0} parts detected ·{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.45rem",
                          marginTop: "0.55rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {[
                          ...new Set(
                            item.detections?.map((d) => d.label) || [],
                          ),
                        ]
                          .slice(0, 4)
                          .map((l) => (
                            <span
                              key={l}
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.16rem 0.6rem",
                                borderRadius: 50,
                                background: "rgba(108,99,255,0.12)",
                                border: "1px solid rgba(108,99,255,0.2)",
                                color: "#a8a4ff",
                              }}
                            >
                              {l}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.55rem",
                      flexShrink: 0,
                      width: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Link to={`/results/${item._id}`}>
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
                          fontSize: "0.84rem",
                          fontWeight: 600,
                        }}
                      >
                        View <ChevronRight size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{
                        padding: "0.7rem",
                        borderRadius: 12,
                        background: "rgba(255,101,132,0.08)",
                        border: "1px solid rgba(255,101,132,0.2)",
                        color: "#ff6584",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
