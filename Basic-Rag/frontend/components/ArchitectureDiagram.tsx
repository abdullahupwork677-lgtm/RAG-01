"use client";

import { useEffect, useRef } from "react";

type Side = "left" | "right" | "top" | "bottom";

function CSSVars(style: Record<string, string>) {
  return style as React.CSSProperties;
}

export default function ArchitectureDiagram() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;

    const draw = () => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const q = (sel: string) => canvas.querySelector<HTMLElement>(sel);
      const NS = "http://www.w3.org/2000/svg";

      const edgePoint = (el: HTMLElement, side: Side) => {
        const cr = canvas.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const cx = r.left - cr.left + r.width / 2;
        const cy = r.top - cr.top + r.height / 2;
        const x =
          side === "right"
            ? r.right - cr.left
            : side === "left"
            ? r.left - cr.left
            : cx;
        const y =
          side === "top"
            ? r.top - cr.top
            : side === "bottom"
            ? r.bottom - cr.top
            : cy;
        return [x, y] as const;
      };

      const wire = (
        a: HTMLElement,
        aSide: Side,
        b: HTMLElement,
        bSide: Side,
        color: string,
        curve?: number
      ) => {
        const [x1, y1] = edgePoint(a, aSide);
        const [x2, y2] = edgePoint(b, bSide);
        const dx = (x2 - x1) * (curve ?? 0.5);

        const path = document.createElementNS(NS, "path");
        path.setAttribute(
          "d",
          `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
        );
        path.setAttribute("class", "arch-wire");
        path.setAttribute("stroke", color);
        svg.appendChild(path);

        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("class", "pulse");
        dot.setAttribute("fill", color);
        const anim = document.createElementNS(NS, "animateMotion");
        anim.setAttribute("dur", (3 + Math.random() * 2).toFixed(1) + "s");
        anim.setAttribute("repeatCount", "indefinite");
        anim.setAttribute("path", path.getAttribute("d")!);
        dot.appendChild(anim);
        svg.appendChild(dot);
      };

      const docs = q("#docs")!;
      const ingest = q("#ingest")!;
      const vector = q("#vector")!;
      const input = q("#input")!;
      const api = q("#api")!;
      const retrieve = q("#retrieve")!;
      const generate = q("#generate")!;
      const llm = q("#llm")!;
      const out = q("#out")!;

      // offline ingestion
      wire(docs, "right", ingest, "left", "#4A4F59", 0.2);
      wire(ingest, "right", vector, "left", "#4A4F59", 0.2);
      wire(vector, "bottom", retrieve, "top", "#2FD4E8", 0);
      // live query path
      wire(input, "right", api, "left", "#C9A961", 0.5);
      wire(api, "right", retrieve, "left", "#C9A961", 0.5);
      wire(retrieve, "right", generate, "left", "#2FD4E8", 0.5);
      wire(generate, "right", llm, "left", "#2FD4E8", 0.5);
      wire(generate, "right", out, "left", "#4CD787", 0.6);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return (
    <div className="arch-wrap">
      <header className="arch-head">
        <div>
          <div className="arch-eyebrow">ChatPDF · Document Assistant</div>
          <h1>Single-Agent RAG Pipeline</h1>
        </div>
        <div className="arch-stack">
          <span>Next.js</span>
          <span>FastAPI</span>
          <span>ChromaDB</span>
          <span>SentenceTransformers</span>
          <span>Groq / gpt-oss-20b</span>
        </div>
      </header>

      <div className="arch-mobile-hint">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
        Scroll to explore
      </div>

      <div className="arch-scroll">
        <div className="arch-canvas" ref={canvasRef}>
          <svg
            ref={svgRef}
            className="arch-wires"
            viewBox="0 0 1320 900"
            preserveAspectRatio="none"
          ></svg>

          <div className="arch-lane" style={{ left: 0, top: 6 }}>
            offline · document ingestion
          </div>

          <div
            className="arch-card ghost small"
            id="docs"
            style={CSSVars({ left: "40px", top: "14px", width: "180px" })}
          >
            <div className="tag">docs/ folder</div>
            <div className="title">Source documents</div>
            <div className="sub">PDF &amp; TXT files</div>
          </div>

          <div
            className="arch-card small"
            id="ingest"
            style={CSSVars({
              left: "270px",
              top: "14px",
              "--accent": "var(--arch-muted)",
            })}
          >
            <div className="tag">ingest.py</div>
            <div className="title">Ingestion</div>
            <div className="sub">pdfplumber → chunk (500 / 50 overlap)</div>
          </div>

          <div
            className="arch-card small"
            id="vector"
            style={CSSVars({
              left: "500px",
              top: "14px",
              width: "220px",
              "--accent": "var(--arch-cyan)",
            })}
          >
            <div className="tag">Vector store</div>
            <div className="title">ChromaDB</div>
            <div className="sub">all-MiniLM-L6-v2 · 384-dim embeddings</div>
          </div>

          <div className="arch-lane" style={{ left: 0, top: 92 }}>
            live query path
          </div>

          <div
            className="arch-card input"
            id="input"
            style={CSSVars({ left: "0px", top: "320px", width: "180px" })}
          >
            <div className="tag">Next.js chat UI</div>
            <div className="title">User query</div>
            <div className="sub">&quot;What is the leave policy?&quot;</div>
          </div>

          <div
            className="arch-card small"
            id="api"
            style={CSSVars({ left: "210px", top: "314px" })}
          >
            <div className="tag">FastAPI</div>
            <div className="title">POST /rag/ask</div>
            <div className="sub">routes/rag.py → rag_service.ask()</div>
          </div>

          <div
            className="arch-hub"
            id="retrieve"
            style={CSSVars({
              left: "430px",
              top: "300px",
              "--ring-color": "var(--arch-cyan)",
            })}
          >
            <div className="arch-hub-ring"></div>
            <div className="arch-hub-core">
              <div className="tag">01</div>
              <div className="label">Retrieve</div>
            </div>
          </div>

          <div
            className="arch-hub"
            id="generate"
            style={CSSVars({
              left: "670px",
              top: "300px",
              "--ring-color": "var(--arch-gold)",
            })}
          >
            <div className="arch-hub-ring"></div>
            <div className="arch-hub-core">
              <div className="tag">02</div>
              <div className="label">Generate</div>
            </div>
          </div>

          <div
            className="arch-card small"
            id="llm"
            style={CSSVars({
              left: "880px",
              top: "100px",
              "--accent": "var(--arch-gold)",
            })}
          >
            <div className="tag">Groq LLM</div>
            <div className="title">gpt-oss-20b</div>
            <div className="sub">temperature 0.2 · grounded prompt</div>
          </div>

          <div
            className="arch-card small"
            id="out"
            style={CSSVars({
              left: "880px",
              top: "330px",
              "--accent": "var(--arch-green)",
            })}
          >
            <div className="tag">Output</div>
            <div className="title">Grounded answer</div>
            <div className="sub">answer + source citations</div>
          </div>

          <div
            className="arch-note"
            style={{ left: 400, top: 480, maxWidth: 240 }}
          >
            <b>Retrieve</b> embeds the query and pulls the{" "}
            <b>top-5</b> nearest chunks (cosine similarity). Source files are
            captured here and returned alongside the answer.
          </div>

          <div
            className="arch-note"
            style={{ left: 690, top: 480, maxWidth: 260 }}
          >
            <b>Generate</b> builds a grounded prompt and calls the LLM, which is
            instructed to answer <b>only from the retrieved context</b>: no
            hallucination.
          </div>

          <div
            className="arch-note"
            style={{ left: 0, top: 620, maxWidth: 1200 }}
          >
            <b>Data flow</b>: ingest.py runs offline to index documents into
            ChromaDB. At query time, the question is embedded and matched
            against that index; the top chunks become the context for the
            Groq model, and the answer plus its sources are returned to the
            chat UI.
          </div>
        </div>
      </div>

      <footer className="arch-foot">
        <div className="arch-legend">
          <div className="arch-legend-item">
            <span className="dot" style={{ background: "#4A4F59" }}></span>
            Offline ingestion
          </div>
          <div className="arch-legend-item">
            <span className="dot" style={{ background: "#C9A961" }}></span>
            Query / API
          </div>
          <div className="arch-legend-item">
            <span className="dot" style={{ background: "#2FD4E8" }}></span>
            Retrieval (ChromaDB)
          </div>
          <div className="arch-legend-item">
            <span className="dot" style={{ background: "#4CD787" }}></span>
            Grounded output
          </div>
        </div>
        <div>
          Answers are always grounded in the retrieved document chunks: the
          model is instructed to say &quot;I don&apos;t know&quot; when the
          context is insufficient, and every reply cites its sources.
        </div>
      </footer>
    </div>
  );
}