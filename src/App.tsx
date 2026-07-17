import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import DsaGuideTab from './DsaGuideTab';
import RevisionTab from './RevisionTab';
import CompanyQuestionsTab from './CompanyQuestionsTab';
import { dsaGuideSections } from './dsaGuideData';
import { 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Search, 
  MessageSquare, 
  Loader2,
  TrendingUp,
  HelpCircle,
  X,
  Code,
  BookOpen,
  Award,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

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
  language?: string;
  timeTaken?: string;
}

interface Recommendation {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
  reason: string;
}

interface DsaStructure {
  id: string;
  name: string;
  status: 'Not Started' | 'Learning' | 'Mastered';
  notes: string;
}

interface ExplanationResponse {
  hintOnly?: boolean;
  conceptName: string;
  patternTag?: string;
  personalizedInsight?: string;
  constraintReading?: string;
  bruteForceOptimizedBridge?: string;
  dryRunTrace?: string;
  complexity?: string;
  pitfalls?: string[];
  codeImplementation?: string;
  followUpVariations?: string[];
  transferability?: string[];
  nextRecommendedProblem?: string;
  // Legacy fields
  explanation?: string;
  keyPatterns?: string[];
}

interface LearnMessage {
  role: 'user' | 'assistant';
  content: string;
}

const formatJump = (val: number) => {
  if (val === 0) return '0';
  const prefix = val > 0 ? '▲' : '▼';
  const absVal = Math.abs(val);
  let text = '';
  if (absVal >= 1000000) {
    text = (absVal / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absVal >= 1000) {
    text = (absVal / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    text = absVal.toLocaleString();
  }
  return `${prefix}${text}`;
};

const getJumpColor = (val: number) => {
  if (val > 0) return '#10b981'; // Emerald Green
  if (val < 0) return '#f43f5e'; // Rose Red
  return 'var(--text-secondary)';
};

function LoadingDots({ label }: { label: string }) {
  return (
    <div className="loading-dots" role="status" aria-live="polite">
      <span className="loading-dots-label">{label}</span>
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </div>
  );
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const apiFetch = (path: string, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  const sessionToken = sessionStorage.getItem('needcode_session_token');
  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }
  return fetch(apiBaseUrl ? `${apiBaseUrl}${path}` : path, { ...init, headers });
};

class ListNode {
  val: any;
  next: ListNode | null;
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

class TreeNode {
  val: any;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function arrayToLinkedList(arr: any[]) {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function linkedListToArray(head: ListNode | null) {
  const arr = [];
  let curr = head;
  while (curr) {
    arr.push(curr.val);
    curr = curr.next;
  }
  return arr;
}

function arrayToBinaryTree(arr: any[]) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const curr = queue.shift();
    if (curr) {
      if (arr[i] !== null && arr[i] !== undefined) {
        curr.left = new TreeNode(arr[i]);
        queue.push(curr.left);
      }
      i++;
      if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
        curr.right = new TreeNode(arr[i]);
        queue.push(curr.right);
      }
      i++;
    }
  }
  return root;
}

function binaryTreeToArray(root: TreeNode | null) {
  if (!root) return [];
  const arr = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr) {
      arr.push(curr.val);
      queue.push(curr.left);
      queue.push(curr.right);
    } else {
      arr.push(null);
    }
  }
  while (arr.length > 0 && arr[arr.length - 1] === null) {
    arr.pop();
  }
  return arr;
}

const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let k of keysA) {
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
};

