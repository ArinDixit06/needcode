import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Check, 
  ChevronRight, 
  Code, 
  Sparkles,
  Trash2,
  Plus,
  Search
} from 'lucide-react';
import { dsaGuideSections } from './dsaGuideData';
import type { GuideSection, GuideProblem } from './dsaGuideData';

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const guideApiUrl = (path: string) => apiBaseUrl ? `${apiBaseUrl}${path}` : path;

const getCompletedTasks = (progress: unknown): Record<string, boolean> => {
  if (!progress || typeof progress !== 'object') {
    return {};
  }

  return Object.entries(progress).reduce<Record<string, boolean>>((completedTasks, [key, completed]) => {
    if (completed === true) {
      completedTasks[key] = true;
    }
    return completedTasks;
  }, {});
};

// Map topics to milestones with premium emoji representation
const MILESTONES = [
  {
    id: 'm1',
    title: 'Milestone 1: Core Essentials',
    description: 'Master array memory, character scanning, and hash-lookup scaling.',
    sectionIds: ['arrays', 'strings', 'hash-tables'],
    emoji: '📦'
  },
  {
    id: 'm2',
    title: 'Milestone 2: Linear Optimization',
    description: 'Pointers and sliding boundaries to optimize search spaces.',
    sectionIds: ['arrays', 'strings'], // Two-pointer techniques inside array/strings
    emoji: '🔍'
  },
  {
    id: 'm3',
    title: 'Milestone 3: Linear Collections',
    description: 'Master list manipulation, nesting logic (Stacks), and buffers (Queues).',
    sectionIds: ['linked-lists', 'stacks', 'queues'],
    emoji: '🔗'
  },
  {
    id: 'm4',
    title: 'Milestone 4: Hierarchies',
    description: 'Recursive trees, priority-ordering heaps, and prefix-matching tries.',
    sectionIds: ['trees', 'heaps', 'tries'],
    emoji: '🌳'
  },
  {
    id: 'm5',
    title: 'Milestone 5: Connections',
    description: 'Graph search (BFS/DFS), cycles, topological sort, and network routing.',
    sectionIds: ['graphs'],
    emoji: '🕸️'
  },
  {
    id: 'm6',
    title: 'Milestone 6: Dynamic Programming',
    description: 'Decisions with constraints, recurrence memoization, and tabulations.',
    sectionIds: ['dynamic-programming'],
    emoji: '🎯'
  },
  {
    id: 'm7',
    title: 'Milestone 7: Advanced Structures',
    description: 'Point/range query optimization and monotonic data models.',
    sectionIds: ['advanced'],
    emoji: '🚀'
  }
];

// Emojis for each data structure topic
const TOPIC_EMOJIS: Record<string, string> = {
  'arrays': '📊',
  'strings': '🔤',
  'linked-lists': '🔗',
  'stacks': '🥞',
  'queues': '⏳',
  'hash-tables': '🗝️',
  'trees': '🌳',
  'heaps': '👑',
  'tries': '🌿',
  'graphs': '🕸️',
  'dynamic-programming': '🎯',
  'advanced': '🚀'
};

interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
  description?: string;
}

interface SolvedQuestion {
  questionId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
  notes: string;
  solvedAt: string;
}

