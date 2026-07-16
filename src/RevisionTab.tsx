import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Brain,
  Layers,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface SolvedQuestion {
  questionId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
  notes: string;
  solvedAt: string;
  language?: string;
  timeTaken?: string;
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  keyIdentifiers: string[];
  commonProblems: string[];
  sampleTemplate: string;
}

interface RevisionTabProps {
  solved: SolvedQuestion[];
  patterns: Pattern[];
  onExplainPattern?: (pattern: string) => void;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const DIFF_COLOR: Record<string, string> = {
  Easy: 'var(--tag-easy-text)',
  Medium: 'var(--tag-medium-text)',
  Hard: 'var(--tag-hard-text)',
};

const DIFF_BG: Record<string, string> = {
  Easy: 'var(--tag-easy-bg)',
  Medium: 'var(--tag-medium-bg)',
  Hard: 'var(--tag-hard-bg)',
};

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'some time ago';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

/** Pill badge */
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color,
        background: bg,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/** Pattern Flashcard */
function PatternFlashcard({
  pattern,
  onExplain,
}: {
  pattern: Pattern;
  onExplain?: (p: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-primary)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 20px rgba(232,83,106,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-sidebar)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🧬</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {pattern.name}
          </span>
        </div>
        <button
          className="button button-ghost"
          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          onClick={() => setFlipped((f) => !f)}
        >
          {flipped ? <EyeOff size={12} /> : <Eye size={12} />}
          {flipped ? ' Hide' : ' Key IDs'}
        </button>
      </div>

      {/* Card Body */}
      <div style={{ padding: '14px 16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {pattern.description}
        </p>

        {flipped && (
          <div
            style={{
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              When to Use
            </span>
            <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {pattern.keyIdentifiers.map((ki, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {ki}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common problems */}
        <div>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Classic Problems
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {pattern.commonProblems.map((p) => (
              <span
                key={p}
                className="badge category"
                style={{ fontSize: '0.69rem', cursor: 'pointer' }}
                onClick={() => onExplain?.(p)}
                title={`Explain: ${p}`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Code toggle */}
        {pattern.sampleTemplate && (
          <div>
            <button
              className="button button-ghost"
              style={{ padding: '4px 8px', fontSize: '0.72rem', marginBottom: showCode ? '6px' : 0 }}
              onClick={() => setShowCode((s) => !s)}
            >
              {showCode ? <EyeOff size={11} /> : <Eye size={11} />}
              &nbsp;{showCode ? 'Hide Template' : 'Show Template'}
            </button>
            {showCode && (
              <pre
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.71rem',
                  fontFamily: 'JetBrains Mono, Menlo, monospace',
                  color: 'var(--text-primary)',
                  overflowX: 'auto',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  whiteSpace: 'pre',
                  lineHeight: 1.5,
                }}
              >
                <code>{pattern.sampleTemplate}</code>
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          className="button button-ghost"
          style={{
            padding: '5px 10px',
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
          }}
          onClick={() => onExplain?.(pattern.name)}
        >
          <Sparkles size={11} /> AI Deep Dive
        </button>
      </div>
    </div>
  );
}

/** Solved question card for revision */
function SolvedCard({ q, index }: { q: SolvedQuestion; index: number }) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-primary)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 20px rgba(232,83,106,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Row header */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'var(--accent-primary-glow)',
            border: '1px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 600,
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-primary)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)')
              }
            >
              {q.title}
              {q.url && <ExternalLink size={11} style={{ opacity: 0.5 }} />}
            </a>

            <Pill
              label={q.difficulty}
              color={DIFF_COLOR[q.difficulty]}
              bg={DIFF_BG[q.difficulty]}
            />
            <span className="badge category" style={{ fontSize: '0.68rem' }}>
              {q.category}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Clock size={10} /> {timeAgo(q.solvedAt)}
          </span>

          {q.notes && (
            <button
              className="button button-ghost"
              style={{ padding: '3px 7px', fontSize: '0.68rem' }}
              onClick={() => setShowNotes((s) => !s)}
            >
              {showNotes ? <EyeOff size={11} /> : <Eye size={11} />}
              {showNotes ? ' Hide' : ' Notes'}
            </button>
          )}
        </div>
      </div>

      {/* Notes section */}
      {showNotes && q.notes && (
        <div
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            background: 'var(--bg-callout)',
            borderLeft: '3px solid var(--accent-primary)',
            whiteSpace: 'pre-wrap',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {q.notes}
        </div>
      )}
    </div>
  );
}

/* ─── Flashcard Quiz ──────────────────────────────────────────────────────── */
function PatternQuiz({
  patterns,
  onExplain,
}: {
  patterns: Pattern[];
  onExplain?: (p: string) => void;
}) {
  const [shuffled, setShuffled] = useState(() => [...patterns].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = shuffled[idx];

  const next = () => {
    setRevealed(false);
    setIdx((i) => (i + 1) % shuffled.length);
  };
  const prev = () => {
    setRevealed(false);
    setIdx((i) => (i - 1 + shuffled.length) % shuffled.length);
  };
  const reshuffle = () => {
    setShuffled([...patterns].sort(() => Math.random() - 0.5));
    setIdx(0);
    setRevealed(false);
  };

  if (!current) return null;

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Quiz header */}
      <div
        style={{
          padding: '12px 18px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pattern Quiz</span>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-hover)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {idx + 1} / {shuffled.length}
          </span>
        </div>
        <button
          className="button button-ghost"
          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          onClick={reshuffle}
        >
          <RefreshCw size={11} /> Shuffle
        </button>
      </div>

      {/* Question */}
      <div
        style={{
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          minHeight: '200px',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Which pattern applies here?
        </p>
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '520px',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {current.commonProblems[0] ?? current.name}
          </p>
          {current.commonProblems[0] && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              {current.description.slice(0, 80)}...
            </p>
          )}
        </div>

        {/* Reveal */}
        {!revealed ? (
          <button
            className="button button-primary"
            style={{ padding: '8px 20px' }}
            onClick={() => setRevealed(true)}
          >
            <Eye size={14} /> Reveal Answer
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'var(--bg-callout-success)',
                border: '1px solid var(--tag-easy-text)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--tag-easy-text)',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              <CheckCircle2 size={16} /> {current.name}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6 }}>
              {current.description}
            </p>
            <button
              className="button button-ghost"
              style={{ padding: '4px 12px', fontSize: '0.75rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
              onClick={() => onExplain?.(current.name)}
            >
              <Sparkles size={11} /> AI Explain
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <button className="button button-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={prev}>
          <ChevronLeft size={14} /> Prev
        </button>
        <button className="button button-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={next}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
const RevisionTab: React.FC<RevisionTabProps> = ({ solved, patterns, onExplainPattern }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'problems' | 'patterns' | 'quiz'>(
    'overview',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiff, setFilterDiff] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [filterCat, setFilterCat] = useState('All');

  /* Derived stats */
  const stats = useMemo(() => {
    const easy = solved.filter((s) => s.difficulty === 'Easy').length;
    const medium = solved.filter((s) => s.difficulty === 'Medium').length;
    const hard = solved.filter((s) => s.difficulty === 'Hard').length;
    const cats = Array.from(new Set(solved.map((s) => s.category)));
    const withNotes = solved.filter((s) => s.notes?.trim()).length;
    return { easy, medium, hard, total: solved.length, cats, withNotes };
  }, [solved]);

  /* Categories for filter */
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(solved.map((s) => s.category))).sort()],
    [solved],
  );

  /* Filtered & sorted solved list — most recent first */
  const filteredSolved = useMemo(() => {
    return solved
      .filter((s) => {
        const matchQ = s.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchD = filterDiff === 'All' || s.difficulty === filterDiff;
        const matchC = filterCat === 'All' || s.category === filterCat;
        return matchQ && matchD && matchC;
      })
      .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());
  }, [solved, searchQuery, filterDiff, filterCat]);

  /* ── Section pills */
  const sections = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={13} /> },
    { id: 'problems', label: `Solved (${solved.length})`, icon: <CheckCircle2 size={13} /> },
    { id: 'patterns', label: `Patterns (${patterns.length})`, icon: <Layers size={13} /> },
    { id: 'quiz', label: 'Pattern Quiz', icon: <Brain size={13} /> },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro callout */}
      <div
        className="notion-callout"
        style={{ margin: 0, borderLeft: '3px solid var(--accent-primary)' }}
      >
        <span style={{ fontSize: '1.25rem' }}>🔁</span>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Revision Hub</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            Spaced repetition for your solved problems and algorithm patterns. Review your notes,
            quiz yourself on patterns, and reinforce long-term retention.
          </p>
        </div>
      </div>

      {/* Section switcher */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: activeSection === s.id ? 700 : 500,
              border: `1px solid ${activeSection === s.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background:
                activeSection === s.id ? 'var(--accent-primary)' : 'var(--bg-sidebar)',
              color: activeSection === s.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────── */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              { label: 'Total Solved', value: stats.total, icon: '✅', accent: 'var(--accent-primary)' },
              { label: 'Easy', value: stats.easy, icon: '🟢', accent: 'var(--tag-easy-text)' },
              { label: 'Medium', value: stats.medium, icon: '🟡', accent: 'var(--tag-medium-text)' },
              { label: 'Hard', value: stats.hard, icon: '🔴', accent: 'var(--tag-hard-text)' },
              { label: 'With Notes', value: stats.withNotes, icon: '📝', accent: 'var(--accent-primary)' },
              { label: 'Categories', value: stats.cats.length, icon: '🗂️', accent: 'var(--accent-primary)' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: s.accent, lineHeight: 1 }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {stats.cats.length > 0 && (
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                padding: '16px',
              }}
            >
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
                Progress by Category
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.cats.map((cat) => {
                  const count = solved.filter((s) => s.category === cat).length;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontSize: '0.77rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {cat}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {count} solved
                        </span>
                      </div>
                      <div
                        style={{
                          height: '5px',
                          borderRadius: '999px',
                          background: 'var(--bg-hover)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--accent-primary)',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="button button-primary"
              style={{ padding: '8px 16px' }}
              onClick={() => setActiveSection('problems')}
            >
              <BookOpen size={14} /> Review Solved Problems
            </button>
            <button
              className="button button-secondary"
              style={{ padding: '8px 16px' }}
              onClick={() => setActiveSection('quiz')}
            >
              <Brain size={14} /> Take Pattern Quiz
            </button>
          </div>

          {solved.length === 0 && (
            <div
              className="notion-callout"
              style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px', gap: '8px' }}
            >
              <span style={{ fontSize: '2.5rem' }}>📭</span>
              <h4 style={{ fontWeight: 600 }}>Nothing to Revise Yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '420px' }}>
                Head to the Curriculum or AI Path tab and mark some questions as solved. Your
                revision sessions will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Solved Problems list ─────────────────────────── */}
      {activeSection === 'problems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                flexGrow: 1,
                minWidth: '160px',
              }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '2px 0',
                  fontSize: '0.83rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <select
              className="select-field"
              style={{ padding: '5px 8px', fontSize: '0.83rem' }}
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value as typeof filterDiff)}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              className="select-field"
              style={{ padding: '5px 8px', fontSize: '0.83rem' }}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(searchQuery || filterDiff !== 'All' || filterCat !== 'All') && (
              <button
                className="button button-ghost"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                onClick={() => {
                  setSearchQuery('');
                  setFilterDiff('All');
                  setFilterCat('All');
                }}
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {filteredSolved.length} problem{filteredSolved.length !== 1 ? 's' : ''} · sorted by most recent
          </p>

          {filteredSolved.length === 0 ? (
            <div
              className="notion-callout"
              style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px', gap: '8px' }}
            >
              <span style={{ fontSize: '2rem' }}>🔎</span>
              <p style={{ fontWeight: 600 }}>No matching problems</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                Try adjusting the filters above.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSolved.map((q, i) => (
                <SolvedCard key={q.questionId} q={q} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Patterns board ──────────────────────────────── */}
      {activeSection === 'patterns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {patterns.length === 0 ? (
            <div
              className="notion-callout"
              style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px', gap: '8px' }}
            >
              <span style={{ fontSize: '2rem' }}>🧬</span>
              <p style={{ fontWeight: 600 }}>No patterns loaded</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                Visit the Coding Patterns tab first — patterns will appear here once loaded.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '14px',
              }}
            >
              {patterns.map((p) => (
                <PatternFlashcard key={p.id} pattern={p} onExplain={onExplainPattern} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quiz ─────────────────────────────────────────── */}
      {activeSection === 'quiz' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {patterns.length === 0 ? (
            <div
              className="notion-callout"
              style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px', gap: '8px' }}
            >
              <span style={{ fontSize: '2rem' }}>🧠</span>
              <p style={{ fontWeight: 600 }}>No patterns to quiz</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                Visit Coding Patterns tab first to load patterns, then come back here.
              </p>
            </div>
          ) : (
            <PatternQuiz patterns={patterns} onExplain={onExplainPattern} />
          )}

          {/* Tip */}
          <div className="notion-callout info" style={{ margin: 0 }}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Tip:</strong> Try to recall the pattern before revealing the answer. After
              revealing, click <em>AI Explain</em> to get a deep breakdown with examples.
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animation (injected once) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RevisionTab;
