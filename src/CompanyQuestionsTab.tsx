import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Check,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CompanyQuestion {
  id: string;
  title: string;
  acceptance: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequency: number;
  url: string;
}

interface SolvedQuestion {
  questionId: string;
}

interface CompanyQuestionsTabProps {
  solved: SolvedQuestion[];
  onMarkSolved: (question: { id: string; title: string; difficulty: 'Easy' | 'Medium' | 'Hard'; category: string; url: string }) => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

const COMPANY_ICONS: Record<string, string> = {
  Google: '🔍',
  Meta: '🌐',
  Amazon: '📦',
  Microsoft: '💻',
  Apple: '🍎',
  Uber: '🚗',
  Bloomberg: '📊',
  Netflix: '🎬'
};

const CompanyQuestionsTab: React.FC<CompanyQuestionsTabProps> = ({
  solved,
  onMarkSolved,
  apiFetch,
  showToast
}) => {
  const [companies, setCompanies] = useState<string[]>(['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Uber', 'Bloomberg', 'Netflix']);
  const [selectedCompany, setSelectedCompany] = useState<string>('Google');
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCompanyQuestions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        company: selectedCompany,
        search: searchQuery,
        difficulty: filterDifficulty,
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      const res = await apiFetch(`/api/company-questions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotalCount(data.totalCount || 0);
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
        }
      } else {
        showToast('Failed to fetch company questions', 'error');
      }
    } catch (err) {
      showToast('Network error while fetching company questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyQuestions();
  }, [selectedCompany, currentPage, filterDifficulty]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCompanyQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSolved = (id: string) => solved.some(s => s.questionId === id);

  const formatFrequency = (freq: number) => {
    if (freq === 0) return 'N/A';
    if (freq > 5) return 'Very High';
    if (freq > 3) return 'High';
    if (freq > 1.5) return 'Medium';
    return 'Low';
  };

  const getFrequencyColor = (freq: number) => {
    if (freq > 5) return '#ff4d4f'; // red
    if (freq > 3) return '#ffa940'; // orange
    if (freq > 1.5) return '#ffec3d'; // yellow
    return '#52c41a'; // green
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro callout */}
      <div className="notion-callout" style={{ margin: 0, borderLeft: '3px solid var(--accent-primary)' }}>
        <span style={{ fontSize: '1.25rem' }}>🏢</span>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Top Companies Questions</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            Practice LeetCode questions sorted by frequency asked in real technical interviews at Google, Meta, Amazon, Microsoft, and more.
          </p>
        </div>
      </div>

      {/* Company Selector Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'thin'
      }}>
        {companies.map(company => (
          <button
            key={company}
            onClick={() => {
              setSelectedCompany(company);
              setCurrentPage(1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md, 6px)',
              fontSize: '0.82rem',
              fontWeight: selectedCompany === company ? 700 : 500,
              border: `1px solid ${selectedCompany === company ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background: selectedCompany === company ? 'var(--accent-primary)' : 'var(--bg-sidebar)',
              color: selectedCompany === company ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{COMPANY_ICONS[company] || '💼'}</span>
            <span>{company}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search controls */}
      <div className="notion-db-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px' }}>
          <Search size={14} className="text-muted" />
          <input
            type="text"
            placeholder={`Search ${selectedCompany} questions...`}
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: '0.85rem', boxShadow: 'none' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <select
            className="select-field"
            style={{ padding: '5px 10px', fontSize: '0.85rem' }}
            value={filterDifficulty}
            onChange={(e) => {
              setFilterDifficulty(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Table of questions */}
      <div className="table-container" style={{ position: 'relative', minHeight: '200px' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(var(--bg-app-rgb), 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading company questions...</span>
          </div>
        )}

        <table className="questions-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Done</th>
              <th style={{ width: '80px' }}>ID</th>
              <th>Question Title</th>
              <th>Acceptance</th>
              <th>Difficulty</th>
              <th>Frequency Score</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Link</th>
            </tr>
          </thead>
          <tbody>
            {questions.length > 0 ? (
              questions.map((q) => {
                const solvedStatus = isSolved(q.id);
                return (
                  <tr key={q.id}>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={solvedStatus}
                          onChange={() => onMarkSolved({
                            id: q.id,
                            title: q.title,
                            difficulty: q.difficulty,
                            category: `${selectedCompany} Asked`,
                            url: q.url
                          })}
                        />
                        <span className="checkmark">
                          {solvedStatus && <Check size={10} className="text-white" />}
                        </span>
                      </label>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        #{q.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {q.title}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {q.acceptance}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${q.difficulty.toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {formatFrequency(q.frequency)}
                        </span>
                        {q.frequency > 0 && (
                          <div style={{
                            width: '40px',
                            height: '6px',
                            background: 'var(--bg-hover)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, (q.frequency / 7) * 100)}%`,
                              height: '100%',
                              background: getFrequencyColor(q.frequency)
                            }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-ghost"
                        style={{ padding: 4 }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No questions found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} questions
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="button button-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              className="button button-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              disabled={currentPage * pageSize >= totalCount}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyQuestionsTab;