interface DsaGuideTabProps {
  solved: SolvedQuestion[];
  questions: Question[];
  onMarkSolved: (q: Question) => void;
  onDeleteSolved: (qId: string) => void;
  onStartPractice: (exerciseId: string) => void;
  onExplainPattern: (pattern: string) => void;
  onGuideProgressError: (message: string) => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export default function DsaGuideTab({
  solved,
  questions,
  onMarkSolved,
  onDeleteSolved,
  onStartPractice,
  onExplainPattern,
  onGuideProgressError,
  apiFetch
}: DsaGuideTabProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('arrays');

  // Custom Guide Problems (extended by user from 3k+ DB)
  const [customGuideProblems, setCustomGuideProblems] = useState<Record<string, GuideProblem[]>>(() => {
    try {
      const saved = localStorage.getItem('needcode_custom_guide_problems');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('needcode_custom_guide_problems', JSON.stringify(customGuideProblems));
  }, [customGuideProblems]);

  // Search & add UI states
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'manual'>('search');

  // Manual Add Form states
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [manualPattern, setManualPattern] = useState('');

  // Auto-Expanded Questions from database
  const [autoExpandedQuestions, setAutoExpandedQuestions] = useState<Question[]>([]);

  const fetchAutoExpandedQuestions = async () => {
    try {
      const queryParams = new URLSearchParams({
        difficulty: 'All',
        search: '',
        page: '1',
        limit: '150'
      });
      const response = await apiFetch(`/api/guide/auto-expand/${selectedSectionId}?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAutoExpandedQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to fetch auto-expanded questions', err);
    }
  };

  useEffect(() => {
    fetchAutoExpandedQuestions();
  }, [selectedSectionId]);

  // Helper to add a problem
  const addCustomProblem = (sectionId: string, problem: GuideProblem) => {
    setCustomGuideProblems(prev => {
      const currentList = prev[sectionId] || [];
      if (currentList.some(p => p.title.toLowerCase() === problem.title.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        [sectionId]: [...currentList, problem]
      };
    });
  };

  // Helper to remove a custom problem
  const removeCustomProblem = (sectionId: string, problemTitle: string) => {
    setCustomGuideProblems(prev => {
      const currentList = prev[sectionId] || [];
      const updatedList = currentList.filter(p => p.title.toLowerCase() !== problemTitle.toLowerCase());
      return {
        ...prev,
        [sectionId]: updatedList
      };
    });
  };

  // Check if a question is already in the guide
  const isQuestionInGuide = (qTitle: string) => {
    const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTitle = clean(qTitle);
    
    // Check in default problems
    const inDefault = activeSection?.problems.some(p => clean(p.title) === cleanTitle);
    if (inDefault) return true;
    
    // Check in custom problems
    const customList = customGuideProblems[selectedSectionId] || [];
    return customList.some(p => clean(p.title) === cleanTitle);
  };

  // Handle adding from catalog search
  const handleAddFromSearch = (q: Question) => {
    const newProblem: GuideProblem = {
      title: q.title,
      patternNote: q.category || 'General',
      difficulty: q.difficulty,
      url: q.url || `https://leetcode.com/problems/${q.id || q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
      isCustom: true
    };
    addCustomProblem(selectedSectionId, newProblem);
  };

  // Handle manual link add
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualUrl) return;
    const newProblem: GuideProblem = {
      title: manualTitle.trim(),
      patternNote: manualPattern.trim() || 'General',
      difficulty: manualDifficulty,
      url: manualUrl.trim(),
      isCustom: true
    };
    addCustomProblem(selectedSectionId, newProblem);
    setManualTitle('');
    setManualUrl('');
    setManualPattern('');
  };

  // Debounced search effect
  useEffect(() => {
    if (!guideSearchQuery || guideSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await apiFetch(`/api/questions?search=${encodeURIComponent(guideSearchQuery)}&limit=15`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.questions || []);
        }
      } catch (err) {
        console.error('Failed to search database', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guideSearchQuery]);

  const [guideCheckedTasks, setGuideCheckedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('needcode_guide_checked_tasks');
      return getCompletedTasks(saved ? JSON.parse(saved) : {});
    } catch (e) {
      return {};
    }
  });
  
