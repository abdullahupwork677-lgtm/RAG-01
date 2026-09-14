"use client";

import { useState } from "react";
import Link from "next/link";

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-row">
          <div className="logo-mark">C</div>
          <span className="logo-word">ChatPDF</span>
        </div>

        <Link href="/chat" className="new-chat-btn">
          <span className="plus-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          New chat
        </Link>

        <div className="nav-section">
          <div className="nav-label">Chats</div>
          <div className="empty-hint">Start your first chat</div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Tools</div>
          <Link href="/chat" className="nav-item">
            <span className="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </span>
            YouTube Chat
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="signup-card">
            <p>Sign up for free to save your chat history</p>
            <Link href="/register" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
              Sign up
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <Link href="/login" className="btn-ghost btn-sm" style={{ textDecoration: "none" }}>
            Log in
          </Link>
          <Link href="/register" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
            Sign up
          </Link>
        </div>

        {/* Hero */}
        <section className="hero">
          <div className="pill-row">
            <span className="pill active">Chat</span>
            <span className="pill">Summary</span>
            <span className="pill">YouTube Chat</span>
          </div>

          <h1>
            Chat with any <span className="hl">file</span>, <span className="hl">video</span> or <span className="hl">website</span>
          </h1>

          <Link href="/chat" className="dropzone" style={{ textDecoration: "none" }}>
            <div className="dz-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="dz-title">Drop a file or <b>upload</b></div>
            <div className="dz-sub">PDF · DOC · PPT · TXT — up to 32MB</div>
          </Link>

          <div className="input-row">
            <input type="text" placeholder="Ask to start a chat" readOnly style={{ cursor: "pointer" }} onClick={() => window.location.href = "/chat"} />
            <button className="send-btn" onClick={() => window.location.href = "/chat"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
          <div className="kbd-hint"><kbd>CTRL</kbd> + <kbd>V</kbd> to paste text or links</div>

          <div className="trust-row">
            <img className="uni-logo" src="/harvard.avif" alt="Harvard University" />
            <img className="uni-logo" src="/cambridge.avif" alt="University of Cambridge" />
            <img className="uni-logo" src="/oxford.avif" alt="University of Oxford" />
            <img className="uni-logo" src="/stanford.avif" alt="Stanford University" />
          </div>

          <div className="stat-row">
            <div className="stat">
              <span className="num">10M+</span>
              <span className="lbl">Researchers &amp; users</span>
            </div>
            <div className="stat">
              <span className="num">1,000,000+</span>
              <span className="lbl">Q&apos;s answered every day</span>
            </div>
            <div className="stat">
              <span className="num">Top 50</span>
              <span className="lbl">Gen AI apps of 2024</span>
            </div>
          </div>

          <div className="quote">
            <p>&quot;It&apos;s like ChatGPT, but for research papers.&quot;</p>
            <div className="who">Mushtaq Bilal, PhD · @MushtaqBilalPhD</div>
          </div>
        </section>

        {/* Nutshell */}
        <section className="block">
          <div className="block-head">
            <div className="eyebrow">ChatPDF in a Nutshell</div>
            <h2>Your PDF AI — like ChatGPT but for PDFs.<br />Summarize and answer questions for free.</h2>
          </div>
          <div className="grid-3-col">
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3>For Researchers</h3>
              <p>Explore scientific papers, academic articles, and books to get the information you need for your research.</p>
            </div>
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3>For Students</h3>
              <p>Study for exams, get help with homework, and answer multiple choice questions faster than your classmates.</p>
            </div>
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>For Professionals</h3>
              <p>Navigate legal contracts, financial reports, manuals, and training material. Ask questions to any PDF to stay ahead.</p>
            </div>
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3>Cited Sources</h3>
              <p>Built-in citations anchor responses to PDF references. No more page-by-page searching.</p>
            </div>
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>Multi-File Chats</h3>
              <p>Create folders to organize your files and chat with multiple PDFs in one single conversation.</p>
            </div>
            <div className="feature-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3>Any Language</h3>
              <p>Works worldwide! ChatPDF accepts PDFs in any language and can chat in any language.</p>
            </div>
          </div>
        </section>

        {/* Wall of Love */}
        <section className="block">
          <div className="block-head">
            <div className="eyebrow">Wall of Love</div>
            <h2>Across borders, beyond languages: AI is revolutionizing the understanding of research worldwide.</h2>
          </div>
          <div className="tweet-grid">
            <div className="tweet-card">
              <div className="tweet-head">
                <div className="avatar" />
                <div>
                  <div className="n">森山大朗(たいろー)</div>
                  <div className="h">@tairo</div>
                </div>
              </div>
              <p>これヤバいでしょ。『ChatPDF』は生成AIを応用したサービス。難しい論文をめちゃくちゃ簡単に理解できます。</p>
              <div className="tweet-stats">1,062 Reposts · 6,137 Likes · 1M Views</div>
            </div>
            <div className="tweet-card">
              <div className="tweet-head">
                <div className="avatar" />
                <div>
                  <div className="n">Mushtaq Bilal, PhD</div>
                  <div className="h">@MushtaqBilalPhD</div>
                </div>
              </div>
              <p>ChatPDF is an AI-powered app that will make reading journal articles easier and faster. It&apos;s like ChatGPT, but for research papers.</p>
              <div className="tweet-stats">3,945 Reposts · 18.2K Likes · 2.9M Views</div>
            </div>
            <div className="tweet-card">
              <div className="tweet-head">
                <div className="avatar" />
                <div>
                  <div className="n">Wormssceo</div>
                  <div className="h">@wormssceo</div>
                </div>
              </div>
              <p>&lt;AI 툴 소개&gt; 오늘도 여러분께 유용한 AI 툴 하나를 소개해드리려고 합니다. PDF파일을 바로 요약해주는 ChatPDF입니다.</p>
              <div className="tweet-stats">558 Reposts · 755 Likes · 77K Views</div>
            </div>
          </div>
        </section>

        {/* PDF Interactions */}
        <section className="block">
          <div className="block-head">
            <div className="eyebrow">PDF Interactions Made Simple</div>
            <h2>Summarize, compare, and ask questions to any PDF. Fast and free.</h2>
          </div>
          <div className="feature-grid-stacked">
            <div className="feature-card-stacked">
              <img className="feature-img" src="/folders.avif" alt="Multi-File Chats" />
              <div className="txt">
                <h3>ORGANIZE — Multi-File Chats</h3>
                <p>Bring multiple PDFs into one conversation. Keep your study materials, papers, or project files easily accessible in one chat.</p>
              </div>
            </div>
            <div className="feature-card-stacked">
              <img className="feature-img" src="/professionals.avif" alt="Summarize PDFs" />
              <div className="txt">
                <h3>SIMPLIFY — Summarize PDFs</h3>
                <p>Summarize academic articles, research papers, or reports. Extract the key insights without reading everything.</p>
              </div>
            </div>
            <div className="feature-card-stacked">
              <img className="feature-img" src="/languages.avif" alt="Translate PDFs" />
              <div className="txt">
                <h3>UNDERSTAND — Translate PDFs</h3>
                <p>Make any PDF speak your language. Transform documents from around the world into clear, readable text you can understand instantly.</p>
              </div>
            </div>
            <div className="feature-card-stacked">
              <img className="feature-img" src="/cited-sources.avif" alt="Side-by-Side View" />
              <div className="txt">
                <h3>NAVIGATE — Side-by-Side View</h3>
                <p>Keep the chat and PDF open together. Answers are linked to the original PDF content, making it simple to verify or explore further.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="block">
          <div className="block-head">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq">
            {[
              {
                q: "What is ChatPDF and how can it help me?",
                a: "ChatPDF brings the power of conversational AI to your documents, letting you chat with your PDFs as easily as using ChatGPT. Whether you're studying, researching, or analyzing documents, our platform helps you understand and extract information in seconds.",
              },
              {
                q: "Is ChatPDF free?",
                a: "Yes! We offer a free plan that lets you analyze 2 documents every day. For power users, our Plus plan provides unlimited document analysis and more advanced features.",
              },
              {
                q: "How does ChatPDF's AI technology work?",
                a: "ChatPDF uses sophisticated AI to build a comprehensive map of your document's content and meaning, then generates clear, accurate answers with citations back to the source.",
              },
              {
                q: "Does ChatPDF support file types other than PDFs?",
                a: "Yes — PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Markdown (.md), and plain text files are all supported.",
              },
              {
                q: "Do I need to create an account to use ChatPDF?",
                a: "Yes — a free account keeps your chats, uploaded documents, and their history private to you and available across sessions. Sign up takes seconds.",
              },
              {
                q: "Is my data secure and confidential?",
                a: "Documents are protected with SSL encryption in transit and remain encrypted at rest, with full control to delete your data at any time.",
              },
            ].map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? " open" : ""}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className="chev"><ChevronDown /></span>
                </button>
                <div className="faq-a"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-row" style={{ padding: 0 }}>
              <div className="logo-mark">C</div>
              <span className="logo-word">ChatPDF</span>
            </div>
            <p>ChatPDF brings ChatGPT-style intelligence and PDF AI technology together for smarter document understanding. Summarize, chat, analyze — start now.</p>
            <div className="stars">★★★★★ <span style={{ color: "var(--text-2)", fontSize: 13 }}>4.9</span></div>
          </div>
          <div className="footer-col">
            <h4>Tools</h4>
            <ul>
              <li><Link href="/chat">Chat with PDF</Link></li>
              <li><Link href="/chat">Chat with YouTube</Link></li>
              <li><Link href="/chat">PDF Summary</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Features</h4>
            <ul>
              <li><Link href="/chat">Cited sources</Link></li>
              <li><Link href="/chat">Multi-file chats</Link></li>
              <li><Link href="/chat">Any language</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link href="/login">Log in</Link></li>
              <li><Link href="/register">Sign up</Link></li>
              <li><Link href="/forgot-password">Reset password</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 ChatPDF UI Clone — for practice/learning only</span>
          <span>Not affiliated with ChatPDF.com</span>
        </div>
      </footer>
    </>
  );
}