const transpileCppToJs = (cppCode: string): string => {
  let js = cppCode;
  
  // 1. Remove preprocessor directives and namespace declarations
  js = js.replace(/#include\s+<.*?>/g, '');
  js = js.replace(/using\s+namespace\s+std;/g, '');

  // 2. Transpile C++ function signatures FIRST (before converting types to let)
  js = js.replace(/\b(vector<[a-z0-9_<>]+>|int|bool|ListNode\s*\*|TreeNode\s*\*|void|string)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/gi, (match, _retType, fnName, argsStr) => {
    if (['if', 'while', 'for', 'switch'].includes(fnName)) return match;
    
    let cleanArgs = '';
    if (argsStr.trim()) {
      cleanArgs = argsStr.split(',').map((arg: string) => {
        let parts = arg.trim().split(/\s+/);
        let name = parts[parts.length - 1]; // last word
        return name.replace(/[&*]/g, '').trim(); // remove pointer/ref characters
      }).join(', ');
    }
    return `function ${fnName}(${cleanArgs})`;
  });
  
  // 3. Transpile C++ swap(a, b) -> [a, b] = [b, a]
  js = js.replace(/swap\(\s*([^,]+)\s*,\s*([^)]+)\)/g, '[$1, $2] = [$2, $1]');
  
  // 4. Pointers: node->next -> node.next
  js = js.replace(/->/g, '.');
  
  // 5. nullptr -> null
  js = js.replace(/\bnullptr\b/g, 'null');
  
  // 6. C++ Stack helpers
  // stack.empty() -> stack.length === 0
  js = js.replace(/(\w+)\.empty\(\)/g, '($1.length === 0)');
  // stack.top() -> stack[stack.length - 1]
  js = js.replace(/(\w+)\.top\(\)/g, '$1[$1.length - 1]');
  
  // 7. size() -> length
  js = js.replace(/\.size\(\)/g, '.length');
  
  // 8. push_back -> push
  js = js.replace(/\.push_back\(/g, '.push(');
  
  // 9. Convert C++ variable declarations to JS let
  // a. vectors: vector<int> name; -> let name = [];
  js = js.replace(/\bvector<[a-z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*;/gi, 'let $1 = [];');
  js = js.replace(/\bvector<[a-z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*=/gi, 'let $1 =');

  // b. stacks: stack<char> name; -> let name = [];
  js = js.replace(/\bstack<[a-z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*;/gi, 'let $1 = [];');
  js = js.replace(/\bstack<[a-z0-9_<>]+>\s+([a-zA-Z0-9_]+)\s*=/gi, 'let $1 =');

  // c. pointers: ListNode* name = val -> let name = val
  js = js.replace(/\b(ListNode|TreeNode)\s*\*\s*([a-zA-Z0-9_]+)\b/g, 'let $2');

  // d. primitives: int left = 0 -> let left = 0
  js = js.replace(/\b(int|float|double|char|bool|string|auto)\s+([a-zA-Z0-9_]+)\b/g, 'let $2');

  return js;
};

const executeUserCode = (userCode: string, fnName: string, inputArgs: any[], specialType?: string) => {
  const args = JSON.parse(JSON.stringify(inputArgs));
  if (specialType === 'LinkedList') {
    args[0] = arrayToLinkedList(args[0]);
  } else if (specialType === 'BinaryTree') {
    args[0] = arrayToBinaryTree(args[0]);
  }

  const runFn = new Function(
    'ListNode',
    'TreeNode',
    'arrayToLinkedList',
    'linkedListToArray',
    'arrayToBinaryTree',
    'binaryTreeToArray',
    `
      ${userCode}
      return ${fnName}.apply(null, arguments);
    `
  );

  let result = runFn(
    ListNode,
    TreeNode,
    arrayToLinkedList,
    linkedListToArray,
    arrayToBinaryTree,
    binaryTreeToArray,
    ...args
  );

  if (specialType === 'LinkedList') {
    result = linkedListToArray(result);
  } else if (specialType === 'BinaryTree') {
    result = binaryTreeToArray(result);
  }

  return result;
};

const MODELS = [
  { id: 'openrouter/free', name: 'Auto Free Router (Recommended)' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)' },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)' },
];

const SUGGESTIONS = ["Trie", "Segment Tree", "AVL Tree", "Dijkstra's Algorithm", "Monotonic Stack", "LRU Cache", "Binary Search"];

const TOPIC_ICONS: Record<string, string> = {
  'arrays': '📊',
  'two-pointers': '🔍',
  'sliding-window': '🪟',
  'stacks-queues': '🥞',
  'linked-lists': '🔗',
  'binary-search': '🔎',
  'trees': '🌳',
  'heaps': '👑',
  'backtracking': '↩️',
  'graphs': '🕸️',
  'advanced-graphs': '🛣️',
  'dynamic-programming': '🎯',
  'greedy': '💰',
  'bit-manipulation': '🔌'
};

const getActiveTabName = (tab: string) => {
  switch(tab) {
    case 'recs': return 'AI Path';
    case 'catalog': return 'Curriculum';
    case 'solved': return 'Solved Logbook';
    case 'learn': return 'AI Explainer';
    case 'practice': return 'DSA Practice';
    case 'patterns': return 'Coding Patterns';
    case 'revision': return 'Revision Hub';
    case 'companies': return 'Top Companies';
    default: return 'Workspace';
  }
};

const getPageEmoji = (tab: string) => {
  switch(tab) {
    case 'recs': return '🎯';
    case 'catalog': return '📚';
    case 'guide': return '🗺️';
    case 'solved': return '✍️';
    case 'learn': return '🧠';
    case 'practice': return '⚡';
    case 'patterns': return '🧬';
    case 'revision': return '🔁';
    case 'companies': return '🏢';
    default: return '📂';
  }
};

const getPageTitle = (tab: string) => {
  switch(tab) {
    case 'recs': return 'AI Recommendations';
    case 'catalog': return 'LeetCode Curriculum';
    case 'guide': return 'DSA Study Guide & Roadmap';
    case 'solved': return 'Solved Logbook';
    case 'learn': return 'AI Study Companion';
    case 'practice': return 'DSA Practice Lab';
    case 'patterns': return 'Common Algorithm Patterns';
    case 'revision': return 'Revision Hub';
    case 'companies': return 'Top Companies';
    default: return 'NeedCode Workspace';
  }
};

const getPageSubtitle = (tab: string) => {
  switch(tab) {
    case 'recs': return 'Generate smart LeetCode recommendations based on your solved history and master your gaps.';
    case 'catalog': return 'Browse standard DSA problem lists, search, filter by topic or difficulty, and track your progress.';
    case 'guide': return 'Master each data structure from scratch, and drill the highly curated problem lists in order.';
    case 'solved': return 'Review your solved question notes, intuition writeups, timestamps, and confidence ratings.';
    case 'learn': return 'Your interactive AI console for deep diving into algorithms, data structures, and optimal code patterns.';
    case 'practice': return 'Solve hands-on exercises in the browser for Arrays, Lists, Trees, Stacks, and more to test your muscle memory.';
    case 'patterns': return 'Explore common design patterns tested in technical interviews, including templates and when to use them.';
    case 'revision': return 'Spaced-repetition review of your solved problems and algorithm patterns. Flashcards, notes, and a pattern quiz to lock in muscle memory.';
    case 'companies': return 'Practice questions grouped by frequency asked in real technical interviews at Google, Meta, Amazon, Microsoft, and more.';
    default: return '';
  }
};

function App() {
  // Lists
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solved, setSolved] = useState<SolvedQuestion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dsaStructures, setDsaStructures] = useState<DsaStructure[]>([]);
  
  // Catalog metadata for server-side pagination and filters scaling
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [metaStats, setMetaStats] = useState({ totalCount: 0, easyCount: 0, mediumCount: 0, hardCount: 0 });

  // UI states
  const [activeTab, setActiveTab] = useState<'recs' | 'catalog' | 'solved' | 'learn' | 'practice' | 'patterns' | 'guide' | 'revision' | 'companies'>(() => {
    return (localStorage.getItem('needcode_active_tab') as any) || 'recs';
  });
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [recsLoading, setRecsLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Exercises & Patterns States
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [exerciseCode, setExerciseCode] = useState('');
  const [runResults, setRunResults] = useState<any | null>(null);
  const [patternsList, setPatternsList] = useState<any[]>([]);
  const [exerciseSubmitting, setExerciseSubmitting] = useState(false);
  const [tutorialTab, setTutorialTab] = useState<'problem' | 'concept' | 'walkthrough' | 'trace'>('problem');
  const [editorLanguage, setEditorLanguage] = useState<'javascript' | 'cpp'>(() => {
    return (localStorage.getItem('needcode_editor_language') as any) || 'javascript';
  });
  // LeetCode Integration
  const [lcProfile, setLcProfile] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Notion Layout & Theme States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(() => localStorage.getItem('needcode_analytics_open') !== 'false');
  const [settingsOpen, setSettingsOpen] = useState(() => localStorage.getItem('needcode_settings_open') !== 'false');
  const [leetcodeOpen, setLeetcodeOpen] = useState(() => localStorage.getItem('needcode_leetcode_open') !== 'false');

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('needcode_catalog_search') || '');
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('needcode_catalog_category') || 'All');
  const [filterDifficulty, setFilterDifficulty] = useState(() => localStorage.getItem('needcode_catalog_difficulty') || 'All');
  const [patternSearch, setPatternSearch] = useState('');
  const [patternSearchResults, setPatternSearchResults] = useState<any[] | null>(null);
  const [patternSearchLoading, setPatternSearchLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(() => Number(localStorage.getItem('needcode_catalog_page')) || 1);
  const [pageSize, setPageSize] = useState(() => Number(localStorage.getItem('needcode_catalog_pagesize')) || 15);  // API Config
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [hasServerApiKey, setHasServerApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('needcode_selected_model') || MODELS[0].id);
  const [customInstruction, setCustomInstruction] = useState(() => localStorage.getItem('needcode_custom_instruction') || '');

  // AI Study Companion States
  const [explainTopic, setExplainTopic] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainSuggestions, setExplainSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!explainTopic.trim() || explainTopic.length < 2) {
      setExplainSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/questions?search=${encodeURIComponent(explainTopic)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setExplainSuggestions(data.questions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [explainTopic]);
  const [hintLoading, setHintLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [learnConversation, setLearnConversation] = useState<LearnMessage[]>([]);
  const [selectedDsaToEdit, setSelectedDsaToEdit] = useState<DsaStructure | null>(null);
  const [dsaNotesText, setDsaNotesText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [solvingQuestion, setSolvingQuestion] = useState<Question | null>(null);
  const [notes, setNotes] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  
  // Add Custom Question form
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [customUrl, setCustomUrl] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Fetch initial data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiFetch('/api/auth/status');
        const status = await response.json();
        setIsAuthenticated(status.authenticated === true);
      } catch {
        setPasswordError('Unable to reach the server. Please try again.');
      } finally {
        setAuthChecking(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const init = async () => {
      await fetchData();
      const config = await fetchConfig();
      await fetchLeetCodeProfile();
      await fetchDsaStructures();
      
      // Auto-sync silently if username is set in backend .env
      if (config && config.leetcodeUsername) {
        silentSyncLeetCode();
      }
    };
    init();
  }, [isAuthenticated]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDifficulty]);

  const fetchRecommendations = async () => {
    try {
      const res = await apiFetch('/api/recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data || []);
      }
    } catch (err) {
      // Fail silently
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/questions/stats');
      if (res.ok) {
        const data = await res.json();
        setTotalCatalogCount(data.totalCount || 0);
        setCategories(data.categories || ['All']);
        setMetaStats({
          totalCount: data.totalCount || 0,
          easyCount: data.easyCount || 0,
          mediumCount: data.mediumCount || 0,
          hardCount: data.hardCount || 0
        });
      }
    } catch (err) {
      // Fail silently
    }
  };

  const fetchCatalog = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        category: filterCategory,
        difficulty: filterDifficulty
      });
      const res = await apiFetch(`/api/questions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotalCatalogCount(data.totalCount || 0);
      }
    } catch (err) {
      // Fail silently
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await apiFetch('/api/exercises');
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
        // If there's an active selected exercise, update it, otherwise check localStorage or set the first one
        if (data.length > 0) {
          const savedId = localStorage.getItem('needcode_selected_exercise_id');
          const saved = savedId ? data.find((e: any) => e.id === savedId) : null;
          const current = selectedExercise ? data.find((e: any) => e.id === selectedExercise.id) : null;
          
          if (current) {
            setSelectedExercise(current);
          } else if (saved) {
            setSelectedExercise(saved);
          } else if (!selectedExercise) {
            setSelectedExercise(data[0]);
          }
        }
      }
    } catch (err) {
      // Fail silently
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      const draftKey = `needcode_draft_${selectedExercise.id}_${editorLanguage}`;
      const draft = localStorage.getItem(draftKey);
      if (draft !== null) {
        setExerciseCode(draft);
      } else {
        const code = editorLanguage === 'javascript'
          ? (selectedExercise.submittedCodeJS || selectedExercise.starterCode)
          : (selectedExercise.submittedCodeCPP || selectedExercise.starterCodeCpp || '');
        setExerciseCode(code || '');
      }
      setRunResults(null);
    }
  }, [editorLanguage, selectedExercise?.id]);

  // Caching synchronization hooks
  useEffect(() => {
    localStorage.setItem('needcode_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('needcode_catalog_page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('needcode_catalog_pagesize', pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    localStorage.setItem('needcode_catalog_category', filterCategory);
  }, [filterCategory]);

  useEffect(() => {
    localStorage.setItem('needcode_catalog_difficulty', filterDifficulty);
  }, [filterDifficulty]);

  useEffect(() => {
    localStorage.setItem('needcode_catalog_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('needcode_editor_language', editorLanguage);
  }, [editorLanguage]);

  useEffect(() => {
    if (selectedExercise) {
      localStorage.setItem('needcode_selected_exercise_id', selectedExercise.id);
    }
  }, [selectedExercise?.id]);

  useEffect(() => {
    localStorage.setItem('needcode_analytics_open', analyticsOpen.toString());
  }, [analyticsOpen]);

  useEffect(() => {
    localStorage.setItem('needcode_settings_open', settingsOpen.toString());
  }, [settingsOpen]);

  useEffect(() => {
    localStorage.setItem('needcode_leetcode_open', leetcodeOpen.toString());
  }, [leetcodeOpen]);

  useEffect(() => {
    localStorage.setItem('needcode_selected_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('needcode_custom_instruction', customInstruction);
  }, [customInstruction]);

  const fetchPatterns = async () => {
    try {
      const res = await apiFetch('/api/patterns');
      if (res.ok) {
        const data = await res.json();
        setPatternsList(data);
      }
    } catch (err) {
      // Fail silently
    }
  };

  const handleRunTests = async (isSubmit: boolean = false) => {
    if (!selectedExercise) return;
    
    setExerciseSubmitting(isSubmit);
    let passedCount = 0;
    const testCasesList = selectedExercise.testCases || [];
    const resultsList = [];
    let runtimeError = null;

    // Detect function name from starter code based on language
    let fnName = '';
    if (editorLanguage === 'javascript') {
      const fnMatch = selectedExercise.starterCode.match(/function\s+([a-zA-Z0-9_]+)/);
      fnName = fnMatch ? fnMatch[1] : '';
    } else {
      const fnMatch = selectedExercise.starterCodeCpp.match(/\b([a-zA-Z0-9_]+)\s*\(/);
      fnName = fnMatch ? fnMatch[1] : '';
    }

    if (!fnName) {
      showToast('Could not find function name in starter code.', 'error');
      setExerciseSubmitting(false);
      return;
    }

    // Wait a brief tick for UI to show loading state
    await new Promise(r => setTimeout(r, 100));

    for (let idx = 0; idx < testCasesList.length; idx++) {
      const tc = testCasesList[idx];
      try {
        let result;
        if (editorLanguage === 'javascript') {
          result = executeUserCode(exerciseCode, fnName, tc.input, tc.specialType || selectedExercise.specialType);
        } else {
          const transpiled = transpileCppToJs(exerciseCode);
          result = executeUserCode(transpiled, fnName, tc.input, tc.specialType || selectedExercise.specialType);
        }
        const passed = deepEqual(result, tc.expected);
        if (passed) passedCount++;

        resultsList.push({
          index: idx + 1,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: JSON.stringify(result),
          passed
        });
      } catch (err: any) {
        runtimeError = err.message || String(err);
        resultsList.push({
          index: idx + 1,
          input: JSON.stringify(tc.input),
          expected: JSON.stringify(tc.expected),
          actual: `Error: ${runtimeError}`,
          passed: false
        });
      }
    }

    const allPassed = passedCount === testCasesList.length;
    const status = allPassed ? 'Passed' : 'Failed';

    setRunResults({
      results: resultsList,
      passedCount,
      totalCount: testCasesList.length,
      allPassed,
      runtimeError
    });

    if (isSubmit) {
      try {
        const res = await apiFetch('/api/exercises/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: selectedExercise.id,
            code: exerciseCode,
            status,
            language: editorLanguage
          })
        });
        if (res.ok) {
          showToast(
            allPassed 
              ? `Accepted! "${selectedExercise.title}" solved successfully.` 
              : `Submitted. Some tests failed. Keep debugging!`,
            allPassed ? 'success' : 'error'
          );
          // Refresh exercises to reflect completion status
          await fetchExercises();
        }
      } catch (err) {
        showToast('Failed to save solution to server.', 'error');
      } finally {
        setExerciseSubmitting(false);
      }
    } else {
      showToast(allPassed ? 'Tests Passed!' : 'Some test cases failed.', allPassed ? 'success' : 'info');
      setExerciseSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'practice') {
      fetchExercises();
    } else if (activeTab === 'patterns' || activeTab === 'revision') {
      fetchPatterns();
    }
  }, [activeTab, isAuthenticated]);

  // Debounced pattern search
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!patternSearch.trim()) {
      setPatternSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setPatternSearchLoading(true);
      try {
        const res = await apiFetch(`/api/patterns/search?q=${encodeURIComponent(patternSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setPatternSearchResults(data);
        }
      } catch { /* silent */ } finally {
        setPatternSearchLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [patternSearch, isAuthenticated]);

  // Re-fetch catalog when pagination or filters change
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCatalog();
  }, [currentPage, pageSize, searchQuery, filterCategory, filterDifficulty, isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const solvedRes = await apiFetch('/api/solved');
      if (solvedRes.ok) {
        const sData = await solvedRes.json();
        setSolved(sData);
      }
      await Promise.all([
        fetchStats(),
        fetchRecommendations()
      ]);
    } catch (err) {
      showToast('Error loading data. Is the backend server running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setHasServerApiKey(data.hasApiKey);
        return data;
      }
    } catch (err) {
      // Fail silently
    }
    return null;
  };

  const fetchLeetCodeProfile = async () => {
    try {
      const res = await apiFetch('/api/leetcode/profile');
      if (res.ok) {
        const data = await res.json();
        setLcProfile(data);
      } else {
        setLcProfile(null);
      }
    } catch (err) {
      setLcProfile(null);
    }
  };

  const fetchDsaStructures = async () => {
    try {
      const res = await apiFetch('/api/dsa-structures');
      if (res.ok) {
        const data = await res.json();
        setDsaStructures(data);
      }
    } catch (err) {
      // Fail silently
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSubmitting(true);
    try {
      const response = await fetch(apiBaseUrl ? `${apiBaseUrl}/api/auth/login` : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Unable to unlock the workspace.');
      }
      sessionStorage.setItem('needcode_session_token', data.token);
      setPassword('');
      setIsAuthenticated(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to unlock the workspace.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle saving API key to local storage
  const handleSaveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('openrouter_api_key', val);
    showToast('API Key saved locally', 'success');
  };

  // Toggle solved status
  const handleMarkSolvedClick = (q: Question) => {
    const alreadySolved = solved.find(s => s.questionId === q.id);
    if (alreadySolved) {
      handleDeleteSolved(q.id);
    } else {
      setSolvingQuestion(q);
      setNotes('');
    }
  };

  const handleSaveSolvedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solvingQuestion) return;

    try {
      const res = await apiFetch('/api/solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: solvingQuestion.id,
          title: solvingQuestion.title,
          difficulty: solvingQuestion.difficulty,
          category: solvingQuestion.category,
          url: solvingQuestion.url,
          notes,
          solvedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        showToast(`"${solvingQuestion.title}" marked as solved!`, 'success');
        setSolvingQuestion(null);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to mark question as solved', 'error');
    }
  };

  const handleDeleteSolved = async (id: string) => {
    try {
      const res = await apiFetch(`/api/solved/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Question removed from solved list', 'info');
        fetchData();
      }
    } catch (err) {
      showToast('Failed to remove question', 'error');
    }
  };

  const startPractice = (exerciseId: string) => {
    const exe = exercises.find(e => e.id === exerciseId);
    if (exe) {
      setSelectedExercise(exe);
      setActiveTab('practice');
      // Set to problem tab in practice view
      setTutorialTab('problem');
      showToast(`Loading "${exe.title}" in sandbox workspace`, 'info');
    } else {
      showToast('Practice exercise details are loading, please wait.', 'info');
    }
  };

  // Sync recent submissions manually
  const handleSyncLeetCode = async () => {
    try {
      setSyncing(true);
      const res = await apiFetch('/api/leetcode/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedCount > 0) {
          showToast(data.message, 'success');
          fetchData();
          fetchLeetCodeProfile();
        } else {
          showToast(data.message, 'info');
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to sync submissions', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to sync service', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExtractAllLeetCode = async () => {
    try {
      setExtracting(true);
      showToast('Extracting all LeetCode problems... This will take a few seconds.', 'info');
      const res = await apiFetch('/api/leetcode/import-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, 'success');
        await Promise.all([
          fetchStats(),
          fetchCatalog()
        ]);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to extract catalog', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to extraction service', 'error');
    } finally {
      setExtracting(false);
    }
  };

  // Silent sync in background
  const silentSyncLeetCode = async () => {
    try {
      const res = await apiFetch('/api/leetcode/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedCount > 0) {
          showToast(`Autosynced ${data.syncedCount} recent problems from LeetCode!`, 'success');
          fetchData();
          fetchLeetCodeProfile();
        }
      }
    } catch (err) {
      // Fail silently in background
    }
  };

  // Add custom question
  const handleAddCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customCategory) {
      showToast('Title and Category are required', 'error');
      return;
    }

    try {
      const res = await apiFetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          category: customCategory,
          difficulty: customDifficulty,
          url: customUrl || undefined,
          description: customDescription || undefined
        })
      });

      if (res.ok) {
        showToast(`Custom question "${customTitle}" added!`, 'success');
        setShowAddCustom(false);
        setCustomTitle('');
        setCustomCategory('');
        setCustomDifficulty('Medium');
        setCustomUrl('');
        setCustomDescription('');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add custom question', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to backend server', 'error');
    }
  };

  // Get AI recommendations
  const handleGetRecommendations = async () => {
    try {
      setRecsLoading(true);
      const res = await apiFetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-key': apiKey
        },
        body: JSON.stringify({
          model: selectedModel,
          customInstruction: customInstruction
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setIsMock(!!data.isMock);
        if (data.isMock) {
          showToast('Using Mock recommendations (no API key detected)', 'info');
        } else {
          showToast('AI Recommendations updated!', 'success');
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to fetch recommendations', 'error');
      }
    } catch (err) {
      showToast('Failed to contact backend API', 'error');
    } finally {
      setRecsLoading(false);
    }
  };

  // Get AI explanation for Data Structure or Problem
  const handleGetExplanation = async (e?: React.FormEvent, topicOverride?: string) => {
    if (e) e.preventDefault();
    const queryTopic = topicOverride || explainTopic;
    if (!queryTopic.trim()) {
      showToast('Please specify a topic or problem first', 'error');
      return;
    }

    try {
      setExplainLoading(true);
      setExplanation(null);
      
      const res = await apiFetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-key': apiKey
        },
        body: JSON.stringify({
          topic: queryTopic,
          hintOnly: false,
          focusGoal: customInstruction,
          model: selectedModel,
          conversation: learnConversation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
        setLearnConversation(previous => {
          const exchange: LearnMessage[] = [
            { role: 'user', content: queryTopic },
            { role: 'assistant', content: data.personalizedInsight || data.patternTag || data.conceptName }
          ];
          return [...previous, ...exchange].slice(-6);
        });
        showToast(`AI explanation generated for "${queryTopic}"!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to fetch explanation', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to explanation service', 'error');
    } finally {
      setExplainLoading(false);
    }
  };

  // Get hint-only (pattern tag + constraint reading)
  const handleGetHint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryTopic = explainTopic;
    if (!queryTopic.trim()) {
      showToast('Please specify a topic or problem first', 'error');
      return;
    }

    try {
      setHintLoading(true);
      setExplanation(null);
      
      const res = await apiFetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-key': apiKey
        },
        body: JSON.stringify({
          topic: queryTopic,
          hintOnly: true,
          focusGoal: customInstruction,
          model: selectedModel,
          conversation: learnConversation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
        setLearnConversation(previous => {
          const exchange: LearnMessage[] = [
            { role: 'user', content: queryTopic },
            { role: 'assistant', content: data.personalizedInsight || data.patternTag || data.conceptName }
          ];
          return [...previous, ...exchange].slice(-6);
        });
        showToast(`Hint generated for "${queryTopic}"!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to fetch hint', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to explanation service', 'error');
    } finally {
      setHintLoading(false);
    }
  };

  const handleExplainPattern = (pattern: string) => {
    setExplainTopic(pattern);
    setActiveTab('learn');
    handleGetExplanation(undefined, pattern);
  };

  // Update DSA status
  const handleUpdateDsaStatus = async (id: string, newStatus: 'Not Started' | 'Learning' | 'Mastered', currentNotes?: string) => {
    try {
      const res = await apiFetch('/api/dsa-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, notes: currentNotes || '' })
      });
      if (res.ok) {
        showToast(`Updated "${id.replace(/-/g, ' ')}" status!`, 'success');
        fetchDsaStructures();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Edit DSA Notes
  const handleOpenEditNotesModal = (dsa: DsaStructure) => {
    setSelectedDsaToEdit(dsa);
    setDsaNotesText(dsa.notes);
  };

  const handleSaveDsaNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDsaToEdit) return;

    try {
      const res = await apiFetch('/api/dsa-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDsaToEdit.id,
          status: selectedDsaToEdit.status,
          notes: dsaNotesText
        })
      });

      if (res.ok) {
        showToast('DSA Notes saved successfully!', 'success');
        setSelectedDsaToEdit(null);
        fetchDsaStructures();
      }
    } catch (err) {
      showToast('Failed to save notes', 'error');
    }
  };

  // Edit Solved Question Notes / Save Spaced Repetition Review
  const handleUpdateSolvedNotes = async (
    questionId: string, 
    newNotes: string,
    payload?: {
      bruteForceTheory?: string;
      optimizedTheory?: string;
      repetition?: number;
      reviewInterval?: number;
      easiness?: number;
      nextReviewAt?: string;
    }
  ) => {
    const solvedItem = solved.find(s => s.questionId === questionId);
    if (!solvedItem) return;

    try {
      const res = await apiFetch('/api/solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          title: solvedItem.title,
          difficulty: solvedItem.difficulty,
          category: solvedItem.category,
          url: solvedItem.url,
          notes: newNotes,
          solvedAt: solvedItem.solvedAt,
          ...payload
        })
      });

      if (res.ok) {
        showToast('Solved question review successfully scheduled!', 'success');
        fetchData(); // Refresh the solved list and overview metrics
      } else {
        showToast('Failed to save review details', 'error');
      }
    } catch (err) {
      showToast('Failed to save review due to network error', 'error');
    }
  };

  // Copy code utility
  const handleCopyCodeText = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    showToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper: check if a question is solved
  const isQuestionSolved = (id: string) => solved.some(s => s.questionId === id);

  // Statistics calculations
  const easySolvedCount = solved.filter(s => s.difficulty === 'Easy').length;
  const mediumSolvedCount = solved.filter(s => s.difficulty === 'Medium').length;
  const hardSolvedCount = solved.filter(s => s.difficulty === 'Hard').length;
  const totalSolvedCount = solved.length;
  const progressPercent = totalCatalogCount > 0 
    ? Math.round((totalSolvedCount / totalCatalogCount) * 100) 
    : 0;

  // Global Interview Readiness Rating
  const masteredDsaCount = dsaStructures.filter(d => d.status === 'Mastered').length;
  const learningDsaCount = dsaStructures.filter(d => d.status === 'Learning').length;
  const dsaTotalCount = dsaStructures.length;
  
  // Scoring formula: (Solved Problems * 1.5) + (Mastered Topics * 5) + (Learning Topics * 2)
  const scoreMax = (40 * 1.5) + (dsaTotalCount * 5); // Seed targets
  const currentScore = (totalSolvedCount * 1.5) + (masteredDsaCount * 5) + (learningDsaCount * 2);
  const readinessRating = Math.min(100, Math.round((currentScore / scoreMax) * 100));

  // Pagination calculations
  const totalPages = Math.ceil(totalCatalogCount / pageSize);

  // Basic markdown conceptual renderer for LLM responses
  const renderConceptualMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>{parseBoldTokens(content)}</li>;
      }
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff' }}>{parseBoldTokens(trimmed.substring(4))}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff' }}>{parseBoldTokens(trimmed.substring(3))}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} style={{ marginTop: '1.75rem', marginBottom: '0.75rem', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>{parseBoldTokens(trimmed.substring(2))}</h2>;
      }
      return trimmed === '' ? <div key={idx} style={{ height: '0.5rem' }} /> : <p key={idx} style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{parseBoldTokens(trimmed)}</p>;
    });
  };

  const parseBoldTokens = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{part}</strong> : part);
  };

  if (authChecking) {
    return <div className="auth-gate"><LoadingDots label="Checking secure session" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-gate">
        <form className="auth-card" onSubmit={handlePasswordSubmit}>
          <div className="auth-mark"><Sparkles size={22} /></div>
          <h1>NeedCode Workspace</h1>
          <p>Enter the workspace password to continue.</p>
          <label htmlFor="workspace-password">Password</label>
          <input
            id="workspace-password"
            type="password"
            className="input-field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          {passwordError && <p className="auth-error" role="alert">{passwordError}</p>}
          <button className="button button-primary" type="submit" disabled={passwordSubmitting}>
            {passwordSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
            {passwordSubmitting ? 'Unlocking...' : 'Unlock workspace'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="notion-app-layout">
      {/* Sidebar */}
      <aside className={`notion-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="notion-sidebar-header">
          <div className="notion-sidebar-avatar">
            🧠
          </div>
          <div className="notion-sidebar-title-wrapper">
            <div className="notion-sidebar-title">NeedCode Workspace</div>
            <div className="notion-sidebar-subtitle">LeetCode AI Study Companion</div>
          </div>
        </div>

        <div className="notion-sidebar-scroll">
          {/* Navigation Pages */}
          <div className="sidebar-nav-list">
            <div 
              className={`sidebar-item ${activeTab === 'recs' ? 'active' : ''}`}
              onClick={() => { setActiveTab('recs'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🎯</span>
              <span>AI Path</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => { setActiveTab('catalog'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">📚</span>
              <span>Curriculum</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => { setActiveTab('guide'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🗺️</span>
              <span>DSA Guide</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'solved' ? 'active' : ''}`}
              onClick={() => { setActiveTab('solved'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">✍️</span>
              <span>Solved Logbook</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'learn' ? 'active' : ''}`}
              onClick={() => { setActiveTab('learn'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🧠</span>
              <span>AI Explainer</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => { setActiveTab('practice'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">⚡</span>
              <span>DSA Practice</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'patterns' ? 'active' : ''}`}
              onClick={() => { setActiveTab('patterns'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🧬</span>
              <span>Coding Patterns</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'revision' ? 'active' : ''}`}
              onClick={() => { setActiveTab('revision'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🔁</span>
              <span>Revision Hub</span>
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => { setActiveTab('companies'); setMobileMenuOpen(false); }}
            >
              <span className="sidebar-item-icon">🏢</span>
              <span>Top Companies</span>
            </div>
          </div>

          {/* Analytics group */}
          <div className="sidebar-group">
            <div className="sidebar-group-header" onClick={() => setAnalyticsOpen(!analyticsOpen)}>
              <span className="sidebar-group-header-arrow">
                {analyticsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <span>Analytics</span>
            </div>
            {analyticsOpen && (
              <div className="sidebar-group-content">
                {/* Interview Readiness */}
                <div className="sidebar-widget-card">
                  <div className="sidebar-widget-title">
                    <Award size={13} style={{ color: 'var(--accent-primary)' }} /> Readiness
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{readinessRating}%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{Math.round(currentScore)}/{Math.round(scoreMax)}</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden', marginTop: '6px' }}>
                    <div style={{ width: `${readinessRating}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Practice Progress */}
                <div className="sidebar-widget-card">
                  <div className="sidebar-widget-title">
                    <TrendingUp size={13} /> Progress
                  </div>
                  <div className="stats-circle-container">
                    <svg width="70" height="70" className="progress-ring">
                      <circle
                        stroke="var(--border-color)"
                        strokeWidth="5"
                        fill="transparent"
                        r="28"
                        cx="35"
                        cy="35"
                      />
                      <circle
                        className="progress-ring-circle"
                        stroke="var(--accent-primary)"
                        strokeWidth="5"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercent / 100)}`}
                        strokeLinecap="round"
                        fill="transparent"
                        r="28"
                        cx="35"
                        cy="35"
                      />
                    </svg>
                    <div className="stats-circle-text">
                      <div className="stats-circle-num" style={{ fontSize: '1rem' }}>{progressPercent}%</div>
                    </div>
                  </div>
                  <div className="stats-breakdown" style={{ marginTop: '8px' }}>
                    <div className="stat-row">
                      <span className="stat-label"><span className="stat-dot easy" /> Easy</span>
                      <span className="stat-value">{easySolvedCount}/{metaStats.easyCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label"><span className="stat-dot medium" /> Med</span>
                      <span className="stat-value">{mediumSolvedCount}/{metaStats.mediumCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label"><span className="stat-dot hard" /> Hard</span>
                      <span className="stat-value">{hardSolvedCount}/{metaStats.hardCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Settings group */}
          <div className="sidebar-group">
            <div className="sidebar-group-header" onClick={() => setSettingsOpen(!settingsOpen)}>
              <span className="sidebar-group-header-arrow">
                {settingsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <span>AI Settings</span>
            </div>
            {settingsOpen && (
              <div className="sidebar-group-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="config-group">
                    <label className="config-label" style={{ fontSize: '0.65rem' }}>OpenRouter Key</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="password" 
                        placeholder="Free Key"
                        className="input-field" 
                        style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                        value={apiKey}
                        onChange={(e) => handleSaveKey(e.target.value)}
                      />
                      <HelpCircle 
                        size={14} 
                        className="text-muted cursor-pointer" 
                        style={{ flexShrink: 0 }}
                        onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
                      />
                    </div>
                  </div>

                  <div className="config-group">
                    <label className="config-label" style={{ fontSize: '0.65rem' }}>LLM Model</label>
                    <select 
                      className="select-field"
                      style={{ padding: '4px 6px', fontSize: '0.8rem', width: '100%', backgroundPosition: 'right 6px center' }}
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="config-group">
                    <label className="config-label" style={{ fontSize: '0.65rem' }}>Focus Goal</label>
                    <textarea 
                      className="input-field" 
                      rows={2} 
                      style={{ resize: 'none', padding: '4px 6px', fontSize: '0.8rem' }}
                      placeholder="e.g. Sliding window, easy questions"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LeetCode integration group */}
          <div className="sidebar-group">
            <div className="sidebar-group-header" onClick={() => setLeetcodeOpen(!leetcodeOpen)}>
              <span className="sidebar-group-header-arrow">
                {leetcodeOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              <span>LeetCode Profile</span>
            </div>
            {leetcodeOpen && (
              <div className="sidebar-group-content">
                {lcProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={lcProfile.avatarUrl || 'https://assets.leetcode.com/users/default_avatar.jpg'} 
                        alt={lcProfile.username} 
                        style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {lcProfile.realName || lcProfile.username}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                          Rank: {lcProfile.ranking ? lcProfile.ranking.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    {lcProfile.rankingJumps && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        marginTop: '2px',
                        marginBottom: '2px'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                          Rank Jumps
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Day</div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              color: getJumpColor(lcProfile.rankingJumps.day)
                            }}>
                              {formatJump(lcProfile.rankingJumps.day)}
                            </div>
                          </div>
                          <div style={{ borderLeft: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Week</div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              color: getJumpColor(lcProfile.rankingJumps.week)
                            }}>
                              {formatJump(lcProfile.rankingJumps.week)}
                            </div>
                          </div>
                          <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Month</div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              color: getJumpColor(lcProfile.rankingJumps.month)
                            }}>
                              {formatJump(lcProfile.rankingJumps.month)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>Overall</div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              color: getJumpColor(lcProfile.rankingJumps.overall)
                            }}>
                              {formatJump(lcProfile.rankingJumps.overall)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <button 
                      className="button button-primary" 
                      style={{ fontSize: '0.75rem', padding: '4px 8px', width: '100%' }}
                      onClick={handleSyncLeetCode}
                      disabled={syncing}
                    >
                      {syncing ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} Sync Solved Log
                    </button>
                    <button 
                      className="button button-secondary" 
                      style={{ fontSize: '0.75rem', padding: '4px 8px', width: '100%' }}
                      onClick={handleExtractAllLeetCode}
                      disabled={extracting}
                    >
                      {extracting ? <Loader2 className="animate-spin" size={12} /> : <BookOpen size={12} />} Extract Catalog
                    </button>
                  </div>
                ) : (
                  <div className="sidebar-widget-card" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    💡 Set <code>LEETCODE_USERNAME</code> in <code>.env</code> to display stats and auto-sync!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '0 12px' }}>
            <button 
              className="button button-secondary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}
              onClick={() => setShowAddCustom(true)}
            >
              <Plus size={14} /> Add Custom Question
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="notion-sidebar-footer">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            NeedCode v1.0
          </div>
          <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Switch theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </aside>

      {/* Sidebar Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div className="notion-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Workspace content area */}
      <div className="notion-main">
        {/* Sticky top bar */}
        <div className="notion-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={16} />
            </button>
            <div className="breadcrumbs">
              <span className="breadcrumb-item">📂 Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-item active">{getActiveTabName(activeTab)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: hasServerApiKey || apiKey ? 'var(--tag-easy-text)' : 'var(--tag-medium-text)' 
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {hasServerApiKey || apiKey ? 'AI Connected' : 'Mock Mode'}
            </span>
          </div>
        </div>

        {/* Main scroll container */}
        <div className="notion-main-scroll">
          {/* Cover Banner */}
          <div className="notion-cover" />

          {/* Page Container */}
          <div className="notion-page-container">
            {/* Page Icon Floating Overlap */}
            <div className="notion-page-icon">
              {getPageEmoji(activeTab)}
            </div>

            {/* Page Title Header */}
            <div className="notion-page-header">
              <h1 className="notion-page-title">{getPageTitle(activeTab)}</h1>
              <p className="notion-page-subtitle">{getPageSubtitle(activeTab)}</p>
              <div className="notion-page-divider" />
            </div>

            {/* Page Content Slot */}
            <div className="notion-page-content">
              {loading ? (
                <div className="workspace-loading" role="status" aria-live="polite">
                  <div className="workspace-loading-mark" aria-hidden="true">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2>Preparing your workspace</h2>
                    <LoadingDots label="Loading your learning data" />
                  </div>
                  <div className="workspace-loading-skeletons" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab 1: AI Recommendations */}
                  {activeTab === 'recs' && (
                    <div>
                      <div className="notion-db-toolbar" style={{ justifyContent: 'flex-end', borderBottom: 'none', padding: 0, marginBottom: '16px' }}>
                        <button 
                          className="button button-primary"
                          onClick={handleGetRecommendations}
                          disabled={recsLoading}
                        >
                          {recsLoading ? (
                            <>
                              <Loader2 className="animate-spin" size={14} /> Analyzing Gaps...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Get Recommendations
                            </>
                          )}
                        </button>
                      </div>

                      {!apiKey && !hasServerApiKey && (
                        <div className="notion-callout warning" style={{ marginBottom: '16px' }}>
                          <span className="notion-callout-icon">⚠️</span>
                          <div className="notion-callout-text">
                            No OpenRouter key found. Running in <strong>Mock Demonstration Mode</strong>. Insert a free API Key in the settings panel to generate real paths.
                          </div>
                        </div>
                      )}

                      {isMock && apiKey && (
                        <div className="notion-callout info" style={{ marginBottom: '16px' }}>
                          <span className="notion-callout-icon">ℹ️</span>
                          <div className="notion-callout-text">
                            Showing cached/mock recommendations. If you just set your key, try clicking "Get Recommendations" again.
                          </div>
                        </div>
                      )}

                      {recommendations.filter(rec => {
                        const existing = questions.find(q => q.title.toLowerCase() === rec.title.toLowerCase());
                        return existing ? !isQuestionSolved(existing.id) : !solved.some(s => s.title.toLowerCase() === rec.title.toLowerCase());
                      }).length > 0 ? (
                        <div className="recommendation-cards">
                          {recommendations.filter(rec => {
                            const existing = questions.find(q => q.title.toLowerCase() === rec.title.toLowerCase());
                            return existing ? !isQuestionSolved(existing.id) : !solved.some(s => s.title.toLowerCase() === rec.title.toLowerCase());
                          }).map((rec, idx) => {
                            const existing = questions.find(q => q.title.toLowerCase() === rec.title.toLowerCase());
                            return (
                              <div key={idx} className={`rec-card ${rec.difficulty.toLowerCase()}`}>
                                <div className="rec-header">
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <a 
                                      href={rec.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="rec-title"
                                    >
                                      {rec.title} <ExternalLink size={12} className="text-muted" />
                                    </a>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                      <span className={`badge ${rec.difficulty.toLowerCase()}`}>{rec.difficulty}</span>
                                      <span className="badge category">{rec.category}</span>
                                    </div>
                                  </div>
                                </div>

                                <p className="rec-reason">{rec.reason}</p>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                  <button 
                                    className="button button-secondary"
                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                    onClick={() => {
                                      const mockQ: Question = existing || {
                                        id: rec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                        title: rec.title,
                                        difficulty: rec.difficulty,
                                        category: rec.category,
                                        url: rec.url,
                                        description: rec.reason
                                      };
                                      handleMarkSolvedClick(mockQ);
                                    }}
                                  >
                                    Mark as Solved
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="notion-callout" style={{ padding: '30px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '2rem' }}>🎯</span>
                          <h4 style={{ fontWeight: 600 }}>No Recommendations Found</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '460px' }}>
                            Click "Get Recommendations" above to let the AI analyze your practice history and outline the next set of challenges for you!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: LeetCode curriculum catalog */}
                  {activeTab === 'catalog' && (
                    <div>
                      {/* Database-style filter bar */}
                      <div className="notion-db-toolbar" style={{ marginBottom: '16px' }}>
                        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px' }}>
                          <Search size={14} className="text-muted" />
                          <input 
                            type="text" 
                            placeholder="Search questions..."
                            className="input-field"
                            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: '0.85rem', boxShadow: 'none' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        <div>
                          <select 
                            className="select-field"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                          >
                            <option value="All">All Topics</option>
                            {categories.filter(c => c !== 'All').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <select 
                            className="select-field"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value)}
                          >
                            <option value="All">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      {/* Curriculum Database Table */}
                      <div className="table-container">
                        <table className="questions-table">
                          <thead>
                            <tr>
                              <th style={{ width: '60px', textAlign: 'center' }}>Done</th>
                              <th>Question</th>
                              <th>Category</th>
                              <th>Difficulty</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {questions.length > 0 ? (
                              questions.map((q) => {
                                const isSolved = isQuestionSolved(q.id);
                                return (
                                  <tr key={q.id}>
                                    <td data-label="Solved" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                      <label className="checkbox-container">
                                        <input 
                                          type="checkbox" 
                                          checked={isSolved}
                                          onChange={() => handleMarkSolvedClick(q)}
                                        />
                                        <span className="checkmark">
                                          {isSolved && <Check size={10} className="text-white" />}
                                        </span>
                                      </label>
                                    </td>
                                    <td data-label="Question">
                                      <a 
                                        href={q.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="q-title"
                                      >
                                        {q.title} <ExternalLink size={11} className="text-muted" style={{ marginLeft: '2px' }} />
                                      </a>
                                      {q.description && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                          {q.description}
                                        </div>
                                      )}
                                    </td>
                                    <td data-label="Category">
                                      <span className="badge category">{q.category}</span>
                                    </td>
                                    <td data-label="Difficulty">
                                      <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'center' }}>
                                      <button 
                                        className="button button-ghost"
                                        style={{ padding: '2px 4px' }}
                                        onClick={() => handleMarkSolvedClick(q)}
                                        title={isSolved ? "Mark unsolved" : "Mark solved"}
                                      >
                                        <Code size={14} className={isSolved ? "text-green-500" : "text-muted"} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                  No questions found matching your filter criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalCatalogCount > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginTop: '16px', 
                          paddingTop: '8px', 
                          borderTop: '1px solid var(--border-color)',
                          flexWrap: 'wrap', 
                          gap: '12px' 
                        }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Showing <strong>{Math.min(totalCatalogCount, (currentPage - 1) * pageSize + 1)}</strong>-<strong>{Math.min(totalCatalogCount, currentPage * pageSize)}</strong> of <strong>{totalCatalogCount}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Size:</span>
                              <select 
                                className="select-field" 
                                style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                              >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                className="button button-secondary"
                                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              >
                                &larr; Prev
                              </button>
                              <span style={{ fontSize: '0.8rem', alignSelf: 'center', padding: '0 4px', fontWeight: 600 }}>
                                {currentPage} / {totalPages || 1}
                              </span>
                              <button 
                                className="button button-secondary"
                                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Solved Log */}
                  {activeTab === 'solved' && (
                    <div>
                      {solved.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {solved.map((item) => (
                            <div key={item.questionId} className="solved-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div>
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                                    className="q-title"
                                  >
                                    {item.title} <ExternalLink size={12} className="text-muted" />
                                  </a>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span className={`badge ${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                                    <span className="badge category">{item.category}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                      Solved {new Date(item.solvedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button 
                                  className="button button-ghost"
                                  style={{ padding: '4px', color: 'var(--accent-danger)' }}
                                  onClick={() => handleDeleteSolved(item.questionId)}
                                  title="Delete log entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {item.notes ? (
                                <div className="solved-notes-block">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', marginBottom: '4px' }}>
                                    <MessageSquare size={11} /> notes & intuition
                                  </div>
                                  <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{item.notes}</p>
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No solving notes recorded.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="notion-callout" style={{ padding: '30px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '2rem' }}>✍️</span>
                          <h4 style={{ fontWeight: 600 }}>Logbook Empty</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px' }}>
                            Browse the practice list in the Curriculum tab and mark questions as solved to start cataloging your insights!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: AI Study Companion */}
                  {activeTab === 'learn' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                      {/* Left: Console */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Explainer Console</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                              Type a data structure, algorithm topic, or problem. Your focus goal, solved log, topic progress, and this Learn-session conversation shape every response.
                            </p>
                            {learnConversation.length > 0 && (
                              <button
                                type="button"
                                className="button button-ghost"
                                style={{ padding: '3px 7px', fontSize: '0.72rem', flexShrink: 0 }}
                                onClick={() => setLearnConversation([])}
                              >
                                Clear session
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '12px', padding: '4px 7px', borderRadius: '4px', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            <MessageSquare size={12} />
                            {learnConversation.length > 0
                              ? `Session memory active · ${learnConversation.length / 2} prior exchange${learnConversation.length > 2 ? 's' : ''}`
                              : 'Personal context will be assembled from your learning data'}
                          </div>

                          <form onSubmit={handleGetExplanation} style={{ display: 'flex', gap: '8px', marginBottom: '10px', width: '100%' }}>
                            <div style={{ position: 'relative', flexGrow: 1 }}>
                              <input 
                                type="text" 
                                placeholder="e.g. Dijkstra's Algorithm, LRU Cache, Segment Tree..."
                                className="input-field"
                                style={{ width: '100%' }}
                                value={explainTopic}
                                onChange={(e) => {
                                  setExplainTopic(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => {
                                  // Wait a tiny bit so clicks on suggestions are registered before the list is hidden
                                  setTimeout(() => setShowSuggestions(false), 200);
                                }}
                              />
                              
                              {showSuggestions && explainSuggestions.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 1000,
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  boxShadow: 'var(--shadow-lg)',
                                  marginTop: '4px',
                                  maxHeight: '220px',
                                  overflowY: 'auto'
                                }}>
                                  {explainSuggestions.map((q) => (
                                    <div
                                      key={q.id}
                                      onClick={() => {
                                        setExplainTopic(q.title);
                                        setExplainSuggestions([]);
                                        setShowSuggestions(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                        transition: 'background-color 0.15s',
                                        fontSize: '0.8rem'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`difficulty-badge ${q.difficulty.toLowerCase()}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                          {q.difficulty}
                                        </span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{q.title}</span>
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                        {q.category}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button 
                              type="submit" 
                              className="button button-primary"
                              disabled={explainLoading || hintLoading}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {explainLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Full Explanation
                            </button>
                            <button 
                              type="button"
                              className="button button-ghost"
                              disabled={explainLoading || hintLoading}
                              style={{ whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}
                              onClick={handleGetHint}
                            >
                              {hintLoading ? <Loader2 className="animate-spin" size={14} /> : '💡'} Get Hint
                            </button>
                          </form>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suggestions:</span>
                            {SUGGESTIONS.map(pill => (
                              <button 
                                key={pill} 
                                type="button"
                                className="badge category"
                                style={{ cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', padding: '2px 6px' }}
                                onClick={() => setExplainTopic(pill)}
                              >
                                {pill}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Output */}
                        {(explainLoading || hintLoading) && (
                          <div className="ai-thinking-card">
                            <div className="ai-thinking-orb" aria-hidden="true">
                              <Sparkles size={18} />
                            </div>
                            <LoadingDots label={hintLoading ? 'Finding the right pattern' : 'Connecting this to your learning history'} />
                          </div>
                        )}

                        {explanation && !explainLoading && !hintLoading && (
                          <div className="explainer-output-card" style={{ animation: 'fadeIn 0.25s ease' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                              <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  🧠 {explanation.conceptName}
                                </h2>
                                {explanation.hintOnly && (
                                  <span className="badge" style={{ backgroundColor: 'var(--tag-medium-bg)', color: 'var(--tag-medium-text)', marginTop: '4px', display: 'inline-block', fontSize: '0.72rem' }}>
                                    Hint Mode — click "Full Explanation" to unlock all sections
                                  </span>
                                )}
                              </div>
                            </div>

                            {explanation.personalizedInsight && (
                              <div style={{ marginBottom: '12px', padding: '10px 12px', backgroundColor: 'rgba(var(--accent-primary-rgb, 99,102,241),0.08)', border: '1px solid rgba(var(--accent-primary-rgb, 99,102,241),0.25)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Your learning context</span>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{explanation.personalizedInsight}</p>
                              </div>
                            )}

                            {/* Section 1: Pattern Tag */}
                            {explanation.patternTag && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 12px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pattern</span>
                                <button
                                  type="button"
                                  onClick={() => handleExplainPattern(explanation.patternTag || '')}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                >
                                  {explanation.patternTag}
                                </button>
                              </div>
                            )}

                            {/* Section 2: Constraint Reading */}
                            {explanation.constraintReading && (
                              <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: 'rgba(var(--accent-primary-rgb, 99,102,241),0.06)', border: '1px solid rgba(var(--accent-primary-rgb, 99,102,241),0.2)', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>📐 Constraint Reading</span>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>{explanation.constraintReading}</p>
                              </div>
                            )}

                            {!explanation.hintOnly && (
                              <>
                                {/* Section 3: Brute Force → Optimized Bridge */}
                                {explanation.bruteForceOptimizedBridge && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>🔨 Brute Force → Optimized</h4>
                                    <div className="conceptual-explanation-body" style={{ fontSize: '0.84rem' }}>
                                      {renderConceptualMarkdown(explanation.bruteForceOptimizedBridge)}
                                    </div>
                                  </div>
                                )}

                                {/* Section 4: Dry Run Trace */}
                                {explanation.dryRunTrace && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>🔍 Dry Run / Trace</h4>
                                    <pre style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                                      {explanation.dryRunTrace}
                                    </pre>
                                  </div>
                                )}

                                {/* Section 5: Complexity */}
                                {explanation.complexity && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <span className="badge" style={{ backgroundColor: 'var(--tag-easy-bg)', color: 'var(--tag-easy-text)', fontSize: '0.78rem' }}>
                                      ⏱ {explanation.complexity}
                                    </span>
                                  </div>
                                )}

                                {/* Section 6: Pitfalls */}
                                {explanation.pitfalls && explanation.pitfalls.length > 0 && (
                                  <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px' }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠️ Common Pitfalls & Edge Cases</h4>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                                      {explanation.pitfalls.map((p, i) => (
                                        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                                          <span style={{ color: 'var(--tag-hard-text)', flexShrink: 0 }}>•</span> {p}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Section 7: Code Implementation */}
                                {explanation.codeImplementation && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>💻 C++17 Reference Implementation</h4>
                                      <button 
                                        type="button"
                                        className="button button-ghost"
                                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                        onClick={() => handleCopyCodeText(explanation.codeImplementation!)}
                                      >
                                        {copiedCode ? <Check size={12} /> : <Copy size={12} />} 
                                        {copiedCode ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                    <pre className="code-pre-block">
                                      <code>{explanation.codeImplementation}</code>
                                    </pre>
                                  </div>
                                )}

                                {/* Section 8: Follow-Up Variations */}
                                {explanation.followUpVariations && explanation.followUpVariations.length > 0 && (
                                  <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px' }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>🎯 Follow-Up Interview Variations</h4>
                                    <ol style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px', margin: 0 }}>
                                      {explanation.followUpVariations.map((q, i) => (
                                        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {/* Section 9: Transfer to Other Problems */}
                                {explanation.transferability && explanation.transferability.length > 0 && (
                                  <div style={{ marginBottom: '12px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px' }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>🔄 Transfer to Other Problems</h4>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                                      {explanation.transferability.map((t, i) => (
                                        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                                          <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span> {t}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Section 10: Next Recommended Problem */}
                                {explanation.nextRecommendedProblem && (
                                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '6px', borderLeft: '3px solid var(--tag-easy-text)' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>⬆️ Next Recommended Problem</span>
                                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>{explanation.nextRecommendedProblem}</p>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Legacy: render old explanation/keyPatterns fields if present */}
                            {explanation.hintOnly !== false && explanation.explanation && (
                              <div className="conceptual-explanation-body">
                                {renderConceptualMarkdown(explanation.explanation)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Board */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>DSA Interview Progress Board</h3>
                            <span className="badge category" style={{ fontSize: '0.72rem' }}>{masteredDsaCount} / {dsaTotalCount} Mastered</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>
                            Track your comfort level across primary concepts. Click a topic name to explain it using the console.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {dsaStructures.map((dsa, idx) => {
                              let statusTag = 'easy'; // Mastered
                              if (dsa.status === 'Learning') statusTag = 'medium';
                              if (dsa.status === 'Not Started') statusTag = 'category';

                              const emoji = TOPIC_ICONS[dsa.id] || '📂';
                              const colorClass = `icon-color-${idx % 6}`;

                              return (
                                <div 
                                  key={dsa.id} 
                                  style={{ 
                                    padding: '8px 10px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md, 6px)',
                                    backgroundColor: 'var(--bg-app)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexGrow: 1 }}>
                                    <div className={`icon-square ${colorClass}`} style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                                      {emoji}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                      <button 
                                        type="button"
                                        className="q-title"
                                        style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
                                        onClick={() => { setExplainTopic(dsa.name); }}
                                        title="Click to explain using AI"
                                      >
                                        {dsa.name}
                                      </button>
                                      {dsa.notes && (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                          {dsa.notes.length > 25 ? dsa.notes.substring(0, 25) + '...' : dsa.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    <button 
                                      className="button button-ghost"
                                      style={{ padding: '2px' }}
                                      onClick={() => handleOpenEditNotesModal(dsa)}
                                      title="Edit Notes"
                                    >
                                      <MessageSquare size={13} />
                                    </button>

                                    <select
                                      className={`select-field badge ${statusTag}`}
                                      style={{ 
                                        width: '105px', 
                                        padding: '2px 4px', 
                                        fontSize: '0.72rem',
                                        height: 'auto',
                                        backgroundImage: 'none',
                                        border: 'none',
                                        fontWeight: 700
                                      }}
                                      value={dsa.status}
                                      onChange={(e) => handleUpdateDsaStatus(dsa.id, e.target.value as any, dsa.notes)}
                                    >
                                      <option value="Not Started" style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}>Not Started</option>
                                      <option value="Learning" style={{ background: 'var(--bg-app)', color: 'var(--tag-medium-text)' }}>Learning</option>
                                      <option value="Mastered" style={{ background: 'var(--bg-app)', color: 'var(--tag-easy-text)' }}>Mastered</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 5: DSA Practice Lab */}
                  {activeTab === 'practice' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="practice-desktop-grid">
                      <style>{`
                        @media (min-width: 1024px) {
                          .practice-desktop-grid {
                            grid-template-columns: 350px 1fr !important;
                          }
                        }
                        .exercise-item {
                          padding: 10px 12px;
                          border: 1px solid var(--border-color);
                          border-radius: 6px;
                          cursor: pointer;
                          transition: all 0.2s ease;
                          background: var(--bg-app);
                          display: flex;
                          flex-direction: column;
                          gap: 4px;
                        }
                        .exercise-item:hover {
                          background: var(--bg-hover);
                          border-color: var(--accent-primary);
                        }
                        .exercise-item.active {
                          border-color: var(--accent-primary);
                          background: var(--bg-hover);
                        }
                        .test-case-box {
                          background: var(--bg-sidebar);
                          border: 1px solid var(--border-color);
                          border-radius: 4px;
                          padding: 10px;
                          font-family: var(--font-code);
                          font-size: 0.8rem;
                        }
                        .test-case-box.passed {
                          border-left: 3px solid var(--tag-easy-text);
                        }
                        .test-case-box.failed {
                          border-left: 3px solid var(--tag-hard-text);
                        }
                      `}</style>
                      
                      {/* Left: Exercises Sidebar & Active Description */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
                        <div style={{ padding: '12px 0 4px 0', borderBottom: '1px solid var(--border-color)' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Prebuilt Exercises</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {exercises.map((exe) => {
                            const isSolved = editorLanguage === 'javascript' 
                              ? exe.submissionStatusJS === 'Passed' 
                              : exe.submissionStatusCPP === 'Passed';
                            return (
                              <div 
                                key={exe.id}
                                className={`exercise-item ${selectedExercise?.id === exe.id ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedExercise(exe);
                                  setTutorialTab('problem');
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{exe.title}</span>
                                  {isSolved && (
                                    <span style={{ color: 'var(--tag-easy-text)', fontSize: '0.95rem', fontWeight: 'bold' }}>✓</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                  <span className={`badge ${exe.difficulty.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '1px 4px' }}>{exe.difficulty}</span>
                                  <span className="badge category" style={{ fontSize: '0.68rem', padding: '1px 4px' }}>{exe.category}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {selectedExercise && (
                          <div style={{ marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
                            {/* Tab Bar */}
                            <div style={{ 
                              display: 'flex', 
                              borderBottom: '1px solid var(--border-color)', 
                              backgroundColor: 'var(--bg-app)', 
                              padding: '2px 4px' 
                            }}>
                              {[
                                { id: 'problem', label: '📄 Problem' },
                                { id: 'concept', label: '📖 Concept' },
                                { id: 'walkthrough', label: '⚙️ Guide' },
                                { id: 'trace', label: '📝 Trace' }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  className="button button-ghost"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    fontWeight: tutorialTab === tab.id ? 700 : 500,
                                    color: tutorialTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    backgroundColor: tutorialTab === tab.id ? 'var(--bg-sidebar)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setTutorialTab(tab.id as any)}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Tab Content */}
                            <div style={{ padding: '14px' }}>
                              {tutorialTab === 'problem' && (
                                <div>
                                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                    <span className={`badge ${selectedExercise.difficulty.toLowerCase()}`}>{selectedExercise.difficulty}</span>
                                    <span className="badge category">{selectedExercise.category}</span>
                                  </div>
                                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{selectedExercise.title}</h2>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.55', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                    {selectedExercise.description}
                                  </p>
                                  {selectedExercise.patterns && selectedExercise.patterns.length > 0 && (
                                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Pattern:</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {selectedExercise.patterns.map((pat: string) => (
                                          <span key={pat} className="badge category" style={{ fontSize: '0.68rem', opacity: 0.85 }}>{pat}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {tutorialTab === 'concept' && (
                                <div>
                                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pattern Concept</h4>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                                    {selectedExercise.tutorialConcept || 'This exercise focuses on basic structure usage. Practice implementation to build coding speed.'}
                                  </p>
                                </div>
                              )}

                              {tutorialTab === 'walkthrough' && (
                                <div>
                                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Algorithm Walkthrough</h4>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                                    {selectedExercise.tutorialWalkthrough || '1. Read the problem carefully.\n2. Write out your base cases.\n3. Implement target loop constructs.\n4. Check outputs.'}
                                  </p>
                                </div>
                              )}

                              {tutorialTab === 'trace' && (
                                <div>
                                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dry Run Trace</h4>
                                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.55', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, Menlo, monospace' }}>
                                    {selectedExercise.tutorialTrace || 'No trace table registered for this exercise.'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Coding Sandbox */}
                      {selectedExercise ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '6px 6px 0 0', padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Language:</span>
                              <select
                                value={editorLanguage}
                                onChange={(e) => setEditorLanguage(e.target.value as 'javascript' | 'cpp')}
                                style={{
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  padding: '2px 8px',
                                  fontSize: '0.75rem',
                                  outline: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <option value="javascript">JavaScript</option>
                                <option value="cpp">C++ (⚡ Live Eval)</option>
                              </select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="button button-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  if (window.confirm('Reset the code to the default starter template? This will discard your current edits.')) {
                                    const code = editorLanguage === 'javascript' 
                                      ? selectedExercise.starterCode 
                                      : selectedExercise.starterCodeCpp;
                                    setExerciseCode(code);
                                    setRunResults(null);
                                    if (selectedExercise) {
                                      localStorage.removeItem(`needcode_draft_${selectedExercise.id}_${editorLanguage}`);
                                    }
                                  }
                                }}
                              >
                                Reset Template
                              </button>
                              <button 
                                className="button button-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                onClick={() => handleRunTests(false)}
                                disabled={exerciseSubmitting}
                              >
                                Run Tests
                              </button>
                              <button 
                                className="button button-primary"
                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                onClick={() => handleRunTests(true)}
                                disabled={exerciseSubmitting}
                              >
                                {exerciseSubmitting ? <Loader2 size={13} className="animate-spin" /> : 'Submit Solution'}
                              </button>
                            </div>
                          </div>

                          <div style={{ border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                            <Editor
                              height="400px"
                              language={editorLanguage === 'javascript' ? 'javascript' : 'cpp'}
                              theme={theme === 'dark' ? 'vs-dark' : 'light'}
                              value={exerciseCode}
                              onChange={(val) => {
                                const newCode = val || '';
                                setExerciseCode(newCode);
                                if (selectedExercise) {
                                  localStorage.setItem(`needcode_draft_${selectedExercise.id}_${editorLanguage}`, newCode);
                                }
                              }}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                fontFamily: 'JetBrains Mono, Menlo, monospace',
                                tabSize: 2
                              }}
                            />
                          </div>

                          {/* Execution Results */}
                          {runResults && (
                            <div style={{ animation: 'fadeIn 0.2s ease', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '14px', backgroundColor: 'var(--bg-app)' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '12px',
                                paddingBottom: '6px',
                                borderBottom: '1px solid var(--border-color)' 
                              }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: runResults.allPassed ? 'var(--tag-easy-text)' : 'var(--tag-hard-text)' }}>
                                  {runResults.allPassed ? '✓ Accepted (All test cases passed)' : '✗ Test Cases Failed'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  Passed {runResults.passedCount} / {runResults.totalCount} tests
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {runResults.results.map((r: any) => (
                                  <div key={r.index} className={`test-case-box ${r.passed ? 'passed' : 'failed'}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600 }}>
                                      <span>Test Case #{r.index}</span>
                                      <span style={{ color: r.passed ? 'var(--tag-easy-text)' : 'var(--tag-hard-text)' }}>
                                        {r.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', color: 'var(--text-primary)' }}>
                                      <div><span style={{ color: 'var(--text-muted)' }}>Input:</span> {r.input}</div>
                                      <div><span style={{ color: 'var(--text-muted)' }}>Expected:</span> {r.expected}</div>
                                      <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Returned:</span>{' '}
                                        <span style={{ color: r.passed ? 'var(--tag-easy-text)' : 'var(--tag-hard-text)' }}>{r.actual}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="notion-callout" style={{ padding: '30px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '2rem' }}>⚡</span>
                          <h4 style={{ fontWeight: 600 }}>Select an Exercise</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Pick any exercise from the list on the left to start coding and testing your skills.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 6: Coding Patterns Board */}
                  {activeTab === 'patterns' && (() => {
                    const curriculumPatterns = Array.from(
                      new Set(
                        dsaGuideSections.flatMap(sec => sec.problems.map(prob => prob.patternNote))
                      )
                    ).sort();

                    // Use search results when query is active, otherwise show all
                    const displayPatterns = (patternSearch.trim() && patternSearchResults !== null)
                      ? patternSearchResults
                      : patternsList;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="notion-callout" style={{ margin: 0, borderLeft: '3px solid var(--accent-primary)' }}>
                          <span style={{ fontSize: '1.25rem' }}>🧬</span>
                          <div>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mastering Coding Patterns</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                              Algorithms questions can be categorized into general problem-solving patterns. Recognizing these patterns is the key to solving unseen questions in coding assessments and technical interviews.
                            </p>
                          </div>
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={patternSearch}
                            onChange={e => setPatternSearch(e.target.value)}
                            placeholder={`Search patterns or LeetCode problems... e.g. "Two Sum", "sliding window"`}
                            style={{
                              width: '100%',
                              padding: '10px 16px 10px 40px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-sidebar)',
                              color: 'var(--text-primary)',
                              fontSize: '0.88rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.15s'
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          />
                          <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '1rem' }}>🔍</span>
                          {patternSearchLoading && (
                            <span style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Searching...</span>
                          )}
                          {patternSearch.trim() && !patternSearchLoading && (
                            <button
                              type="button"
                              onClick={() => { setPatternSearch(''); setPatternSearchResults(null); }}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}
                            >✕</button>
                          )}
                        </div>

                        {/* Result label */}
                        {patternSearch.trim() && patternSearchResults !== null && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                            {patternSearchResults.length > 0
                              ? `${patternSearchResults.length} pattern${patternSearchResults.length !== 1 ? 's' : ''} found for "${patternSearch}"`
                              : `No patterns matched "${patternSearch}"`
                            }
                          </p>
                        )}

                        {/* Cards Grid — equal height via grid + stretch */}
                        {displayPatterns.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                            gap: '16px',
                            alignItems: 'stretch'
                          }}>
                            {displayPatterns.map((pat) => {
                              // Highlight problem badges that matched the search query
                              const queryLower = patternSearch.toLowerCase().trim();
                              const isSearching = !!queryLower;

                              return (
                                <div
                                  key={pat.id}
                                  style={{
                                    padding: '16px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--bg-sidebar)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    height: '100%',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s, box-shadow 0.15s'
                                  }}
                                  onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-primary)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                                  }}
                                  onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                  }}
                                >
                                  {/* Header */}
                                  <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                                      {pat.name}
                                    </h3>
                                    <p style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', lineHeight: '1.55', margin: 0 }}>
                                      {pat.description}
                                    </p>
                                  </div>

                                  {/* Key Identifiers — fixed height to keep cards aligned */}
                                  <div style={{ flexGrow: 0 }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>
                                      When to Use
                                    </span>
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px', margin: 0 }}>
                                      {(pat.keyIdentifiers || []).slice(0, 3).map((ki: string, i: number) => (
                                        <li key={i} style={{ fontSize: '0.77rem', color: 'var(--text-primary)' }}>{ki}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Linked Problems — highlighted when matched by search */}
                                  <div style={{ flexGrow: 0 }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>
                                      Problem Links
                                    </span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {(pat.linkedProblems || pat.commonProblems || []).map((prob: string) => {
                                        const isMatch = isSearching && prob.toLowerCase().includes(queryLower);
                                        return (
                                          <span
                                            key={prob}
                                            className="badge category"
                                            style={{
                                              fontSize: '0.69rem',
                                              cursor: 'pointer',
                                              backgroundColor: isMatch ? 'var(--accent-primary)' : undefined,
                                              color: isMatch ? '#fff' : undefined,
                                              border: isMatch ? '1px solid var(--accent-primary)' : undefined,
                                              fontWeight: isMatch ? 700 : undefined,
                                              transition: 'all 0.1s'
                                            }}
                                            title={`Explain: ${prob}`}
                                            onClick={() => handleExplainPattern(prob)}
                                          >
                                            {prob}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Code Template — pushed to bottom via margin-top: auto on button */}
                                  {pat.sampleTemplate && (
                                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                          Code Template
                                        </span>
                                        <button
                                          className="button button-ghost"
                                          style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                                          onClick={() => handleCopyCodeText(pat.sampleTemplate)}
                                        >
                                          Copy
                                        </button>
                                      </div>
                                      <pre style={{
                                          margin: 0,
                                          padding: '10px 12px',
                                          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
                                          color: theme === 'dark' ? '#d4d4d4' : '#24292e',
                                          overflowX: 'auto',
                                          overflowY: 'auto',
                                          maxHeight: '180px',
                                          whiteSpace: 'pre',
                                          lineHeight: 1.5,
                                          flex: 1
                                        }}>
                                        <code>{pat.sampleTemplate}</code>
                                      </pre>
                                    </div>
                                  )}

                                  {/* Explainer Button — always at bottom */}
                                  <button
                                    type="button"
                                    className="button button-ghost"
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: 'var(--accent-primary)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      marginTop: 'auto',
                                      background: 'var(--bg-app)',
                                      transition: 'all 0.15s'
                                    }}
                                    onClick={() => handleExplainPattern(pat.name)}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.borderColor = 'var(--border-color)';
                                      e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                                    }}
                                  >
                                    <Sparkles size={13} /> Learn Brute-Force to Optimised
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : patternSearch.trim() && patternSearchResults !== null ? (
                          <div style={{ textAlign: 'center', padding: '40px', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🔎</p>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>No patterns found</p>
                            <p style={{ fontSize: '0.82rem' }}>Try a different problem name or pattern keyword</p>
                          </div>
                        ) : null}

                        {/* Granular Concept Patterns (from Curriculum) */}
                        {curriculumPatterns.length > 0 && (
                          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                              Granular Concept Targets (from Curriculum)
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '14px' }}>
                              Click any concept target from the study guide to instantly explain its solving process from brute force to optimised.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {curriculumPatterns.map(pattern => (
                                <button
                                  key={pattern}
                                  onClick={() => handleExplainPattern(pattern)}
                                  className="concept-badge"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-sidebar)',
                                    borderRadius: 'var(--radius-sm, 4px)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                    e.currentTarget.style.color = 'var(--accent-primary)';
                                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                    e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)';
                                  }}
                                >
                                  🧬 {pattern}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {activeTab === 'guide' && (
                    <DsaGuideTab 
                      solved={solved} 
                      questions={questions} 
                      onMarkSolved={handleMarkSolvedClick} 
                      onDeleteSolved={handleDeleteSolved}
                      onStartPractice={startPractice}
                      onExplainPattern={handleExplainPattern}
                      onGuideProgressError={(message) => showToast(message, 'error')}
                      apiFetch={apiFetch}
                    />
                  )}

                  {activeTab === 'revision' && (
                    <RevisionTab
                      solved={solved}
                      patterns={patternsList}
                      onExplainPattern={handleExplainPattern}
                      onUpdateSolvedNotes={handleUpdateSolvedNotes}
                    />
                  )}

                  {activeTab === 'companies' && (
                    <CompanyQuestionsTab
                      solved={solved}
                      onMarkSolved={handleMarkSolvedClick}
                      apiFetch={apiFetch}
                      showToast={showToast}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Mark Solved Form */}
      {solvingQuestion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} className="text-green-500" /> Mark Solved
              </h3>
              <button className="button button-ghost" style={{ padding: 2 }} onClick={() => setSolvingQuestion(null)}>
                <X size={16} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Congratulations on solving <strong>{solvingQuestion.title}</strong>! Write down key learnings or logic takeaways:
            </p>

            <form onSubmit={handleSaveSolvedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="config-group">
                <label className="config-label" style={{ fontSize: '0.75rem' }}>Insights / Takeaways</label>
                <textarea 
                  className="input-field"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="e.g. Solved using Two Pointers. Time O(N). Space O(1). Incremented left pointer when sum was too small, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="button button-secondary"
                  style={{ padding: '4px 10px' }}
                  onClick={() => setSolvingQuestion(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button button-primary"
                  style={{ padding: '4px 10px' }}
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Question */}
      {showAddCustom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem', fontWeight: 600 }}>
                <Plus size={16} className="text-blue-500" /> Add Custom Question
              </h3>
              <button className="button button-ghost" style={{ padding: 2 }} onClick={() => setShowAddCustom(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="config-group">
                <label className="config-label" style={{ fontSize: '0.75rem' }}>Title *</label>
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  placeholder="e.g. Target Sum"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <div className="config-group" style={{ flex: 1 }}>
                  <label className="config-label" style={{ fontSize: '0.75rem' }}>Category *</label>
                  <input 
                    type="text" 
                    required
                    className="input-field" 
                    placeholder="e.g. Dynamic Programming"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
                
                <div className="config-group" style={{ width: '110px' }}>
                  <label className="config-label" style={{ fontSize: '0.75rem' }}>Difficulty *</label>
                  <select 
                    className="select-field"
                    style={{ width: '100%' }}
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value as any)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="config-group">
                <label className="config-label" style={{ fontSize: '0.75rem' }}>LeetCode Link</label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://leetcode.com/problems/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div className="config-group">
                <label className="config-label" style={{ fontSize: '0.75rem' }}>Brief Description</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Find ways to assign symbols to make target sum."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="button button-secondary"
                  style={{ padding: '4px 10px' }}
                  onClick={() => setShowAddCustom(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button button-primary"
                  style={{ padding: '4px 10px' }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit DSA Notes */}
      {selectedDsaToEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem', fontWeight: 600 }}>
                <MessageSquare size={16} className="text-violet-500" /> Edit Notes: {selectedDsaToEdit.name}
              </h3>
              <button className="button button-ghost" style={{ padding: 2 }} onClick={() => setSelectedDsaToEdit(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDsaNotesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="config-group">
                <label className="config-label" style={{ fontSize: '0.75rem' }}>Confidence Notes</label>
                <textarea 
                  className="input-field"
                  rows={4}
                  style={{ resize: 'vertical' }}
                  placeholder="Review BFS/DFS queue-based implementations, recursion tree heights..."
                  value={dsaNotesText}
                  onChange={(e) => setDsaNotesText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="button button-secondary"
                  style={{ padding: '4px 10px' }}
                  onClick={() => setSelectedDsaToEdit(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button button-primary"
                  style={{ padding: '4px 10px' }}
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Toast Notice */}
      {toast && (
        <div className="alert-toast">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