  const [expandedNotesProblems, setExpandedNotesProblems] = useState<Record<string, boolean>>({});
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    'Easy': true,
    'Medium': true,
    'Hard': false
  });

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }));
  };

  useEffect(() => {
    const completedTasks = getCompletedTasks(guideCheckedTasks);
    localStorage.setItem('needcode_guide_checked_tasks', JSON.stringify(completedTasks));
  }, [guideCheckedTasks]);

  useEffect(() => {
    let cancelled = false;

    const loadGuideProgress = async () => {
      try {
        const response = await fetch(guideApiUrl('/api/guide-progress'));
        if (!response.ok) {
          throw new Error('The guide progress service returned an error.');
        }

        const completedServerTasks = getCompletedTasks(await response.json());
        const localCompletedTasks = getCompletedTasks(guideCheckedTasks);
        const mergedProgress = { ...completedServerTasks, ...localCompletedTasks };

        if (!cancelled) {
          setGuideCheckedTasks(mergedProgress);
        }

        const legacyTaskKeys = Object.keys(localCompletedTasks)
          .filter(taskKey => !completedServerTasks[taskKey]);
        await Promise.all(legacyTaskKeys.map(async taskKey => {
          const saveResponse = await fetch(guideApiUrl(`/api/guide-progress/${encodeURIComponent(taskKey)}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true })
          });
          if (!saveResponse.ok) {
            throw new Error('Could not migrate saved guide progress.');
          }
        }));
      } catch (err) {
        if (!cancelled) {
          onGuideProgressError('Could not sync roadmap progress. Your browser copy is still available.');
        }
      }
    };

    loadGuideProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTask = async (sectionId: string, taskIndex: number) => {
    const key = `${sectionId}-${taskIndex}`;
    const previousCompleted = !!guideCheckedTasks[key];
    const completed = !previousCompleted;
    setGuideCheckedTasks(prev => ({
      ...prev,
      [key]: completed
    }));

    try {
      const response = await fetch(guideApiUrl(`/api/guide-progress/${encodeURIComponent(key)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      if (!response.ok) {
        throw new Error('The guide progress service returned an error.');
      }
    } catch (err) {
      setGuideCheckedTasks(prev => ({
        ...prev,
        [key]: previousCompleted
      }));
      onGuideProgressError('Could not save roadmap progress. Please try again.');
    }
  };

  const toggleNotes = (title: string) => {
    setExpandedNotesProblems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Check if a problem is solved
  const getSolvedRecord = (problemTitle: string) => {
    const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTitle = clean(problemTitle);
    return solved.find(s => clean(s.title) === cleanTitle);
  };

  // Find a question in database catalog
  const findCatalogQuestion = (problemTitle: string) => {
    const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTitle = clean(problemTitle);
    return questions.find(q => clean(q.title) === cleanTitle);
  };

  // Check if a playground sandbox matches
  const getPlaygroundExerciseId = (title: string): string | null => {
    const t = title.toLowerCase();
    if (t.includes('valid palindrome')) return 'valid-palindrome';
    if (t.includes('valid parentheses')) return 'valid-parentheses';
    if (t.includes('reverse linked list') || t === 'reverse list') return 'reverse-linked-list';
    if (t.includes('invert binary tree')) return 'invert-binary-tree';
    if (t.includes('max sum subarray') || t.includes('maximum sum subarray')) return 'max-sum-subarray';
    if (t.includes('reverse array')) return 'reverse-array';
    return null;
  };

  const handleCheckboxChange = (prob: GuideProblem, section: GuideSection) => {
    const solvedRecord = getSolvedRecord(prob.title);
    if (solvedRecord) {
      onDeleteSolved(solvedRecord.questionId);
    } else {
      const catalogQ = findCatalogQuestion(prob.title);
      if (catalogQ) {
        onMarkSolved(catalogQ);
      } else {
        const cleanId = prob.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const virtualQ: Question = {
          id: `guide-${cleanId}`,
          title: prob.title,
          difficulty: prob.difficulty,
          category: section.title.split('. ')[1] || 'General',
          url: prob.url,
          description: prob.patternNote
        };
        onMarkSolved(virtualQ);
      }
    }
  };

  const activeSection = dsaGuideSections.find(s => s.id === selectedSectionId) || dsaGuideSections[0];
  
  // Calculate stats dynamically
  let totalProblems = 0;
  let solvedProblems = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  dsaGuideSections.forEach(sec => {
    const customList = customGuideProblems[sec.id] || [];
    totalProblems += sec.problems.length + customList.length;
    sec.problems.forEach(prob => {
      if (getSolvedRecord(prob.title)) {
        solvedProblems++;
      }
    });
    customList.forEach(prob => {
      if (getSolvedRecord(prob.title)) {
        solvedProblems++;
      }
    });

    totalTasks += sec.practiceTasks.length;
    sec.practiceTasks.forEach((_, idx) => {
      if (guideCheckedTasks[`${sec.id}-${idx}`]) {
        completedTasks++;
      }
    });
  });

  const overallProgressPercent = Math.round(
    ((solvedProblems + completedTasks) / (totalProblems + totalTasks)) * 100
  ) || 0;

  // Calculate per-section progress
  const getSectionProgress = (sec: GuideSection) => {
    const customList = customGuideProblems[sec.id] || [];
    const problemsCount = sec.problems.length + customList.length;
    let solvedCount = 0;
    sec.problems.forEach(p => {
      if (getSolvedRecord(p.title)) solvedCount++;
    });
    customList.forEach(p => {
      if (getSolvedRecord(p.title)) solvedCount++;
    });

    const tasksCount = sec.practiceTasks.length;
    let checkedTasksCount = 0;
    sec.practiceTasks.forEach((_, idx) => {
      if (guideCheckedTasks[`${sec.id}-${idx}`]) checkedTasksCount++;
    });

    const percent = Math.round(((solvedCount + checkedTasksCount) / (problemsCount + tasksCount)) * 100) || 0;
    return { solvedCount, problemsCount, checkedTasksCount, tasksCount, percent };
  };

  const activeSecProgress = getSectionProgress(activeSection);
  const activeMilestone = MILESTONES.find(m => m.sectionIds.includes(activeSection.id)) || MILESTONES[0];
  const activeMilestoneIndex = MILESTONES.findIndex(m => m.id === activeMilestone.id);

  // Check if an entire milestone is completed
  const getMilestoneStatus = (milestone: typeof MILESTONES[0]) => {
    let total = 0;
    let solved = 0;
    milestone.sectionIds.forEach(sid => {
      const sec = dsaGuideSections.find(s => s.id === sid);
      if (sec) {
        const customList = customGuideProblems[sid] || [];
        total += sec.problems.length + customList.length;
        sec.problems.forEach(p => {
          if (getSolvedRecord(p.title)) solved++;
        });
        customList.forEach(p => {
          if (getSolvedRecord(p.title)) solved++;
        });
      }
    });
    return { solved, total, isCompleted: total > 0 && solved === total };
  };

  const activeSectionCustomProblems = customGuideProblems[activeSection.id] || [];
  const activeSectionDefaultProblems = activeSection.problems || [];
  
  // Merge default problems with custom ones, marking custom ones
  const mergedProblems = [
    ...activeSectionDefaultProblems,
    ...activeSectionCustomProblems.map(p => ({ ...p, isCustom: true }))
  ];

  const renderProblemsTable = (problemsList: GuideProblem[], tierName: string) => {
    if (problemsList.length === 0) return null;
    
    const solvedCount = problemsList.filter(p => getSolvedRecord(p.title)).length;
    const isExpanded = !!expandedTiers[tierName];
    
    const curated = problemsList.filter(p => !p.isAutoExpanded);
    const expanded = problemsList.filter(p => p.isAutoExpanded);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
        {/* Tier Header Toggle */}
        <button
          type="button"
          onClick={() => toggleTier(tierName)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            padding: '6px 4px',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.82rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ChevronRight 
            size={14} 
            style={{ 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
              transition: 'transform 0.15s ease',
              color: 'var(--text-secondary)'
            }} 
          />
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--text-primary)' }}>
            {tierName} Problems
          </span>
          <span 
            className={`difficulty-badge ${tierName.toLowerCase()}`}
            style={{ fontSize: '10px', padding: '1px 5px', fontFamily: 'var(--font-mono)' }}
          >
            {solvedCount} / {problemsList.length}
          </span>
        </button>

        {/* Tier Table (Collapsible + Scrollable if large) */}
        {isExpanded && (
          <div 
            className="table-container" 
            style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              background: 'var(--bg-card)',
              maxHeight: problemsList.length > 8 ? '360px' : 'none',
              overflowY: 'auto',
              scrollbarWidth: 'thin'
            }}
          >
            <table className="problems-drill-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>Done</th>
                  <th style={{ width: '35px' }}>#</th>
                  <th>Problem Name</th>
                  <th>Difficulty</th>
                  <th>Pattern / Concept Target</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {curated.map((prob, idx) => {
                  const solvedRecord = getSolvedRecord(prob.title);
                  const isSolved = !!solvedRecord;
                  const sandboxId = getPlaygroundExerciseId(prob.title);
                  const isNotesExpanded = !!expandedNotesProblems[prob.title];

                  return (
                    <React.Fragment key={`curated-${idx}`}>
                      <tr style={{ background: isSolved ? 'rgba(47, 158, 119, 0.015)' : 'transparent' }}>
                        {/* Checklist Checkbox */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={isSolved}
                              onChange={() => handleCheckboxChange(prob, activeSection)}
                            />
                            <span className="checkmark">
                              {isSolved && <Check size={10} className="text-white" />}
                            </span>
                          </label>
                        </td>
                        
                        {/* Row Index */}
                        <td style={{ color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                          {idx + 1}
                        </td>
                        
                        {/* Title with LeetCode Link */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a 
                              href={prob.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="q-title"
                              style={{ fontWeight: 500, fontSize: '0.82rem' }}
                            >
                              {prob.title}
                            </a>
                            <a href={prob.url} target="_blank" rel="noopener noreferrer" title="View on LeetCode" style={{ display: 'inline-flex', opacity: 0.5 }}>
                              <ExternalLink size={11} className="text-secondary" />
                            </a>
                          </div>
                        </td>
                        
                        {/* Difficulty badge */}
                        <td>
                          <span className={`difficulty-badge ${prob.difficulty.toLowerCase()}`}>
                            {prob.difficulty}
                          </span>
                        </td>
                        
                        {/* Pattern Tag */}
                        <td>
                          <button
                            type="button"
                            onClick={() => onExplainPattern(prob.patternNote)}
                            className="concept-badge"
                            style={{
                              cursor: 'pointer',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-hover)',
                              textAlign: 'left',
                              display: 'inline-block',
                              transition: 'all 0.15s'
                            }}
                            title="Click to learn from brute force to optimised"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent-primary)';
                              e.currentTarget.style.color = 'var(--accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            {prob.patternNote}
                          </button>
                        </td>
                        
                        {/* Action Items */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {/* Redirect to coding editor sandbox */}
                            {sandboxId && (
                              <button
                                className="button button-ghost"
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.7rem', 
                                  color: 'var(--accent-primary)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                                onClick={() => onStartPractice(sandboxId)}
                                title="Practice in browser sandbox"
                              >
                                <Code size={11} /> Sandbox
                              </button>
                            )}

                            {/* Toggle solution notes */}
                            {isSolved && solvedRecord.notes && (
                              <button
                                type="button"
                                className="chevron-toggle"
                                onClick={() => toggleNotes(prob.title)}
                                title="View My Logged Notes"
                                style={{
                                  transform: isNotesExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                }}
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}

                            {/* Remove custom problem */}
                            {prob.isCustom && (
                              <button
                                type="button"
                                onClick={() => removeCustomProblem(activeSection.id, prob.title)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  transition: 'all 0.15s'
                                }}
                                title="Remove from guide"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#ff4d4f';
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 77, 79, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible Solution Notes (Notion-style Indent Block) */}
                      {isSolved && solvedRecord && solvedRecord.notes && isNotesExpanded && (
                        <tr>
                          <td colSpan={6} style={{ padding: '4px 12px 12px 12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="notion-notes-indent">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.72rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                <Sparkles size={11} style={{ color: 'var(--text-callout-warning)' }} /> MY LOGGED INSIGHTS:
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                                {solvedRecord.notes}
                              </p>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                                Solved on {new Date(solvedRecord.solvedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {expanded.length > 0 && (
                  <tr style={{ background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <td colSpan={6} style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      📚 Additional Practice Catalog ({expanded.length})
                    </td>
                  </tr>
                )}

                {expanded.map((prob, idx) => {
                  const solvedRecord = getSolvedRecord(prob.title);
                  const isSolved = !!solvedRecord;
                  const sandboxId = getPlaygroundExerciseId(prob.title);
                  const isNotesExpanded = !!expandedNotesProblems[prob.title];
                  const absoluteIdx = curated.length + idx;

                  return (
                    <React.Fragment key={`expanded-${idx}`}>
                      <tr style={{ background: isSolved ? 'rgba(47, 158, 119, 0.015)' : 'transparent' }}>
                        {/* Checklist Checkbox */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={isSolved}
                              onChange={() => handleCheckboxChange(prob, activeSection)}
                            />
                            <span className="checkmark">
                              {isSolved && <Check size={10} className="text-white" />}
                            </span>
                          </label>
                        </td>
                        
                        {/* Row Index */}
                        <td style={{ color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                          {absoluteIdx + 1}
                        </td>
                        
                        {/* Title with LeetCode Link */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a 
                              href={prob.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="q-title"
                              style={{ fontWeight: 500, fontSize: '0.82rem' }}
                            >
                              {prob.title}
                            </a>
                            <a href={prob.url} target="_blank" rel="noopener noreferrer" title="View on LeetCode" style={{ display: 'inline-flex', opacity: 0.5 }}>
                              <ExternalLink size={11} className="text-secondary" />
                            </a>
                          </div>
                        </td>
                        
                        {/* Difficulty badge */}
                        <td>
                          <span className={`difficulty-badge ${prob.difficulty.toLowerCase()}`}>
                            {prob.difficulty}
                          </span>
                        </td>
                        
                        {/* Pattern Tag */}
                        <td>
                          <button
                            type="button"
                            onClick={() => onExplainPattern(prob.patternNote)}
                            className="concept-badge"
                            style={{
                              cursor: 'pointer',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-hover)',
                              textAlign: 'left',
                              display: 'inline-block',
                              transition: 'all 0.15s'
                            }}
                            title="Click to learn from brute force to optimised"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent-primary)';
                              e.currentTarget.style.color = 'var(--accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            {prob.patternNote}
                          </button>
                        </td>
                        
                        {/* Action Items */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {/* Pin to core */}
                            <button
                              type="button"
                              onClick={() => {
                                const qVirtual = {
                                  id: `guide-${prob.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                                  title: prob.title,
                                  difficulty: prob.difficulty,
                                  category: activeSection.title.split('. ')[1] || 'General',
                                  url: prob.url,
                                  description: prob.patternNote
                                };
                                handleAddFromSearch(qVirtual);
                              }}
                              style={{
                                border: '1px solid var(--accent-primary)',
                                background: 'rgba(47, 158, 119, 0.08)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="Pin to core Curated Problems"
                            >
                              📌 Pin
                            </button>

                            {/* Redirect to coding editor sandbox */}
                            {sandboxId && (
                              <button
                                className="button button-ghost"
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.7rem', 
                                  color: 'var(--accent-primary)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                                onClick={() => onStartPractice(sandboxId)}
                                title="Practice in browser sandbox"
                              >
                                <Code size={11} /> Sandbox
                              </button>
                            )}

                            {/* Toggle solution notes */}
                            {isSolved && solvedRecord.notes && (
                              <button
                                type="button"
                                className="chevron-toggle"
                                onClick={() => toggleNotes(prob.title)}
                                title="View My Logged Notes"
                                style={{
                                  transform: isNotesExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                }}
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible Solution Notes (Notion-style Indent Block) */}
                      {isSolved && solvedRecord && solvedRecord.notes && isNotesExpanded && (
                        <tr>
                          <td colSpan={6} style={{ padding: '4px 12px 12px 12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="notion-notes-indent">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.72rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                <Sparkles size={11} style={{ color: 'var(--text-callout-warning)' }} /> MY LOGGED INSIGHTS:
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                                {solvedRecord.notes}
                              </p>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                                Solved on {new Date(solvedRecord.solvedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* CSS Styles for Guide Layout */}
      <style>{`
        .guide-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .guide-grid {
            grid-template-columns: 280px 1fr;
          }
        }
        
        /* Sidebar items styling */
        .guide-sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-md, 6px);
          cursor: pointer;
          transition: all 0.15s ease-out;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .guide-sidebar-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .guide-sidebar-item.active {
          background: var(--bg-hover);
          color: var(--text-primary);
          font-weight: 600;
          border-left: 2px solid var(--accent-primary);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        .guide-sidebar-item.active .icon-square {
          transform: scale(1.05);
        }

        /* Slim flat progress bar (Notion style) */
        .flat-progress-track {
          width: 100%;
          height: 2px;
          background-color: var(--border-color);
          position: relative;
          overflow: hidden;
        }
        .flat-progress-fill {
          height: 100%;
          background-color: var(--accent-primary);
          transition: width 0.3s ease-in-out;
        }
        .flat-progress-fill.completed {
          background-color: var(--tag-easy-text);
        }

        /* Task checklists */
        .task-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md, 6px);
          background: var(--bg-card);
          transition: all 0.15s ease-out;
        }
        .task-list-item:hover {
          border-color: var(--border-color-strong);
          box-shadow: var(--shadow-sm);
        }
        .task-list-item.checked {
          background: var(--bg-hover);
          border-color: var(--border-color);
          opacity: 0.75;
        }
        .task-list-item.checked .task-text {
          text-decoration: line-through;
          color: var(--text-secondary);
        }

        /* Table properties styling */
        .problems-drill-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .problems-drill-table th {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color-strong);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .problems-drill-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .problems-drill-table tr:hover td {
          background: var(--bg-hover);
        }
        
        /* Badge Tokens */
        .difficulty-badge {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          padding: 2px 6px;
          border-radius: var(--radius-sm, 4px);
          font-weight: 600;
          display: inline-block;
          text-transform: uppercase;
        }
        .difficulty-badge.easy {
          background-color: var(--tag-easy-bg);
          color: var(--tag-easy-text);
        }
        .difficulty-badge.medium {
          background-color: var(--tag-medium-bg);
          color: var(--tag-medium-text);
        }
        .difficulty-badge.hard {
          background-color: var(--tag-hard-bg);
          color: var(--tag-hard-text);
        }
        .concept-badge {
          background-color: var(--bg-hover);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 2px 6px;
          border-radius: var(--radius-sm, 4px);
          font-size: 0.72rem;
          font-weight: 500;
          display: inline-block;
        }

        /* Chevron notes toggle button */
        .chevron-toggle {
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: background-color 0.15s, transform 0.15s;
        }
        .chevron-toggle:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }

        /* Indented Notes View */
        .notion-notes-indent {
          padding: 4px 12px 12px 24px;
          border-left: 1px solid var(--border-color);
          margin-left: 12px;
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        /* Tooltip hover animations */
        .roadmap-node-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .roadmap-node-tooltip {
          position: absolute;
          bottom: 45px;
          background: var(--bg-sidebar);
          border: 1px solid var(--border-color-strong);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: var(--radius-md);
          font-size: 0.72rem;
          width: 180px;
          text-align: center;
          box-shadow: var(--shadow-md);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
          transform: translateY(5px);
          z-index: 10;
          pointer-events: none;
          line-height: 1.35;
        }
        .roadmap-node-container:hover .roadmap-node-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>

      {/* Main Roadmap Header & Stat Summary */}
      <div 
        style={{ 
          padding: '24px', 
          background: 'var(--bg-sidebar)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-lg, 8px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="icon-square icon-color-0" style={{ width: '42px', height: '42px', fontSize: '24px' }}>🗺️</div>
          <div style={{ flexGrow: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>DSA Practice & Mastery Roadmap</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px', lineHeight: '1.4' }}>
              A sequenced training curriculum. Master structural memory and operators, then drill reusable problem patterns.
            </p>
          </div>
        </div>

        {/* Global Progress Bar (Notion Style Flat Line) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Roadmap Progress</span>
            <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{overallProgressPercent}% Complete</span>
          </div>
          <div className="flat-progress-track">
            <div 
              className={`flat-progress-fill ${overallProgressPercent === 100 ? 'completed' : ''}`}
              style={{ width: `${overallProgressPercent}%` }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            <span>📋 Problems: <strong>{solvedProblems} / {totalProblems}</strong></span>
            <span>🛠️ Primitives: <strong>{completedTasks} / {totalTasks}</strong></span>
          </div>
        </div>
      </div>

      {/* Suggested Study Order Timeline Sequencer */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '24px' }}>
          Curriculum Study Timeline (Suggested Path)
        </h3>
        
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px' }}>
          {/* Background Connector Rule */}
          <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }} />
          {/* Active Connector Rule Segment */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '15px', 
              left: 0, 
              width: `${(activeMilestoneIndex / 6) * 100}%`, 
              height: '2px', 
              backgroundColor: 'var(--accent-primary)', 
              zIndex: 0, 
              transition: 'width 0.3s ease' 
            }} 
          />
          
          {/* Timeline Milestones */}
          {MILESTONES.map((milestone, idx) => {
            const status = getMilestoneStatus(milestone);
            const isActive = milestone.sectionIds.includes(selectedSectionId);

            // Color index rotation helper
            const colorClass = `icon-color-${idx % 6}`;

            return (
              <div key={milestone.id} className="roadmap-node-container">
                {/* Node Tooltip */}
                <div className="roadmap-node-tooltip">
                  <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>{milestone.title}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{milestone.description}</span>
                  <div style={{ marginTop: '4px', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                    Solved: {status.solved}/{status.total}
                  </div>
                </div>

                {/* Milestone Node */}
                <button
                  type="button"
                  onClick={() => setSelectedSectionId(milestone.sectionIds[0])}
                  className={`icon-square ${colorClass}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    fontSize: '15px',
                    position: 'relative',
                    zIndex: 1,
                    border: isActive 
                      ? '2px solid var(--accent-primary)' 
                      : status.isCompleted 
                      ? '2px solid var(--tag-easy-text)' 
                      : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 0 8px var(--accent-primary-glow)' : 'none',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {status.isCompleted ? <Check size={14} style={{ color: 'var(--tag-easy-text)' }} /> : milestone.emoji}
                </button>
                
                {/* Milestone Label */}
                <span 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: isActive ? 600 : 500, 
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    marginTop: '8px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Step {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator + Detail Panel */}
      <div className="guide-grid">
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ padding: '0 8px 4px 8px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Data Structures
          </div>
          {dsaGuideSections.map((sec, idx) => {
            const prog = getSectionProgress(sec);
            const isActive = sec.id === selectedSectionId;
            const emoji = TOPIC_EMOJIS[sec.id] || '📂';
            const colorClass = `icon-color-${idx % 6}`;

            return (
              <div 
                key={sec.id}
                className={`guide-sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedSectionId(sec.id)}
              >
                <div className={`icon-square ${colorClass}`} style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                  {emoji}
                </div>
                
                <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {sec.title.split('. ')[1]}
                    </span>
                    <span 
                      style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '10px', 
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 600 : 500
                      }}
                    >
                      {prog.solvedCount}/{prog.problemsCount}
                    </span>
                  </div>
                  {/* Slim Flat progress line */}
                  <div className="flat-progress-track" style={{ height: '1.5px', marginTop: '2px' }}>
                    <div 
                      className={`flat-progress-fill ${prog.percent === 100 ? 'completed' : ''}`} 
                      style={{ width: `${prog.percent}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Pane */}
        <div 
          style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-lg, 8px)', 
            background: 'var(--bg-sidebar)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px'
          }}
        >
          {/* Header of Active Pane */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Active topic icon */}
              <div 
                className={`icon-square icon-color-${dsaGuideSections.findIndex(s => s.id === activeSection.id) % 6}`} 
                style={{ width: '38px', height: '38px', fontSize: '20px' }}
              >
                {TOPIC_EMOJIS[activeSection.id] || '📂'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {activeMilestone.title.split(': ')[0]}
                  </span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeMilestone.title.split(': ')[1]}</span>
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {activeSection.title}
                </h2>
              </div>
            </div>

            {/* Section Progress Card (Notion Property Box Style) */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', minWidth: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Completion</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{activeSecProgress.percent}%</span>
              </div>
              <div className="flat-progress-track" style={{ height: '3px', marginTop: '6px' }}>
                <div 
                  className={`flat-progress-fill ${activeSecProgress.percent === 100 ? 'completed' : ''}`}
                  style={{ width: `${activeSecProgress.percent}%` }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                <span>Solved: {activeSecProgress.solvedCount}/{activeSecProgress.problemsCount}</span>
                <span>Tasks: {activeSecProgress.checkedTasksCount}/{activeSecProgress.tasksCount}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Structure Mastery Checklist */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>🛠️</span>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeSection.practiceTitle}
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              Build this data structure from scratch. Internalize operations and drill primitives before running LeetCode questions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSection.practiceTasks.map((task, idx) => {
                const isChecked = !!guideCheckedTasks[`${activeSection.id}-${idx}`];
                return (
                  <div 
                    key={idx} 
                    className={`task-list-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => toggleTask(activeSection.id, idx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <label className="checkbox-container" style={{ pointerEvents: 'none', margin: '2px 0 0 0' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                      />
                      <span className="checkmark">
                        {isChecked && <Check size={10} className="text-white" />}
                      </span>
                    </label>
                    <span className="task-text" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Important Problems Drill */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>📋</span>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Curated Problems (Drill in order)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              These problems teach modular, reusable strategies. Focus on implementing the specific concept signature described.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const getCombinedProblems = (tierName: string) => {
                  const curatedAndCustom = mergedProblems.filter(p => p.difficulty === tierName);
                  const autoExpanded = autoExpandedQuestions
                    .filter(q => q.difficulty === tierName && !curatedAndCustom.some(p => p.title.toLowerCase() === q.title.toLowerCase()))
                    .map(q => ({
                      title: q.title,
                      patternNote: q.category || 'General',
                      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
                      url: q.url || `https://leetcode.com/problems/${q.id || q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
                      isAutoExpanded: true
                    }));
                  return [...curatedAndCustom, ...autoExpanded];
                };

                const combinedEasy = getCombinedProblems('Easy');
                const combinedMedium = getCombinedProblems('Medium');
                const combinedHard = getCombinedProblems('Hard');

                return (
                  <>
                    {renderProblemsTable(combinedEasy, 'Easy')}
                    {renderProblemsTable(combinedMedium, 'Medium')}
                    {renderProblemsTable(combinedHard, 'Hard')}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Section 3: Expand Roadmap */}
          <div style={{ 
            borderTop: '1px dashed var(--border-color)', 
            paddingTop: '24px', 
            marginTop: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🧬</span>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Expand Roadmap ({activeSection.title.split('. ')[1]})
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Search the 3k+ database or add custom LeetCode URLs directly to this section's roadmap.
            </p>

            {/* Sub-tabs: Search Catalog vs Add manually */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-card)', padding: '2px', borderRadius: '6px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('search')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeSubTab === 'search' ? 'var(--bg-sidebar)' : 'transparent',
                  color: activeSubTab === 'search' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: activeSubTab === 'search' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Search Database
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('manual')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeSubTab === 'manual' ? 'var(--bg-sidebar)' : 'transparent',
                  color: activeSubTab === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: activeSubTab === 'manual' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Add LeetCode Link
              </button>
            </div>

            {activeSubTab === 'search' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '4px 10px' 
                }}>
                  <Search size={14} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="Search 3k+ database questions (e.g. 'Two Sum', '206')..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      padding: '4px 0'
                    }}
                    value={guideSearchQuery}
                    onChange={(e) => setGuideSearchQuery(e.target.value)}
                  />
                  {guideSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGuideSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {isSearching && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px' }}>
                    Searching database...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div style={{ 
                    maxHeight: '220px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    scrollbarWidth: 'thin'
                  }}>
                    {searchResults.map((q) => {
                      const added = isQuestionInGuide(q.title);
                      return (
                        <div 
                          key={q.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-color)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</span>
                              <span className={`difficulty-badge ${q.difficulty.toLowerCase()}`} style={{ scale: '0.85' }}>
                                {q.difficulty}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Category: {q.category || 'General'}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={added}
                            onClick={() => handleAddFromSearch(q)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: `1px solid ${added ? 'var(--border-color)' : 'var(--accent-primary)'}`,
                              background: added ? 'transparent' : 'rgba(47, 158, 119, 0.08)',
                              color: added ? 'var(--text-muted)' : 'var(--accent-primary)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: added ? 'default' : 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            {added ? 'Added' : <>+ Add</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {guideSearchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                    No matching database questions found. You can add it manually using the "Add LeetCode Link" tab.
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddManual} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Problem Title</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Subsets II"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      required
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>LeetCode URL</label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://leetcode.com/problems/..."
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      required
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty</label>
                    <select
                      className="select-field"
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value as any)}
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pattern / Concept Target</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. backtracking with duplicates"
                      value={manualPattern}
                      onChange={(e) => setManualPattern(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="button"
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add Custom Question
                </button>
              </form>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
