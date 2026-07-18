import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';

dotenv.config({ path: './src/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const WEBSITE_PASSWORD = process.env.WEBSITE_PASSWORD;
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const signSession = (expiresAt) =>
  crypto.createHmac('sha256', WEBSITE_PASSWORD).update(String(expiresAt)).digest('hex');
const isValidSession = (token = '') => {
  if (!WEBSITE_PASSWORD) return true;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now()) return false;
  const expectedSignature = signSession(expiresAt);
  return signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

app.get('/api/auth/status', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  res.json({
    passwordRequired: Boolean(WEBSITE_PASSWORD),
    authenticated: isValidSession(token)
  });
});

app.post('/api/auth/login', (req, res) => {
  if (!WEBSITE_PASSWORD) {
    return res.status(503).json({ error: 'Website password is not configured on the server.' });
  }

  const password = String(req.body?.password || '');
  const expected = Buffer.from(WEBSITE_PASSWORD);
  const received = Buffer.from(password);
  const passwordsMatch = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!passwordsMatch) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  res.json({ token: `${expiresAt}.${signSession(expiresAt)}`, expiresAt });
});

app.use('/api', (req, res, next) => {
  if (!WEBSITE_PASSWORD || req.path.startsWith('/auth/')) {
    return next();
  }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Password required or session expired.' });
  }
  next();
});

const QUESTIONS_FILE = path.join(__dirname, 'data', 'questions.json');
const SOLVED_FILE = path.join(__dirname, 'data', 'solved.json');
const DSA_STRUCTURES_FILE = path.join(__dirname, 'data', 'dsa_structures.json');
const GUIDE_PROGRESS_FILE = path.join(__dirname, 'data', 'guide_progress.json');
const RECOMMENDATIONS_FILE = path.join(__dirname, 'data', 'recommendations.json');
const PROFILE_FILE = path.join(__dirname, 'data', 'leetcode_profile.json');
const RANKING_HISTORY_FILE = path.join(__dirname, 'data', 'leetcode_ranking_history.json');
const DSA_EXERCISES_FILE = path.join(__dirname, 'data', 'dsa_exercises.json');
const DSA_EXERCISE_SUBMISSIONS_FILE = path.join(__dirname, 'data', 'dsa_exercise_submissions.json');
const DSA_PATTERNS_FILE = path.join(__dirname, 'data', 'dsa_patterns.json');
const COMPANY_QUESTIONS_FILE = path.join(__dirname, 'data', 'company_questions.json');

const DEFAULT_DSA_PATTERNS = [
  {
    id: 'two-pointers',
    name: 'Two Pointers (Opposite Ends)',
    description: 'Uses two pointers at opposite ends of an array/sequence moving inward to find pairs, swap elements, or check symmetry in O(N) time.',
    key_identifiers: JSON.stringify([
      'Sorted arrays or lists',
      'Finding pairs that satisfy a condition',
      'Reversing elements or checking symmetry'
    ]),
    common_problems: JSON.stringify([
      'Two Sum II (Sorted)',
      'Valid Palindrome',
      'Container With Most Water',
      '3Sum'
    ]),
    sample_template: `function twoPointersTemplate(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    // Process elements at left and right
    if (condition) {
      left++;
    } else {
      right--;
    }
  }
}`
  },
  {
    id: 'fast-slow-pointers',
    name: 'Fast & Slow Pointers',
    description: 'Uses two pointers moving at different speeds (usually 1 step and 2 steps) to detect loops in linked lists, find midpoints, or resolve cyclic arrays.',
    key_identifiers: JSON.stringify([
      'Singly linked lists with loops',
      'Finding midpoints of sequences',
      'Finding cyclic dependencies or happy numbers'
    ]),
    common_problems: JSON.stringify([
      'Linked List Cycle',
      'Middle of the Linked List',
      'Happy Number',
      'Palindrome Linked List'
    ]),
    sample_template: `function fastSlowPointerTemplate(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      return true; // Cycle detected
    }
  }
  return false;
}`
  },
  {
    id: 'sliding-window-fixed',
    name: 'Sliding Window (Fixed Size)',
    description: 'Maintains a contiguous window of a fixed size K to process subarray/substring calculations without redundant loops.',
    key_identifiers: JSON.stringify([
      'Subarrays of size K',
      'Finding maximum/minimum sum or average of size K'
    ]),
    common_problems: JSON.stringify([
      'Maximum Sum Subarray of Size K',
      'All Anagrams in a String'
    ]),
    sample_template: `function slidingWindowFixed(arr, k) {
  let currentVal = 0;
  for (let i = 0; i < k; i++) {
    currentVal += arr[i];
  }
  let maxVal = currentVal;
  for (let i = k; i < arr.length; i++) {
    currentVal += arr[i] - arr[i - k];
    maxVal = Math.max(maxVal, currentVal);
  }
  return maxVal;
}`
  },
  {
    id: 'sliding-window-variable',
    name: 'Sliding Window (Variable Size)',
    description: 'Dynamically expands and contracts window boundaries to find the longest or shortest subarray/substring matching constraints.',
    key_identifiers: JSON.stringify([
      'Subarrays or substrings with dynamic constraints',
      'Finding shortest/longest matching segment'
    ]),
    common_problems: JSON.stringify([
      'Longest Substring Without Repeating Characters',
      'Minimum Size Subarray Sum'
    ]),
    sample_template: `function slidingWindowVariable(arr) {
  let start = 0;
  let maxLen = 0;
  const map = {};
  for (let end = 0; end < arr.length; end++) {
    const val = arr[end];
    if (map[val] !== undefined) {
      start = Math.max(start, map[val] + 1);
    }
    map[val] = end;
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}`
  },
  {
    id: 'merge-intervals',
    name: 'Merge Intervals',
    description: 'Sorts intervals by start time and processes overlaps sequentially. Critical for scheduling, calendar bookings, and range merging.',
    key_identifiers: JSON.stringify([
      'Interval ranges or overlap detections',
      'Scheduling meetings, timelines, or calendar bookings'
    ]),
    common_problems: JSON.stringify([
      'Merge Intervals',
      'Insert Interval',
      'Meeting Rooms II'
    ]),
    sample_template: `function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervals[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}`
  },
  {
    id: 'prefix-sum',
    name: 'Prefix Sum / Difference Array',
    description: 'Precomputes cumulative sums to allow O(1) range queries. Difference arrays allow O(1) range updates.',
    key_identifiers: JSON.stringify([
      'Subarray sum range queries',
      'Multiple prefix or suffix updates to array ranges'
    ]),
    common_problems: JSON.stringify([
      'Subarray Sum Equals K',
      'Range Sum Query - Static',
      'Corporate Flight Bookings'
    ]),
    sample_template: `function prefixSum(arr) {
  const prefix = new Array(arr.length + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }
  return prefix; // query range [l, r] as prefix[r+1] - prefix[l]
}`
  },
  {
    id: 'cyclic-sort',
    name: 'Cyclic Sort',
    description: 'Iterates through an array containing numbers in a known range (1 to N) and places each number in its correct index in-place.',
    key_identifiers: JSON.stringify([
      'Unsorted array with numbers in range 1 to N',
      'Finding the missing or duplicate numbers'
    ]),
    common_problems: JSON.stringify([
      'Missing Number',
      'Find All Duplicates in an Array',
      'First Missing Positive'
    ]),
    sample_template: `function cyclicSort(nums) {
  let i = 0;
  while (i < nums.length) {
    const correctIdx = nums[i] - 1;
    if (nums[i] > 0 && nums[i] <= nums.length && nums[i] !== nums[correctIdx]) {
      // Swap elements
      const temp = nums[i];
      nums[i] = nums[correctIdx];
      nums[correctIdx] = temp;
    } else {
      i++;
    }
  }
}`
  },
  {
    id: 'dutch-national-flag',
    name: 'Dutch National Flag / 3-way partitioning',
    description: 'Groups elements into three categories (e.g. 0s, 1s, 2s) in a single linear pass using three pointers.',
    key_identifiers: JSON.stringify([
      'Sorting three distinct types of values in-place',
      'Array partitioning or QuickSort pivots'
    ]),
    common_problems: JSON.stringify([
      'Sort Colors',
      'Partition List'
    ]),
    sample_template: `function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
}`
  },
  {
    id: 'bfs',
    name: 'BFS (Breadth-First Search)',
    description: 'Traverses structures level-by-level using a queue. Guarantees shortest path in unweighted graphs.',
    key_identifiers: JSON.stringify([
      'Finding the shortest path in unweighted structures',
      'Level-order tree traversal or neighbor expansion'
    ]),
    common_problems: JSON.stringify([
      'Binary Tree Level Order Traversal',
      'Word Ladder',
      '01 Matrix'
    ]),
    sample_template: `function bfs(root) {
  if (!root) return [];
  const queue = [root];
  const result = [];
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentLevel);
  }
  return result;
}`
  },
  {
    id: 'dfs',
    name: 'DFS (Depth-First Search)',
    description: 'Explores as deep as possible along each branch recursively or using a stack. Critical for connectivity and tree properties.',
    key_identifiers: JSON.stringify([
      'Traversing all nodes, check path existences',
      'Tree height/depth properties or backtracking queries'
    ]),
    common_problems: JSON.stringify([
      'Maximum Depth of Binary Tree',
      'Path Sum II',
      'Clone Graph'
    ]),
    sample_template: `function dfs(node) {
  if (!node) return;
  // Process node value
  dfs(node.left);
  dfs(node.right);
}`
  },
  {
    id: 'topological-sort',
    name: 'Topological Sort',
    description: 'Finds a linear ordering of vertices in a Directed Acyclic Graph (DAG) such that for every directed edge u -> v, u comes before v.',
    key_identifiers: JSON.stringify([
      'Task dependencies or course schedules',
      'DAG orderings'
    ]),
    common_problems: JSON.stringify([
      'Course Schedule',
      'Course Schedule II',
      'Alien Dictionary'
    ]),
    sample_template: `function topologicalSort(numCourses, prerequisites) {
  const inDegree = Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [v, u] of prerequisites) {
    adj[u].push(v);
    inDegree[v]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  const order = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    order.push(curr);
    for (const next of adj[curr]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  return order.length === numCourses ? order : [];
}`
  },
  {
    id: 'union-find',
    name: 'Union-Find (Disjoint Set)',
    description: 'Maintains disjoint sets and supports fast union and find operations (with path compression and union by rank).',
    key_identifiers: JSON.stringify([
      'Connecting components, dynamic networks',
      'Cycle detection in undirected graphs'
    ]),
    common_problems: JSON.stringify([
      'Number of Provinces',
      'Redundant Connection',
      'Graph Valid Tree'
    ]),
    sample_template: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(1);
  }
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX]++;
      }
      return true;
    }
    return false; // already unioned
  }
}`
  },
  {
    id: 'matrix-traversal',
    name: 'Matrix/Grid Traversal',
    description: 'Applies BFS/DFS to traverse grid coordinates, treating cells as vertices and adjacent cells as edges (e.g., island counting, flood fill).',
    key_identifiers: JSON.stringify([
      '2D grid dimensions with island clusters',
      'Grid flood fills, word searches, or maze pathfinding'
    ]),
    common_problems: JSON.stringify([
      'Number of Islands',
      'Max Area of Island',
      'Rotting Oranges'
    ]),
    sample_template: `function floodFill(grid, r, c, val) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
  if (grid[r][c] !== targetVal) return;
  grid[r][c] = val; // Mark visited
  floodFill(grid, r + 1, c, val);
  floodFill(grid, r - 1, c, val);
  floodFill(grid, r, c + 1, val);
  floodFill(grid, r, c - 1, val);
}`
  },
  {
    id: 'two-heaps',
    name: 'Two Heaps',
    description: 'Uses a Min-Heap and a Max-Heap together to track running medians or partition elements dynamically.',
    key_identifiers: JSON.stringify([
      'Tracking running medians or middle elements of streams',
      'Continuous dynamic partitioning of values'
    ]),
    common_problems: JSON.stringify([
      'Find Median from Data Stream',
      'Sliding Window Median'
    ]),
    sample_template: `// Needs helper MaxHeap & MinHeap classes
class MedianFinder {
  constructor() {
    this.small = new MaxHeap(); // left half
    this.large = new MinHeap(); // right half
  }
  addNum(num) {
    this.small.push(num);
    this.large.push(this.small.pop());
    if (this.small.size() < this.large.size()) {
      this.small.push(this.large.pop());
    }
  }
  findMedian() {
    if (this.small.size() > this.large.size()) return this.small.peek();
    return (this.small.peek() + this.large.peek()) / 2.0;
  }
}`
  },
  {
    id: 'top-k-elements',
    name: 'Top-K Elements',
    description: 'Uses a heap of size K to keep track of the largest or smallest elements in a stream/array, optimizing O(N log N) sorting to O(N log K).',
    key_identifiers: JSON.stringify([
      'Finding the top/bottom/most frequent K elements',
      'Avoiding full sorts of data collections'
    ]),
    common_problems: JSON.stringify([
      'Kth Largest Element in an Array',
      'Top K Frequent Elements',
      'K Closest Points to Origin'
    ]),
    sample_template: `function findKthLargest(nums, k) {
  const minHeap = new MinHeap();
  for (const num of nums) {
    minHeap.push(num);
    if (minHeap.size() > k) {
      minHeap.pop(); // discard smaller elements
    }
  }
  return minHeap.peek(); // Kth largest
}`
  },
  {
    id: 'k-way-merge',
    name: 'K-Way Merge',
    description: 'Merges K sorted lists into one sorted list using a Min-Heap. Vital for external sorting and merge operations.',
    key_identifiers: JSON.stringify([
      'Merging multiple pre-sorted arrays or lists',
      'Merging nodes across K sorted linked lists'
    ]),
    common_problems: JSON.stringify([
      'Merge K Sorted Lists',
      'Find K Pairs with Smallest Sums'
    ]),
    sample_template: `function mergeKLists(lists) {
  const dummy = { val: 0, next: null };
  let curr = dummy;
  // Use a min-heap of size K, initialized with head of each list
  const minHeap = lists.filter(Boolean).sort((a, b) => a.val - b.val);
  while (minHeap.length > 0) {
    const node = minHeap.shift();
    curr.next = node;
    curr = curr.next;
    if (node.next) {
      minHeap.push(node.next);
      minHeap.sort((a, b) => a.val - b.val);
    }
  }
  return dummy.next;
}`
  },
  {
    id: 'binary-search-on-answer',
    name: 'Binary Search on Answer',
    description: 'Applies binary search to the answer space rather than an array. Verify feasibility of each candidate answer with a greedy or linear check.',
    key_identifiers: JSON.stringify([
      'Minimizing the maximum or maximizing the minimum value',
      'A feasibility function can be checked in O(N) time'
    ]),
    common_problems: JSON.stringify([
      'Koko Eating Bananas',
      'Split Array Largest Sum',
      'Capacity to Ship Packages Within D Days'
    ]),
    sample_template: `function binarySearchOnAnswer(arr, limit) {
  let low = 1; // minimum possible answer
  let high = arr.reduce((a, b) => a + b, 0); // max possible answer
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (canAchieve(arr, mid, limit)) {
      ans = mid; // record feasible, try to optimize
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
function canAchieve(arr, capacity, limit) {
  let chunks = 1, current = 0;
  for (const x of arr) {
    if (current + x > capacity) { chunks++; current = 0; }
    current += x;
  }
  return chunks <= limit;
}`
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    description: 'Explores all possible choices recursively, pruning branches the moment they violate constraints. Used for subsets, permutations, Sudoku, and N-Queens.',
    key_identifiers: JSON.stringify([
      'Generating all subsets, permutations, or combinations',
      'Constraint satisfaction problems (Sudoku, N-Queens)'
    ]),
    common_problems: JSON.stringify([
      'Subsets',
      'Permutations',
      'Combination Sum',
      'N-Queens'
    ]),
    sample_template: `function subsets(nums) {
  const result = [];
  function backtrack(start, path) {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path); // explore
      path.pop();             // backtrack
    }
  }
  backtrack(0, []);
  return result;
}`
  },
  {
    id: 'divide-conquer',
    name: 'Divide & Conquer',
    description: 'Splits a problem into smaller independent subproblems, solves them recursively, then merges results. Foundational for sorting and tree algorithms.',
    key_identifiers: JSON.stringify([
      'Problem can be split into independent halves',
      'Sorting, searching, or tree construction problems'
    ]),
    common_problems: JSON.stringify([
      'Merge Sort',
      'Majority Element',
      'Count of Smaller Numbers After Self'
    ]),
    sample_template: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
function merge(l, r) {
  const out = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length) {
    if (l[i] <= r[j]) out.push(l[i++]);
    else out.push(r[j++]);
  }
  return out.concat(l.slice(i)).concat(r.slice(j));
}`
  },
  {
    id: 'dp-1d',
    name: 'DP — 1D (Linear)',
    description: 'Solves problems where dp[i] depends on one or two preceding states. Covers Fibonacci, House Robber, and staircase-style decisions.',
    key_identifiers: JSON.stringify([
      'Current decision depends only on the previous 1-2 states',
      'Sequence optimization with no branching subproblems'
    ]),
    common_problems: JSON.stringify([
      'Climbing Stairs',
      'House Robber',
      'Min Cost Climbing Stairs',
      'Decode Ways'
    ]),
    sample_template: `function rob(nums) {
  if (nums.length === 1) return nums[0];
  let prev2 = 0, prev1 = 0;
  for (const num of nums) {
    const curr = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}`
  },
  {
    id: 'dp-knapsack',
    name: 'DP — Knapsack (0/1 & Unbounded)',
    description: 'Solves capacity-constrained selection problems. 0/1 Knapsack uses each item once; Unbounded allows unlimited repetition.',
    key_identifiers: JSON.stringify([
      'Select items with weights/values to maximize profit within capacity',
      'Partition or target-sum subset decisions'
    ]),
    common_problems: JSON.stringify([
      'Partition Equal Subset Sum',
      'Coin Change',
      'Target Sum',
      'Combination Sum IV'
    ]),
    sample_template: `// Unbounded (Coin Change)
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`
  },
  {
    id: 'dp-lcs',
    name: 'DP — LCS Family (2-String Grid)',
    description: 'Uses a 2D grid dp[i][j] to compare two strings. Covers LCS, Edit Distance, and Longest Palindromic Subsequence.',
    key_identifiers: JSON.stringify([
      'Comparing two strings or sequences character by character',
      'Finding matching subsequences, edits, or alignments'
    ]),
    common_problems: JSON.stringify([
      'Longest Common Subsequence',
      'Edit Distance',
      'Distinct Subsequences',
      'Longest Palindromic Subsequence'
    ]),
    sample_template: `function lcs(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}`
  },
  {
    id: 'dp-interval',
    name: 'DP — Interval / Partition DP',
    description: 'Solves problems on sub-intervals [i, j], building solutions from smaller intervals to larger. Used in burst balloons and matrix chain multiplication.',
    key_identifiers: JSON.stringify([
      'Subproblems defined on contiguous ranges [i, j]',
      'Optimal splitting or partitioning of intervals'
    ]),
    common_problems: JSON.stringify([
      'Burst Balloons',
      'Strange Printer',
      'Minimum Cost Tree From Leaf Values'
    ]),
    sample_template: `function intervalDP(arr) {
  const n = arr.length;
  const dp = Array.from({ length: n }, () => Array(n).fill(0));
  // Fill intervals of increasing length
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k+1][j] + combine(i, k, j);
        dp[i][j] = Math.min(dp[i][j], cost);
      }
    }
  }
  return dp[0][n - 1];
}`
  },
  {
    id: 'dp-state-machine',
    name: 'DP — State Machine',
    description: 'Models explicit states (e.g. Hold, Sold, Rest) with transition rules at each step. Most powerful for stock trading variations with constraints.',
    key_identifiers: JSON.stringify([
      'Multiple parallel states with defined transition rules',
      'Stock buy/sell with cooldowns, fees, or K transactions'
    ]),
    common_problems: JSON.stringify([
      'Best Time to Buy and Sell Stock with Cooldown',
      'Best Time to Buy and Sell Stock with Transaction Fee',
      'Best Time to Buy and Sell Stock IV'
    ]),
    sample_template: `function maxProfitCooldown(prices) {
  let hold = -Infinity, sell = 0, rest = 0;
  for (const price of prices) {
    const prevHold = hold;
    hold = Math.max(hold, rest - price); // buy or keep holding
    rest = Math.max(rest, sell);         // cooldown or stay resting
    sell = prevHold + price;             // sell what we held
  }
  return Math.max(sell, rest);
}`
  },
  {
    id: 'union-find',
    name: 'Union-Find (Disjoint Set)',
    description: 'Tracks connected components with near-O(1) union and find operations using path compression and union by rank. Essential for dynamic connectivity.',
    key_identifiers: JSON.stringify([
      'Dynamic connectivity in undirected graphs',
      'Cycle detection or grouping by equivalence'
    ]),
    common_problems: JSON.stringify([
      'Number of Provinces',
      'Redundant Connection',
      'Graph Valid Tree',
      'Accounts Merge'
    ]),
    sample_template: `class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(1);
  }
  find(x) {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]); // path compression
    return this.parent[x];
  }
  union(x, y) {
    const rx = this.find(x), ry = this.find(y);
    if (rx === ry) return false;
    if (this.rank[rx] < this.rank[ry]) this.parent[rx] = ry;
    else if (this.rank[rx] > this.rank[ry]) this.parent[ry] = rx;
    else { this.parent[ry] = rx; this.rank[rx]++; }
    return true;
  }
}`
  },
  {
    id: 'matrix-traversal',
    name: 'Matrix / Grid Traversal',
    description: 'Treats 2D grid cells as graph nodes and uses BFS or DFS to traverse connected regions. Used for island counting, flood fill, and shortest grid paths.',
    key_identifiers: JSON.stringify([
      '2D grid problems with connected regions',
      'Island counting, flood fill, or shortest path on grid'
    ]),
    common_problems: JSON.stringify([
      'Number of Islands',
      'Max Area of Island',
      'Rotting Oranges',
      'Pacific Atlantic Water Flow'
    ]),
    sample_template: `const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
function numIslands(grid) {
  let count = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(grid, r, c);
      }
    }
  }
  return count;
}
function dfs(grid, r, c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return;
  if (grid[r][c] !== '1') return;
  grid[r][c] = '0'; // mark visited
  for (const [dr, dc] of DIRS) dfs(grid, r + dr, c + dc);
}`
  },
  {
    id: 'trie',
    name: 'Trie-based Prefix Matching',
    description: 'A tree structure where each edge represents a character. Enables O(L) prefix lookups, autocomplete, and word existence checks — far faster than hashing for prefix queries.',
    key_identifiers: JSON.stringify([
      'Prefix search, autocomplete, or dictionary word checks',
      'Finding words sharing a common prefix in O(L) time'
    ]),
    common_problems: JSON.stringify([
      'Implement Trie (Prefix Tree)',
      'Design Add and Search Words Data Structure',
      'Word Search II'
    ]),
    sample_template: `class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEnd = true;
  }
  search(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return node.isEnd;
  }
}`
  },
  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack / Queue',
    description: 'Maintains a stack or deque in strictly increasing or decreasing order. Solves "next greater/smaller element" queries in O(N) and sliding window maximums.',
    key_identifiers: JSON.stringify([
      'Next greater or smaller element queries',
      'Sliding window maximum or minimum',
      'Largest rectangle or histogram problems'
    ]),
    common_problems: JSON.stringify([
      'Daily Temperatures',
      'Next Greater Element I',
      'Largest Rectangle in Histogram',
      'Sliding Window Maximum'
    ]),
    sample_template: `// Monotonic Decreasing Stack: next greater element
function dailyTemperatures(temps) {
  const stack = []; // stores indices
  const ans = Array(temps.length).fill(0);
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
      const idx = stack.pop();
      ans[idx] = i - idx;
    }
    stack.push(i);
  }
  return ans;
}`
  }
];

const DEFAULT_DSA_EXERCISES = [
  {
    id: 'reverse-array',
    title: 'Reverse Array In-Place',
    description: 'Write a function that reverses an array of elements in-place. Do not allocate extra space for another array, you must do this by modifying the input array in-place with O(1) extra memory.',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    starter_code: `function reverseArray(arr) {
  // Write your code here
  
}`,
    starter_code_cpp: `#include <vector>
using namespace std;

vector<int> reverseArray(vector<int>& arr) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { input: [['h', 'e', 'l', 'l', 'o']], expected: ['o', 'l', 'l', 'e', 'h'] },
      { input: [[]], expected: [] }
    ]),
    solution_code: `function reverseArray(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }
  return arr;
}`,
    patterns: JSON.stringify(['Two Pointers']),
    tutorial_concept: 'The **Two Pointers** pattern uses two cursor indices that start at opposing ends of the array and move towards each other. For in-place array reversal, we swap the values at these pointers at each step. This allows us to modify the array directly without allocating any new array, achieving **O(1) Auxiliary Space** and **O(N) Time Complexity**.',
    tutorial_walkthrough: '1. Initialize a `left` pointer at index `0` and a `right` pointer at `arr.length - 1`.\n2. Start a loop that runs as long as `left < right`.\n3. Inside the loop, swap the element at `arr[left]` with the element at `arr[right]` using a temporary variable.\n4. Increment `left` by 1 and decrement `right` by 1.\n5. When `left >= right`, the loop terminates and the array is reversed.',
    tutorial_trace: 'Input: `[1, 2, 3, 4, 5]`\n*   **Initial**: `left = 0` (val: `1`), `right = 4` (val: `5`). Swap -> `[5, 2, 3, 4, 1]`. Move: `left=1`, `right=3`.\n*   **Step 2**: `left = 1` (val: `2`), `right = 3` (val: `4`). Swap -> `[5, 4, 3, 2, 1]`. Move: `left=2`, `right=2`.\n*   **Termination**: `left = 2`, `right = 2` (`left < right` is false). Return array.'
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    difficulty: 'Easy',
    category: 'Two Pointers',
    starter_code: `function isPalindrome(s) {
  // Write your code here
  
}`,
    starter_code_cpp: `#include <string>
using namespace std;

bool isPalindrome(string s) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false },
      { input: [" "], expected: true }
    ]),
    solution_code: `function isPalindrome(s) {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = cleaned.length - 1;
  while (left < right) {
    if (cleaned[left] !== cleaned[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}`,
    patterns: JSON.stringify(['Two Pointers']),
    tutorial_concept: 'The **Two Pointers** pattern is perfect for checking symmetry. In a palindrome, the characters matching from the start and end must be identical. By cleaning the string of non-alphanumeric characters and comparing characters from left and right boundaries, we can determine palindromic validity in a single linear pass.',
    tutorial_walkthrough: '1. Normalize the string: convert all characters to lowercase and strip non-alphanumeric characters.\n2. Place `left` pointer at the start (`0`) and `right` pointer at the end of the cleaned string.\n3. Loop while `left < right`:\n   - Check if `cleaned[left] !== cleaned[right]`. If they mismatch, it is not a palindrome: return `false`.\n   - Otherwise, move pointers closer: `left++`, `right--`.\n4. If the loop completes without a mismatch, return `true`.',
    tutorial_trace: 'Input string: `\'A man, a plan, a canal: Panama\'`\n*   **Cleaned**: `\'amanaplanacanalpanama\'`\n*   **Step 1**: `left = 0 (\'a\')`, `right = 20 (\'a\')`. Match! Move: `left=1`, `right=19`.\n*   **Step 2**: `left = 1 (\'m\')`, `right = 19 (\'m\')`. Match! Move: `left=2`, `right=18`.\n... (all match) ...\n*   **Return**: `true`.'
  },
  {
    id: 'max-sum-subarray',
    title: 'Max Sum Subarray of Size K',
    description: 'Given an array of positive numbers and a positive number `k`, find the maximum sum of any contiguous subarray of size `k`. Use the sliding window pattern for an O(N) solution.',
    difficulty: 'Easy',
    category: 'Sliding Window',
    starter_code: `function maxSubarraySum(arr, k) {
  // Write your code here
  
}`,
    starter_code_cpp: `#include <vector>
using namespace std;

int maxSubarraySum(vector<int>& arr, int k) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
      { input: [[2, 3, 4, 1, 5], 2], expected: 7 },
      { input: [[1, 3, 5], 1], expected: 5 }
    ]),
    solution_code: `function maxSubarraySum(arr, k) {
  if (arr.length < k || k <= 0) return 0;
  let maxSum = 0;
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,
    patterns: JSON.stringify(['Sliding Window']),
    tutorial_concept: 'The **Sliding Window** pattern reduces the time complexity of subarray searches from O(N*K) to O(N). Instead of re-summing all K elements from scratch for each starting index, we maintain the sum of a running \'window\' of size K. When the window slides right, we add the new element entering the window and subtract the old element that is leaving.',
    tutorial_walkthrough: '1. Calculate the sum of the first `K` elements. Initialize `maxSum` and `windowSum` with this value.\n2. Iterate through the array starting from index `K` up to `arr.length - 1`:\n   - Slide the window: add the entering element `arr[i]` and subtract the leaving element `arr[i - K]`.\n   - Update `maxSum` with the maximum of `maxSum` and the new `windowSum`.\n3. Return `maxSum`.',
    tutorial_trace: 'Input: `arr = [2, 1, 5, 1, 3, 2]`, `k = 3`\n*   **Initial Window (size 3)**: elements `[2, 1, 5]`. `windowSum = 8`. `maxSum = 8`.\n*   **Slide 1**: Add `1` (index 3), subtract `2` (index 0). New window `[1, 5, 1]`. `windowSum = 8 + 1 - 2 = 7`. `maxSum = max(8, 7) = 8`.\n*   **Slide 2**: Add `3` (index 4), subtract `1` (index 1). New window `[5, 1, 3]`. `windowSum = 7 + 3 - 1 = 9`. `maxSum = max(8, 9) = 9`.\n*   **Slide 3**: Add `2` (index 5), subtract `5` (index 2). New window `[1, 3, 2]`. `windowSum = 9 + 2 - 5 = 6`. `maxSum = max(9, 6) = 9`.\n*   **Return**: `9`.'
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    description: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and open brackets are closed in the correct order. Hint: Use a Stack.',
    difficulty: 'Easy',
    category: 'Stacks & Queues',
    starter_code: `function isValid(s) {
  // Write your code here
  
}`,
    starter_code_cpp: `#include <string>
#include <stack>
using namespace std;

bool isValid(string s) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: ["()[]{}"], expected: true },
      { input: ["([)]"], expected: false },
      { input: ["{[]}"], expected: true }
    ]),
    solution_code: `function isValid(s) {
  const stack = [];
  const mapping = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char in mapping) {
      const topElement = stack.length === 0 ? '#' : stack.pop();
      if (topElement !== mapping[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
    patterns: JSON.stringify(['Stacks & Queues']),
    tutorial_concept: 'A **Stack** follows the LIFO (Last In, First Out) principle, which fits problems with nested structural components. When we encounter an opening bracket `(`, `[`, `{`, we push it onto the stack. When we encounter a closing bracket `)`, `]`, `}`, it must match the opening bracket currently on top of the stack (the most recently opened one).',
    tutorial_walkthrough: '1. Initialize an empty stack array.\n2. Map each closing bracket to its corresponding opening bracket: `\')\': \'(\'`, `\'}\': \'{\'`, `\']\': \'[\'`.\n3. Loop through each character `char` in string `s`:\n   - If `char` is a closing bracket, pop the top element from the stack (use a dummy placeholder if stack is empty).\n   - If the popped element does not match the mapped opening bracket, return `false`.\n   - If `char` is an opening bracket, push it onto the stack.\n4. After the loop, return `true` if the stack is completely empty, otherwise `false` (unclosed brackets).',
    tutorial_trace: 'Input string: `\'()[]{}\'`\n*   **Step 1**: char `\'(\'` -> open bracket. Push to stack. Stack: `[\'(\']`.\n*   **Step 2**: char `\')\'` -> closing bracket. Pop top of stack (`\'(\'`). Mapped match: `\'(\' === \'(\'`. Correct. Stack: `[]`.\n*   **Step 3**: char `\'[\'` -> open bracket. Push. Stack: `[\'[\']`.\n*   **Step 4**: char `\']\'` -> close bracket. Pop (`\'[\'`). Match! Stack: `[]`.\n... (same for `{}`) ...\n*   **Return**: Stack is empty -> `true`.'
  },
  {
    id: 'reverse-linked-list',
    title: 'Reverse a Linked List',
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list. A ListNode class structure is defined as: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }`. Input arrays represent linked list node values. To verify, we will serialize your list back to an array.',
    difficulty: 'Easy',
    category: 'Linked Lists',
    starter_code: `// A ListNode has properties: val, next
function reverseList(head) {
  // Write your code here
  
}`,
    starter_code_cpp: `// A ListNode has properties: val, next
ListNode* reverseList(ListNode* head) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: [[1, 2, 3, 4]], expected: [4, 3, 2, 1], specialType: 'LinkedList' },
      { input: [[1, 2]], expected: [2, 1], specialType: 'LinkedList' },
      { input: [[]], expected: [], specialType: 'LinkedList' }
    ]),
    solution_code: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
    patterns: JSON.stringify(['In-place Reversal of a LinkedList']),
    tutorial_concept: 'The **In-place Reversal of a LinkedList** pattern manipulates nodes by changing their `.next` references in a single pass without copying or allocating new memory. We keep track of the `current` node, its `previous` node (initially `null`), and a temporary `next` node so we don\'t lose the rest of the list when we overwrite pointers.',
    tutorial_walkthrough: '1. Initialize `prev` as `null` and `curr` pointing to the `head`.\n2. Iterate while `curr` is not `null`:\n   - Temporarily store `curr.next` in a variable `nextTemp` (prevents losing reference to the rest of the list).\n   - Reverse the current link: set `curr.next = prev`.\n   - Slide pointers forward: set `prev = curr` and `curr = nextTemp`.\n3. After the loop, `prev` will point to the new head of the reversed list. Return `prev`.',
    tutorial_trace: 'Input list: `1 -> 2 -> 3 -> null`\n*   **Initial**: `prev = null`, `curr = node(1)`\n*   **Step 1**: `nextTemp = node(2)`. Set `node(1).next = null`. Move: `prev = node(1)`, `curr = node(2)`.\n*   **Step 2**: `nextTemp = node(3)`. Set `node(2).next = node(1)`. Move: `prev = node(2)`, `curr = node(3)`.\n*   **Step 3**: `nextTemp = null`. Set `node(3).next = node(2)`. Move: `prev = node(3)`, `curr = null`.\n*   **Termination**: `curr` is `null`. Return `prev` (`3 -> 2 -> 1 -> null`).'
  },
  {
    id: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    description: 'Given the `root` of a binary tree, invert the tree, and return its root. Inverting means left and right children are swapped recursively. A TreeNode class structure is defined as: `class TreeNode { constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }`. Node inputs are in LeetCode BFS level order arrays.',
    difficulty: 'Easy',
    category: 'Binary Trees & BST',
    starter_code: `// A TreeNode has properties: val, left, right
function invertTree(root) {
  // Write your code here
  
}`,
    starter_code_cpp: `// A TreeNode has properties: val, left, right
TreeNode* invertTree(TreeNode* root) {
  // Write your code here
  
}`,
    test_cases: JSON.stringify([
      { input: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1], specialType: 'BinaryTree' },
      { input: [[2, 1, 3]], expected: [2, 3, 1], specialType: 'BinaryTree' },
      { input: [[]], expected: [], specialType: 'BinaryTree' }
    ]),
    solution_code: `function invertTree(root) {
  if (root === null) return null;
  const temp = root.left;
  root.left = root.right;
  root.right = temp;
  invertTree(root.left);
  invertTree(root.right);
  return root;
}`,
    patterns: JSON.stringify(['Tree DFS (Depth-First Search)']),
    tutorial_concept: 'The **Tree DFS (Recursion)** pattern traverses hierarchical nodes in a depth-first fashion. To invert a binary tree, we swap the left and right child pointers of the current node, then recursively repeat this operation for the left and right subtrees. This is a post-order or pre-order recursive tree traversal.',
    tutorial_walkthrough: '1. Define the base case: if the current node `root` is `null`, return `null`.\n2. Swap the left and right children of the current node: store `root.left` in a temporary variable, assign `root.left = root.right`, and assign `root.right = temp`.\n3. Recursively call `invertTree(root.left)`.\n4. Recursively call `invertTree(root.right)`.\n5. Return the original `root` node.',
    tutorial_trace: 'Input tree: root `2` with left `1`, right `3` (`[2, 1, 3]`)\n*   **Call on root (2)**: swap children -> left becomes `3`, right becomes `1`. Tree: `[2, 3, 1]`.\n*   **Recursive Call left (3)**: children are null, returns node `3`.\n*   **Recursive Call right (1)**: children are null, returns node `1`.\n*   **Return**: root `2` with structure `2 -> left(3), right(1)`.'
  }
];

// Root list of standard interview DSA topics/structures
const DEFAULT_DSA_STRUCTURES = [
  { id: 'arrays', name: 'Arrays & Hashing', status: 'Not Started', notes: '' },
  { id: 'two-pointers', name: 'Two Pointers', status: 'Not Started', notes: '' },
  { id: 'sliding-window', name: 'Sliding Window', status: 'Not Started', notes: '' },
  { id: 'stacks-queues', name: 'Stacks & Queues', status: 'Not Started', notes: '' },
  { id: 'linked-lists', name: 'Linked Lists', status: 'Not Started', notes: '' },
  { id: 'binary-search', name: 'Binary Search', status: 'Not Started', notes: '' },
  { id: 'trees', name: 'Binary Trees & BST', status: 'Not Started', notes: '' },
  { id: 'heaps', name: 'Heaps & Priority Queues', status: 'Not Started', notes: '' },
  { id: 'backtracking', name: 'Backtracking & Recursion', status: 'Not Started', notes: '' },
  { id: 'graphs', name: 'Graphs (BFS/DFS)', status: 'Not Started', notes: '' },
  { id: 'advanced-graphs', name: 'Advanced Graphs (Dijkstra/Union-Find)', status: 'Not Started', notes: '' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', status: 'Not Started', notes: '' },
  { id: 'greedy', name: 'Greedy Algorithms', status: 'Not Started', notes: '' },
  { id: 'bit-manipulation', name: 'Bit Manipulation', status: 'Not Started', notes: '' }
];

// Initialize PostgreSQL client pool
const { Pool } = pg;
let pool = null;

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your_postgres_connection_url_here')) {
  console.log('PostgreSQL DATABASE_URL found. Initializing PostgreSQL pool...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
} else {
  console.log('PostgreSQL DATABASE_URL not configured. Running in JSON file database mode.');
}

// Helper functions to read/write JSON files safely
const readJsonFile = (filePath, defaultVal = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// Database state accessor helpers
const getAllQuestions = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT id, title, difficulty, category, url, description FROM questions');
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getAllQuestions error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }
  return readJsonFile(QUESTIONS_FILE, []);
};

const getSolvedQuestions = async () => {
  if (pool) {
    try {
      const result = await pool.query(`
        SELECT 
          sq.question_id as "questionId", 
          q.title, 
          q.difficulty, 
          q.category, 
          q.url, 
          sq.notes, 
          sq.solved_at as "solvedAt",
          sq.brute_force_theory as "bruteForceTheory",
          sq.optimized_theory as "optimizedTheory",
          sq.repetition,
          sq.review_interval as "reviewInterval",
          sq.easiness,
          sq.next_review_at as "nextReviewAt"
        FROM solved_questions sq
        JOIN questions q ON sq.question_id = q.id
        ORDER BY sq.solved_at DESC
      `);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getSolvedQuestions error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }
  return readJsonFile(SOLVED_FILE, []);
};

const getDsaStructures = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT id, name, status, notes FROM dsa_structures ORDER BY name ASC');
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getDsaStructures error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }
  return readJsonFile(DSA_STRUCTURES_FILE, DEFAULT_DSA_STRUCTURES);
};

const getGuideProgress = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT task_key as "taskKey" FROM guide_task_progress WHERE completed = TRUE');
      return Object.fromEntries(result.rows.map(row => [row.taskKey, true]));
    } catch (err) {
      console.error('PostgreSQL getGuideProgress error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }
  return readJsonFile(GUIDE_PROGRESS_FILE, {});
};

const setGuideTaskProgress = async (taskKey, completed) => {
  if (pool) {
    try {
      if (completed) {
        await pool.query(
          `INSERT INTO guide_task_progress (task_key, completed, updated_at)
           VALUES ($1, TRUE, NOW())
           ON CONFLICT (task_key) DO UPDATE SET completed = TRUE, updated_at = NOW()`,
          [taskKey]
        );
      } else {
        await pool.query('DELETE FROM guide_task_progress WHERE task_key = $1', [taskKey]);
      }
      return;
    } catch (err) {
      console.error('PostgreSQL setGuideTaskProgress error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }

  const progress = readJsonFile(GUIDE_PROGRESS_FILE, {});
  if (completed) {
    progress[taskKey] = true;
  } else {
    delete progress[taskKey];
  }
  writeJsonFile(GUIDE_PROGRESS_FILE, progress);
};

const CUSTOM_GUIDE_PROBLEMS_FILE = path.join(__dirname, 'data', 'custom_guide_problems.json');

const getCustomGuideProblems = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT section_id as "sectionId", title, pattern_note as "patternNote", difficulty, url FROM custom_guide_problems');
      const grouped = {};
      result.rows.forEach(row => {
        if (!grouped[row.sectionId]) grouped[row.sectionId] = [];
        grouped[row.sectionId].push({
          title: row.title,
          patternNote: row.patternNote || '',
          difficulty: row.difficulty,
          url: row.url,
          isCustom: true
        });
      });
      return grouped;
    } catch (err) {
      console.error('PostgreSQL getCustomGuideProblems error, falling back to JSON:', err.message);
    }
  }
  return readJsonFile(CUSTOM_GUIDE_PROBLEMS_FILE, {});
};

const addCustomGuideProblem = async (sectionId, problem) => {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO custom_guide_problems (section_id, title, pattern_note, difficulty, url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (section_id, title) DO UPDATE SET pattern_note = EXCLUDED.pattern_note, difficulty = EXCLUDED.difficulty, url = EXCLUDED.url`,
        [sectionId, problem.title, problem.patternNote, problem.difficulty, problem.url]
      );
      return;
    } catch (err) {
      console.error('PostgreSQL addCustomGuideProblem error, falling back to JSON:', err.message);
    }
  }

  const data = readJsonFile(CUSTOM_GUIDE_PROBLEMS_FILE, {});
  if (!data[sectionId]) data[sectionId] = [];
  
  data[sectionId] = data[sectionId].filter(p => p.title.toLowerCase() !== problem.title.toLowerCase());
  data[sectionId].push({
    title: problem.title,
    patternNote: problem.patternNote,
    difficulty: problem.difficulty,
    url: problem.url,
    isCustom: true
  });
  
  writeJsonFile(CUSTOM_GUIDE_PROBLEMS_FILE, data);
};

const removeCustomGuideProblem = async (sectionId, title) => {
  if (pool) {
    try {
      await pool.query('DELETE FROM custom_guide_problems WHERE section_id = $1 AND LOWER(title) = LOWER($2)', [sectionId, title]);
      return;
    } catch (err) {
      console.error('PostgreSQL removeCustomGuideProblem error, falling back to JSON:', err.message);
    }
  }

  const data = readJsonFile(CUSTOM_GUIDE_PROBLEMS_FILE, {});
  if (data[sectionId]) {
    data[sectionId] = data[sectionId].filter(p => p.title.toLowerCase() !== title.toLowerCase());
    writeJsonFile(CUSTOM_GUIDE_PROBLEMS_FILE, data);
  }
};

const normalizeForMatch = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const parseModelJson = (content) => {
  const withoutFences = String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace
    ? withoutFences.slice(firstBrace, lastBrace + 1)
    : withoutFences;

  try {
    return JSON.parse(jsonText);
  } catch (initialError) {
    let repaired = '';
    let inString = false;
    let escaped = false;

    for (const character of jsonText) {
      if (inString) {
        if (escaped) {
          repaired += character;
          escaped = false;
        } else if (character === '\\') {
          repaired += character;
          escaped = true;
        } else if (character === '"') {
          repaired += character;
          inString = false;
        } else if (character === '\n') {
          repaired += '\\n';
        } else if (character === '\r') {
          repaired += '\\r';
        } else if (character === '\t') {
          repaired += '\\t';
        } else {
          repaired += character;
        }
      } else {
        repaired += character;
        if (character === '"') inString = true;
      }
    }

    try {
      return JSON.parse(repaired);
    } catch {
      throw initialError;
    }
  }
};

const truncateText = (value = '', maxLength = 180) => {
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
};

const getPatternKey = (question = {}) => question.category || question.pattern || 'General';

const buildAiContext = async ({ topic = '', focusGoal = '', launchProblemId = '' } = {}) => {
  const [solved, structures, questions] = await Promise.all([
    getSolvedQuestions(),
    getDsaStructures(),
    getAllQuestions()
  ]);
  const solvedByQuestionId = new Set(solved.map(item => item.questionId));
  const solvedByPattern = new Map();

  solved.forEach(item => {
    const key = getPatternKey(item);
    solvedByPattern.set(key, (solvedByPattern.get(key) || 0) + 1);
  });

  const masteryMap = structures.map(structure => {
    const solvedCount = solvedByPattern.get(structure.name) || solvedByPattern.get(structure.id) || 0;
    const readinessWeight = structure.status === 'Mastered' ? 1 : structure.status === 'Learning' ? 0.55 : 0;
    return {
      id: structure.id,
      name: structure.name,
      status: structure.status,
      solvedCount,
      readinessWeight
    };
  });

  const gaps = masteryMap
    .map(item => {
      const target = item.status === 'Mastered' ? 8 : item.status === 'Learning' ? 5 : 2;
      return { ...item, target, remaining: Math.max(0, target - item.solvedCount) };
    })
    .filter(item => item.status !== 'Mastered' || item.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining || a.readinessWeight - b.readinessWeight)
    .slice(0, 4)
    .map(({ id, name, status, solvedCount, target, remaining }) => ({
      id, name, status, solvedCount, target, remaining
    }));

  const recentActivity = [...solved]
    .sort((a, b) => new Date(b.solvedAt || 0) - new Date(a.solvedAt || 0))
    .slice(0, 8)
    .map(item => ({
      title: item.title,
      pattern: getPatternKey(item),
      difficulty: item.difficulty,
      solvedAt: item.solvedAt,
      timeTaken: item.timeTaken || null,
      confidence: item.confidence || item.selfRatedConfidence || null,
      notesExcerpt: truncateText(item.notes)
    }));

  let launchProblem = null;
  const targetQuery = launchProblemId || topic;
  if (targetQuery) {
    const queryStr = normalizeForMatch(targetQuery);
    if (queryStr) {
      // 1. Exact match priority
      launchProblem = questions.find(q =>
        normalizeForMatch(q.id) === queryStr ||
        normalizeForMatch(q.title) === queryStr
      );

      // 2. Substring & Token-overlap priority
      if (!launchProblem) {
        let bestScore = 0;
        const queryWords = targetQuery.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        
        for (const question of questions) {
          const normTitle = normalizeForMatch(question.title);
          
          if (normTitle.includes(queryStr) || queryStr.includes(normTitle)) {
            launchProblem = question;
            break;
          }

          const titleWords = question.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
          let matchCount = 0;
          
          queryWords.forEach(word => {
            if (titleWords.includes(word)) {
              matchCount++;
            }
          });

          if (matchCount > 0) {
            const score = matchCount / Math.max(queryWords.length, titleWords.length);
            if (score > bestScore && score >= 0.4) {
              bestScore = score;
              launchProblem = question;
            }
          }
        }
      }
    }
  }

  if (launchProblem) {
    console.log(`Matched query "${targetQuery}" to database question: "${launchProblem.title}"`);
  }

  const launchPattern = launchProblem ? getPatternKey(launchProblem) : '';
  const lastRelatedProblem = launchPattern
    ? recentActivity.find(item => normalizeForMatch(item.pattern) === normalizeForMatch(launchPattern)) || null
    : null;
  const topGap = gaps[0];
  const preferredPatterns = [launchPattern, topGap?.name, focusGoal]
    .filter(Boolean)
    .map(normalizeForMatch);
  const nextQuestion = questions.find(question =>
    !solvedByQuestionId.has(question.id) &&
    preferredPatterns.some(pattern =>
      normalizeForMatch(question.category).includes(pattern) ||
      pattern.includes(normalizeForMatch(question.category))
    )
  ) || questions.find(question => !solvedByQuestionId.has(question.id)) || null;

  return {
    focusGoal: truncateText(focusGoal, 140) || null,
    masteryMap,
    recentActivity,
    gaps,
    launchContext: launchProblem ? {
      problem: {
        id: launchProblem.id,
        title: launchProblem.title,
        difficulty: launchProblem.difficulty,
        category: launchProblem.category,
        description: truncateText(launchProblem.description)
      },
      lastRelatedProblem
    } : null,
    nextRecommendation: nextQuestion ? {
      id: nextQuestion.id,
      title: nextQuestion.title,
      difficulty: nextQuestion.difficulty,
      category: nextQuestion.category,
      url: nextQuestion.url,
      reason: topGap
        ? `Targets your ${topGap.name} gap: ${topGap.solvedCount}/${topGap.target} practice target.`
        : 'Builds on your current practice sequence.'
    } : null
  };
};

const createPersonalizedInsight = (context) => {
  const recent = context.recentActivity[0];
  const gap = context.gaps[0];
  const related = context.launchContext?.lastRelatedProblem;

  if (related && context.launchContext?.problem) {
    return `You last solved ${related.title} using ${related.pattern}.${related.notesExcerpt ? ` Your note: "${related.notesExcerpt}"` : ''} ${context.launchContext.problem.title} belongs to the same pattern family.`;
  }
  if (recent && gap) {
    return `Your latest logged problem was ${recent.title} in ${recent.pattern}. ${gap.name} is currently ${gap.status} with ${gap.solvedCount}/${gap.target} problems toward its practice target, so this is a useful next focus.`;
  }
  if (gap) {
    return `${gap.name} is currently ${gap.status} with ${gap.solvedCount}/${gap.target} problems toward its practice target. Build this foundation before moving to a harder tier.`;
  }
  return 'As you log solved problems and topic statuses, I will connect each explanation to your specific practice history.';
};

const getSavedRecommendations = async () => {
  if (pool) {
    try {
      const result = await pool.query('SELECT title, difficulty, category, url, reason FROM ai_recommendations');
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getSavedRecommendations error, disabling DB mode and falling back to JSON:', err.message);
      pool = null;
    }
  }
  return readJsonFile(RECOMMENDATIONS_FILE, []);
};

const saveRecommendations = async (recs) => {
  if (pool) {
    try {
      await pool.query('DELETE FROM ai_recommendations');
      for (const rec of recs) {
        await pool.query(
          'INSERT INTO ai_recommendations (title, difficulty, category, url, reason) VALUES ($1, $2, $3, $4, $5)',
          [rec.title, rec.difficulty, rec.category, rec.url, rec.reason]
        );
      }
      return true;
    } catch (err) {
      console.error('PostgreSQL saveRecommendations error:', err.message);
    }
  }
  return writeJsonFile(RECOMMENDATIONS_FILE, recs);
};

const getCachedProfile = async (username) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT username, real_name as "realName", avatar_url as "avatarUrl", ranking, easy_solved as "easySolved", medium_solved as "mediumSolved", hard_solved as "hardSolved", total_solved as "totalSolved" FROM leetcode_profile WHERE username = $1', [username]);
      if (result.rowCount > 0) {
        return result.rows[0];
      }
    } catch (err) {
      console.error('PostgreSQL getCachedProfile error:', err.message);
    }
  }
  const profiles = readJsonFile(PROFILE_FILE, {});
  return profiles[username] || null;
};

const saveCachedProfile = async (username, profileData) => {
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO leetcode_profile (username, real_name, avatar_url, ranking, easy_solved, medium_solved, hard_solved, total_solved, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (username) DO UPDATE 
        SET real_name = EXCLUDED.real_name, avatar_url = EXCLUDED.avatar_url, ranking = EXCLUDED.ranking, easy_solved = EXCLUDED.easy_solved, medium_solved = EXCLUDED.medium_solved, hard_solved = EXCLUDED.hard_solved, total_solved = EXCLUDED.total_solved, updated_at = NOW()
      `, [
        username,
        profileData.realName || '',
        profileData.avatarUrl || '',
        profileData.ranking || 0,
        profileData.easySolved || 0,
        profileData.mediumSolved || 0,
        profileData.hardSolved || 0,
        profileData.totalSolved || 0
      ]);
      return true;
    } catch (err) {
      console.error('PostgreSQL saveCachedProfile error:', err.message);
    }
  }
  const profiles = readJsonFile(PROFILE_FILE, {});
  profiles[username] = profileData;
  writeJsonFile(PROFILE_FILE, profiles);
  return true;
};

const recordRankingHistory = async (username, ranking) => {
  if (!ranking || ranking <= 0) return;
  
  if (pool) {
    try {
      const lastRecordRes = await pool.query(
        'SELECT ranking, recorded_at FROM leetcode_ranking_history WHERE username = $1 ORDER BY recorded_at DESC LIMIT 1',
        [username]
      );
      
      let shouldInsert = false;
      if (lastRecordRes.rowCount === 0) {
        shouldInsert = true;
      } else {
        const lastRank = lastRecordRes.rows[0].ranking;
        const lastTime = new Date(lastRecordRes.rows[0].recorded_at);
        const hoursSinceLast = (new Date() - lastTime) / (1000 * 60 * 60);
        
        if (lastRank !== ranking || hoursSinceLast >= 24) {
          shouldInsert = true;
        }
      }
      
      if (shouldInsert) {
        await pool.query(
          'INSERT INTO leetcode_ranking_history (username, ranking, recorded_at) VALUES ($1, $2, NOW())',
          [username, ranking]
        );
      }
    } catch (err) {
      console.error('PostgreSQL recordRankingHistory error:', err.message);
    }
    return;
  }
  
  try {
    const history = readJsonFile(RANKING_HISTORY_FILE, {});
    const uKey = username.toLowerCase();
    if (!history[uKey]) {
      history[uKey] = [];
    }
    
    const userHistory = history[uKey];
    let shouldInsert = false;
    
    if (userHistory.length === 0) {
      shouldInsert = true;
    } else {
      const lastRecord = userHistory[userHistory.length - 1];
      const lastRank = lastRecord.ranking;
      const lastTime = new Date(lastRecord.recordedAt);
      const hoursSinceLast = (new Date() - lastTime) / (1000 * 60 * 60);
      
      if (lastRank !== ranking || hoursSinceLast >= 24) {
        shouldInsert = true;
      }
    }
    
    if (shouldInsert) {
      userHistory.push({
        ranking,
        recordedAt: new Date().toISOString()
      });
      writeJsonFile(RANKING_HISTORY_FILE, history);
    }
  } catch (err) {
    console.error('JSON recordRankingHistory error:', err);
  }
};

const getRankingJumps = async (username, currentRanking) => {
  let history = [];
  const uKey = username.toLowerCase();
  
  if (pool) {
    try {
      const result = await pool.query(
        'SELECT ranking, recorded_at as "recordedAt" FROM leetcode_ranking_history WHERE LOWER(username) = LOWER($1) ORDER BY recorded_at ASC',
        [username]
      );
      history = result.rows.map(r => ({
        ranking: r.ranking,
        recordedAt: new Date(r.recordedAt).toISOString()
      }));
    } catch (err) {
      console.error('PostgreSQL getRankingJumps error:', err.message);
    }
  } else {
    const allHistory = readJsonFile(RANKING_HISTORY_FILE, {});
    history = allHistory[uKey] || [];
  }
  
  if (history.length === 0) {
    return { day: 0, week: 0, month: 0, overall: 0 };
  }
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const findClosestRecord = (targetDate) => {
    let closest = null;
    let minDiff = Infinity;
    
    for (const record of history) {
      const recordDate = new Date(record.recordedAt);
      const diff = Math.abs(recordDate - targetDate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = record;
      }
    }
    return closest;
  };
  
  const oldestRecord = history[0];
  
  let dayJump = 0;
  let weekJump = 0;
  let monthJump = 0;
  let overallJump = 0;
  
  if (oldestRecord && currentRanking > 0) {
    overallJump = oldestRecord.ranking - currentRanking;
    
    const dayRecord = findClosestRecord(oneDayAgo);
    if (dayRecord && (now - new Date(dayRecord.recordedAt)) >= 4 * 60 * 60 * 1000) {
      dayJump = dayRecord.ranking - currentRanking;
    }
    
    const weekRecord = findClosestRecord(oneWeekAgo);
    if (weekRecord && (now - new Date(weekRecord.recordedAt)) >= 24 * 60 * 60 * 1000) {
      weekJump = weekRecord.ranking - currentRanking;
    }
    
    const monthRecord = findClosestRecord(oneMonthAgo);
    if (monthRecord && (now - new Date(monthRecord.recordedAt)) >= 5 * 24 * 60 * 60 * 1000) {
      monthJump = monthRecord.ranking - currentRanking;
    }
  }
  
  return {
    day: dayJump,
    week: weekJump,
    month: monthJump,
    overall: overallJump
  };
};

// Helper to query LeetCode Public GraphQL endpoint
const fetchLeetCodeGraphQL = async (query, variables) => {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LeetCode GraphQL error: ${response.status} - ${text}`);
  }
  
  return response.json();
};

const importAllLeetCodeQuestions = async () => {
  let skip = 0;
  const limit = 100;
  let totalImported = 0;
  let hasMore = true;

  console.log('Starting full LeetCode catalog extraction...');

  const query = `
    query problemsetQuestionList($limit: Int!, $skip: Int!) {
      questionList(
        categorySlug: ""
        limit: $limit
        skip: $skip
        filters: {}
      ) {
        totalNum
        questions: data {
          frontendQuestionId: questionId
          title
          titleSlug
          difficulty
          isPaidOnly
          topicTags {
            name
          }
        }
      }
    }
  `;

  while (hasMore) {
    try {
      console.log(`Fetching LeetCode questions: skip=${skip}, limit=${limit}...`);
      const result = await fetchLeetCodeGraphQL(query, { limit, skip });
      const data = result?.data?.questionList;
      if (!data || !data.questions || data.questions.length === 0) {
        hasMore = false;
        break;
      }

      const questionsToSave = data.questions;
      console.log(`Received ${questionsToSave.length} questions from LeetCode. Saving...`);

      if (pool) {
        // Postgres Bulk Upsert Batch Transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const q of questionsToSave) {
            const id = q.titleSlug;
            const title = q.title;
            const difficulty = q.difficulty;
            const category = (q.topicTags && q.topicTags.length > 0) ? q.topicTags[0].name : 'General';
            const url = `https://leetcode.com/problems/${q.titleSlug}/`;
            const description = q.isPaidOnly ? 'Premium LeetCode problem.' : 'Free LeetCode problem.';

            await client.query(
              `INSERT INTO questions (id, title, difficulty, category, url, description) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               ON CONFLICT (id) DO UPDATE 
               SET title = EXCLUDED.title, difficulty = EXCLUDED.difficulty, category = EXCLUDED.category, url = EXCLUDED.url`,
              [id, title, difficulty, category, url, description]
            );
            totalImported++;
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } else {
        // JSON Fallback Mode
        const jsonQuestions = readJsonFile(QUESTIONS_FILE, []);
        for (const q of questionsToSave) {
          const id = q.titleSlug;
          const title = q.title;
          const difficulty = q.difficulty;
          const category = (q.topicTags && q.topicTags.length > 0) ? q.topicTags[0].name : 'General';
          const url = `https://leetcode.com/problems/${q.titleSlug}/`;
          const description = q.isPaidOnly ? 'Premium LeetCode problem.' : 'Free LeetCode problem.';

          const idx = jsonQuestions.findIndex(x => x.id === id);
          const item = { id, title, difficulty, category, url, description };
          
          if (idx >= 0) {
            jsonQuestions[idx] = item;
          } else {
            jsonQuestions.push(item);
          }
          totalImported++;
        }
        writeJsonFile(QUESTIONS_FILE, jsonQuestions);
      }

      skip += limit;
      if (skip >= data.totalNum) {
        hasMore = false;
      }
    } catch (err) {
      console.error('Error during LeetCode batch fetch:', err.message);
      hasMore = false;
      throw err;
    }
  }
  console.log(`Full catalog extraction completed. Total imported: ${totalImported}`);
  return totalImported;
};

// Database Initialization (create tables & seed standard catalog)
const initDb = async () => {
  // Ensure local JSON fallback files are seeded unconditionally
  const jsonExercises = readJsonFile(DSA_EXERCISES_FILE, []);
  if (jsonExercises.length === 0) {
    writeJsonFile(DSA_EXERCISES_FILE, DEFAULT_DSA_EXERCISES);
  }
  const jsonPatterns = readJsonFile(DSA_PATTERNS_FILE, []);
  if (jsonPatterns.length === 0) {
    writeJsonFile(DSA_PATTERNS_FILE, DEFAULT_DSA_PATTERNS);
  }

  // Migrate existing local solved questions to have a 1-day default review interval
  const solvedList = readJsonFile(SOLVED_FILE, []);
  let jsonMigrated = false;
  solvedList.forEach(s => {
    const solvedDate = new Date(s.solvedAt);
    const nextReviewDate = s.nextReviewAt ? new Date(s.nextReviewAt) : null;
    if (!nextReviewDate || nextReviewDate.getTime() <= solvedDate.getTime()) {
      const newNextReview = new Date(solvedDate);
      newNextReview.setDate(newNextReview.getDate() + 1);
      s.nextReviewAt = newNextReview.toISOString();
      if (s.reviewInterval === undefined || s.reviewInterval === 7) {
        s.reviewInterval = 1;
      }
      jsonMigrated = true;
    }
  });
  if (jsonMigrated) {
    writeJsonFile(SOLVED_FILE, solvedList);
  }

  if (!pool) return;
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL.');
    
    // Create Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        description TEXT
      );
    `);
    
    // Create Solved Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS solved_questions (
        question_id VARCHAR(100) PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
        notes TEXT,
        solved_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Solved questions spaced repetition and theory migrations
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS brute_force_theory TEXT;');
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS optimized_theory TEXT;');
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS repetition INT DEFAULT 0;');
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS review_interval INT DEFAULT 1;');
    await client.query('ALTER TABLE solved_questions ALTER COLUMN review_interval SET DEFAULT 1;');
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS easiness DOUBLE PRECISION DEFAULT 2.5;');
    await client.query('ALTER TABLE solved_questions ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP DEFAULT NOW() + INTERVAL \'1 day\';');
    await client.query('ALTER TABLE solved_questions ALTER COLUMN next_review_at SET DEFAULT NOW() + INTERVAL \'1 day\';');
    // Align existing records' review date to be 1 day after they were solved if review date is in the past/unset
    await client.query("UPDATE solved_questions SET next_review_at = solved_at + INTERVAL '1 day', review_interval = 1 WHERE next_review_at <= solved_at OR next_review_at IS NULL;");

    // Create DSA Progress Tracker Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dsa_structures (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
        notes TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create Roadmap Practice Task Progress Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guide_task_progress (
        task_key VARCHAR(200) PRIMARY KEY,
        completed BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create AI Recommendations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        title VARCHAR(255) PRIMARY KEY,
        difficulty VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        reason TEXT NOT NULL
      );
    `);

    // Create Custom Guide Problems Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_guide_problems (
        section_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        pattern_note VARCHAR(255),
        difficulty VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        PRIMARY KEY (section_id, title)
      );
    `);

    // Create LeetCode Profile Cache Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leetcode_profile (
        username VARCHAR(100) PRIMARY KEY,
        real_name VARCHAR(100),
        avatar_url TEXT,
        ranking INT,
        easy_solved INT,
        medium_solved INT,
        hard_solved INT,
        total_solved INT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create LeetCode Ranking History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leetcode_ranking_history (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        ranking INT NOT NULL,
        recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leetcode_ranking_history_username ON leetcode_ranking_history(username);
    `);

    // Create DSA Exercises Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dsa_exercises (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        starter_code TEXT NOT NULL,
        test_cases TEXT NOT NULL,
        solution_code TEXT NOT NULL,
        patterns TEXT NOT NULL,
        tutorial_concept TEXT,
        tutorial_walkthrough TEXT,
        tutorial_trace TEXT,
        starter_code_cpp TEXT
      );
    `);

    // Perform migrations for existing dsa_exercises databases
    await client.query('ALTER TABLE dsa_exercises ADD COLUMN IF NOT EXISTS tutorial_concept TEXT;');
    await client.query('ALTER TABLE dsa_exercises ADD COLUMN IF NOT EXISTS tutorial_walkthrough TEXT;');
    await client.query('ALTER TABLE dsa_exercises ADD COLUMN IF NOT EXISTS tutorial_trace TEXT;');
    await client.query('ALTER TABLE dsa_exercises ADD COLUMN IF NOT EXISTS starter_code_cpp TEXT;');

    // Create DSA Exercise Submissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dsa_exercise_submissions (
        exercise_id VARCHAR(100) REFERENCES dsa_exercises(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        solved_at TIMESTAMP NOT NULL DEFAULT NOW(),
        language VARCHAR(50) NOT NULL DEFAULT 'javascript',
        PRIMARY KEY (exercise_id, language)
      );
    `);

    // Migrate existing dsa_exercise_submissions to support language compounds
    await client.query('ALTER TABLE dsa_exercise_submissions ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT \'javascript\';');
    try {
      await client.query('ALTER TABLE dsa_exercise_submissions DROP CONSTRAINT IF EXISTS dsa_exercise_submissions_pkey;');
      await client.query('ALTER TABLE dsa_exercise_submissions ADD PRIMARY KEY (exercise_id, language);');
    } catch (pkErr) {
      console.log('Skipped dsa_exercise_submissions primary key migration (already set):', pkErr.message);
    }

    // Create DSA Patterns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dsa_patterns (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        key_identifiers TEXT NOT NULL,
        common_problems TEXT NOT NULL,
        sample_template TEXT NOT NULL,
        linked_problems TEXT NOT NULL DEFAULT '[]'
      );
    `);

    // Index creation for scaling & query optimizations (PostgreSQL ONLY)
    console.log('Applying performance indexes for high-volume DSA scaling...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_solved_questions_solved_at ON solved_questions(solved_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_dsa_exercises_category ON dsa_exercises(category);');
    // Migration: add linked_problems column if it doesn't exist yet
    await client.query(`
      ALTER TABLE dsa_patterns ADD COLUMN IF NOT EXISTS linked_problems TEXT NOT NULL DEFAULT '[]';
    `);
    
    // Seed questions table if empty
    const checkQuestions = await client.query('SELECT COUNT(*) FROM questions');
    const qCount = parseInt(checkQuestions.rows[0].count, 10);
    
    if (qCount === 0) {
      console.log('Seeding PostgreSQL database with default LeetCode questions...');
      const questionsSeed = readJsonFile(QUESTIONS_FILE, []);
      for (const q of questionsSeed) {
        await client.query(
          'INSERT INTO questions (id, title, difficulty, category, url, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
          [q.id, q.title, q.difficulty, q.category, q.url, q.description || '']
        );
      }
    }

    // Seed DSA structures table if empty
    const checkDsa = await client.query('SELECT COUNT(*) FROM dsa_structures');
    const dsaCount = parseInt(checkDsa.rows[0].count, 10);

    if (dsaCount === 0) {
      console.log('Seeding PostgreSQL database with interview DSA structures...');
      for (const dsa of DEFAULT_DSA_STRUCTURES) {
        await client.query(
          'INSERT INTO dsa_structures (id, name, status, notes) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [dsa.id, dsa.name, dsa.status, dsa.notes]
        );
      }
    }

    // Seed or Update DSA Patterns table
    console.log('Syncing prebuilt coding patterns with database...');
    for (const p of DEFAULT_DSA_PATTERNS) {
      await client.query(
        `INSERT INTO dsa_patterns (id, name, description, key_identifiers, common_problems, sample_template, linked_problems)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             key_identifiers = EXCLUDED.key_identifiers,
             common_problems = EXCLUDED.common_problems,
             sample_template = EXCLUDED.sample_template,
             linked_problems = EXCLUDED.linked_problems`,
        [p.id, p.name, p.description, p.key_identifiers, p.common_problems, p.sample_template, p.common_problems]
      );
    }

    // Seed or Update DSA Exercises table
    console.log('Syncing tutorial exercises with database...');
    for (const e of DEFAULT_DSA_EXERCISES) {
      await client.query(
        `INSERT INTO dsa_exercises (id, title, description, difficulty, category, starter_code, test_cases, solution_code, patterns, tutorial_concept, tutorial_walkthrough, tutorial_trace, starter_code_cpp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             starter_code = EXCLUDED.starter_code,
             test_cases = EXCLUDED.test_cases,
             solution_code = EXCLUDED.solution_code,
             patterns = EXCLUDED.patterns,
             tutorial_concept = EXCLUDED.tutorial_concept,
             tutorial_walkthrough = EXCLUDED.tutorial_walkthrough,
             tutorial_trace = EXCLUDED.tutorial_trace,
             starter_code_cpp = EXCLUDED.starter_code_cpp`,
        [
          e.id, e.title, e.description, e.difficulty, e.category, e.starter_code, e.test_cases, e.solution_code, e.patterns,
          e.tutorial_concept, e.tutorial_walkthrough, e.tutorial_trace, e.starter_code_cpp
        ]
      );
    }

    // Create Company Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_questions (
        id VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        acceptance VARCHAR(50) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        frequency FLOAT NOT NULL,
        url TEXT NOT NULL,
        PRIMARY KEY (id, company)
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_company_questions_company ON company_questions(company);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_company_questions_difficulty ON company_questions(difficulty);');

    // Seed Company Questions if empty
    const checkCompanyQuestions = await client.query('SELECT COUNT(*) FROM company_questions');
    const cqCount = parseInt(checkCompanyQuestions.rows[0].count, 10);
    if (cqCount < 3000) {
      console.log('Database company questions count is low. Truncating and re-seeding PostgreSQL database...');
      await client.query('TRUNCATE TABLE company_questions;');
      const companyData = readJsonFile(COMPANY_QUESTIONS_FILE, {});
      const allRows = [];
      
      for (const [company, list] of Object.entries(companyData)) {
        for (const q of list) {
          allRows.push({
            id: q.id,
            company,
            title: q.title,
            acceptance: q.acceptance,
            difficulty: q.difficulty,
            frequency: q.frequency,
            url: q.url
          });
        }
      }

      // Chunk size of 200 to prevent parameter limit errors
      const chunkSize = 200;
      for (let i = 0; i < allRows.length; i += chunkSize) {
        const chunk = allRows.slice(i, i + chunkSize);
        let valueStrings = [];
        let valueParams = [];
        let counter = 1;

        for (const row of chunk) {
          valueStrings.push(`($${counter}, $${counter+1}, $${counter+2}, $${counter+3}, $${counter+4}, $${counter+5}, $${counter+6})`);
          valueParams.push(row.id, row.company, row.title, row.acceptance, row.difficulty, row.frequency, row.url);
          counter += 7;
        }

        const query = `
          INSERT INTO company_questions (id, company, title, acceptance, difficulty, frequency, url)
          VALUES ${valueStrings.join(', ')}
          ON CONFLICT DO NOTHING
        `;
        await client.query(query, valueParams);
      }
      console.log('Company-wise questions seeding complete.');
    }
    
    
    console.log('Database seeding & schema updates complete.');
    client.release();
  } catch (err) {
    console.error('PostgreSQL initialization failed:', err.message);
    console.log('Switching backend to local JSON file mode.');
    pool = null; // Disable postgres connection
  }
};

// GET server configuration info
app.get('/api/config', (req, res) => {
  res.json({
    hasApiKey: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here'),
    hasDatabase: !!pool,
    leetcodeUsername: (process.env.LEETCODE_USERNAME && process.env.LEETCODE_USERNAME !== 'your_leetcode_username_here') ? process.env.LEETCODE_USERNAME : ""
  });
});

// GET all questions (paginated, filtered, indexed server-side search)
app.get('/api/questions', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search || '';
  const category = req.query.category || 'All';
  const difficulty = req.query.difficulty || 'All';

  try {
    let resultQuestions = [];
    let totalCount = 0;

    if (pool) {
      // Build PostgreSQL query dynamically
      let queryStr = 'SELECT id, title, difficulty, category, url, description FROM questions WHERE 1=1';
      const queryParams = [];
      let paramCount = 1;

      if (search) {
        queryStr += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      if (category !== 'All') {
        queryStr += ` AND category = $${paramCount}`;
        queryParams.push(category);
        paramCount++;
      }

      if (difficulty !== 'All') {
        queryStr += ` AND difficulty = $${paramCount}`;
        queryParams.push(difficulty);
        paramCount++;
      }

      // First get total matched count
      const countQueryStr = `SELECT COUNT(*) FROM (${queryStr}) as temp`;
      const countResult = await pool.query(countQueryStr, queryParams);
      totalCount = parseInt(countResult.rows[0].count, 10);

      // Now add pagination offsets & order
      queryStr += ` ORDER BY title ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      const qResult = await pool.query(queryStr, queryParams);
      resultQuestions = qResult.rows;

    } else {
      // JSON Fallback Mode
      const allQuestions = readJsonFile(QUESTIONS_FILE, []);
      let filtered = allQuestions;

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(q => 
          q.title.toLowerCase().includes(s) || 
          (q.description && q.description.toLowerCase().includes(s))
        );
      }

      if (category !== 'All') {
        filtered = filtered.filter(q => q.category === category);
      }

      if (difficulty !== 'All') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }

      totalCount = filtered.length;
      
      // Sort alphabetically
      filtered.sort((a, b) => a.title.localeCompare(b.title));

      // Slice for pagination
      resultQuestions = filtered.slice((page - 1) * limit, page * limit);
    }

    res.json({
      questions: resultQuestions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });

  } catch (err) {
    console.error('Failed to query questions:', err);
    res.status(500).json({ error: 'Failed to retrieve questions list' });
  }
});

// GET curriculum stats and categories list (high-speed metadata load)
app.get('/api/questions/stats', async (req, res) => {
  try {
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    let totalCount = 0;
    let categoriesSet = new Set();

    if (pool) {
      const qResult = await pool.query('SELECT difficulty, category FROM questions');
      qResult.rows.forEach(q => {
        if (q.difficulty === 'Easy') easyCount++;
        if (q.difficulty === 'Medium') mediumCount++;
        if (q.difficulty === 'Hard') hardCount++;
        totalCount++;
        if (q.category) categoriesSet.add(q.category);
      });
    } else {
      const allQuestions = readJsonFile(QUESTIONS_FILE, []);
      allQuestions.forEach(q => {
        if (q.difficulty === 'Easy') easyCount++;
        if (q.difficulty === 'Medium') mediumCount++;
        if (q.difficulty === 'Hard') hardCount++;
        totalCount++;
        if (q.category) categoriesSet.add(q.category);
      });
    }

    const categories = ['All', ...Array.from(categoriesSet).sort()];

    res.json({
      totalCount,
      easyCount,
      mediumCount,
      hardCount,
      categories
    });
  } catch (err) {
    console.error('Error fetching questions stats:', err);
    res.status(500).json({ error: 'Failed to fetch catalog statistics' });
  }
});

// GET company-wise interview questions (paginated and filtered)
app.get('/api/company-questions', async (req, res) => {
  const company = req.query.company || 'Google';
  const search = req.query.search || '';
  const difficulty = req.query.difficulty || 'All';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  try {
    if (pool) {
      let queryStr = 'SELECT id, company, title, acceptance, difficulty, frequency, url FROM company_questions WHERE company = $1';
      const queryParams = [company];
      let paramCount = 2;

      if (search) {
        queryStr += ` AND (title ILIKE $${paramCount} OR id ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      if (difficulty !== 'All') {
        queryStr += ` AND difficulty = $${paramCount}`;
        queryParams.push(difficulty);
        paramCount++;
      }

      // Get count
      const countQuery = `SELECT COUNT(*) FROM (${queryStr}) as temp`;
      const countResult = await pool.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].count, 10);

      // Get paginated questions sorted by frequency DESC
      queryStr += ` ORDER BY frequency DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      const qResult = await pool.query(queryStr, queryParams);
      const questions = qResult.rows;

      // Get distinct companies list
      const compResult = await pool.query('SELECT DISTINCT company FROM company_questions ORDER BY company ASC');
      const companies = compResult.rows.map(r => r.company);

      return res.json({
        companies: companies.length > 0 ? companies : ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Uber', 'Bloomberg', 'Netflix'],
        questions,
        totalCount
      });
    }

    // JSON Fallback Mode
    const data = readJsonFile(COMPANY_QUESTIONS_FILE, {});
    const companyList = Object.keys(data);
    
    let questions = data[company] || [];

    if (search) {
      const s = search.toLowerCase();
      questions = questions.filter(q => 
        q.title.toLowerCase().includes(s) || 
        q.id.toString().includes(s)
      );
    }

    if (difficulty !== 'All') {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Sort by frequency descending
    questions.sort((a, b) => b.frequency - a.frequency);

    const totalCount = questions.length;
    const paginated = questions.slice((page - 1) * limit, page * limit);

    res.json({
      companies: companyList,
      questions: paginated,
      totalCount
    });
  } catch (error) {
    console.error('Failed to read company questions:', error);
    res.status(500).json({ error: 'Failed to read company questions data' });
  }
});

// GET auto-expanded questions for a guide section
app.get('/api/guide/auto-expand/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  const search = req.query.search || '';
  const difficulty = req.query.difficulty || 'All';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  const SECTION_CATEGORY_MAP = {
    'arrays': ['Array', 'Two Pointers', 'Matrix', 'Arrays & Hashing', 'Sliding Window'],
    'strings': ['String', 'Sliding Window'],
    'linked-lists': ['Linked List'],
    'stacks': ['Stack', 'Monotonic Stack'],
    'queues': ['Queue', 'Monotonic Queue'],
    'hash-tables': ['Hash Table', 'Arrays & Hashing'],
    'trees': ['Tree', 'Binary Tree', 'Binary Search Tree', 'Trees'],
    'heaps': ['Heap (Priority Queue)', 'Heap / Priority Queue'],
    'tries': ['Trie'],
    'graphs': ['Graph', 'Depth-First Search', 'Breadth-First Search', 'Graphs'],
    'dynamic-programming': ['Dynamic Programming', 'Greedy', 'Backtracking'],
    'advanced': ['Segment Tree', 'Binary Indexed Tree', 'Union Find', 'Bit Manipulation', 'Math & Geometry', 'Advanced']
  };

  const categories = SECTION_CATEGORY_MAP[sectionId] || [];

  if (categories.length === 0) {
    return res.json({ questions: [], totalCount: 0 });
  }

  try {
    let resultQuestions = [];
    let totalCount = 0;

    if (pool) {
      // Postgres implementation
      let queryStr = 'SELECT id, title, difficulty, category, url, description FROM questions WHERE category = ANY($1)';
      const queryParams = [categories];
      let paramCount = 2;

      if (search) {
        queryStr += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      if (difficulty !== 'All') {
        queryStr += ` AND difficulty = $${paramCount}`;
        queryParams.push(difficulty);
        paramCount++;
      }

      // Count query
      const countQueryStr = `SELECT COUNT(*) FROM (${queryStr}) as temp`;
      const countResult = await pool.query(countQueryStr, queryParams);
      totalCount = parseInt(countResult.rows[0].count, 10);

      // Paginated query ordered alphabetically
      queryStr += ` ORDER BY title ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit);
      queryParams.push((page - 1) * limit);

      const qResult = await pool.query(queryStr, queryParams);
      resultQuestions = qResult.rows;
    } else {
      // JSON Fallback implementation
      const allQuestions = readJsonFile(QUESTIONS_FILE, []);
      const lowerCats = categories.map(c => c.toLowerCase());
      let filtered = allQuestions.filter(q => q.category && lowerCats.includes(q.category.toLowerCase()));

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(q => 
          q.title.toLowerCase().includes(s) || 
          (q.description && q.description.toLowerCase().includes(s))
        );
      }

      if (difficulty !== 'All') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }

      totalCount = filtered.length;
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      resultQuestions = filtered.slice((page - 1) * limit, page * limit);
    }

    res.json({
      questions: resultQuestions,
      totalCount
    });
  } catch (err) {
    console.error('Error auto-expanding guide:', err);
    res.status(500).json({ error: 'Failed to auto-expand guide section questions' });
  }
});

// GET all solved questions details
app.get('/api/solved', async (req, res) => {
  try {
    const solved = await getSolvedQuestions();
    res.json(solved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve solved log' });
  }
});

// GET the bounded learning snapshot supplied to the AI coach for a request.
app.get('/api/ai-context', async (req, res) => {
  try {
    const context = await buildAiContext({
      topic: String(req.query.topic || ''),
      focusGoal: String(req.query.focusGoal || ''),
      launchProblemId: String(req.query.launchProblemId || '')
    });
    res.json(context);
  } catch (err) {
    console.error('Failed to assemble AI context:', err);
    res.status(500).json({ error: 'Failed to assemble AI learning context' });
  }
});

// GET all DSA progress topics
app.get('/api/dsa-structures', async (req, res) => {
  try {
    const dsaList = await getDsaStructures();
    res.json(dsaList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve DSA structures checklist' });
  }
});

// GET completed roadmap practice tasks
app.get('/api/guide-progress', async (req, res) => {
  try {
    res.json(await getGuideProgress());
  } catch (err) {
    console.error('Failed to retrieve guide progress:', err);
    res.status(500).json({ error: 'Failed to retrieve guide progress' });
  }
});

// PUT roadmap practice task completion
app.put('/api/guide-progress/:taskKey', async (req, res) => {
  const taskKey = req.params.taskKey;
  const { completed } = req.body;

  if (!/^[a-z0-9-]+$/i.test(taskKey) || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'A valid task key and completed boolean are required' });
  }

  try {
    await setGuideTaskProgress(taskKey, completed);
    res.json({ taskKey, completed });
  } catch (err) {
    console.error('Failed to save guide progress:', err);
    res.status(500).json({ error: 'Failed to save guide progress' });
  }
});

// GET all custom guide problems
app.get('/api/guide/custom-problems', async (req, res) => {
  try {
    const list = await getCustomGuideProblems();
    res.json(list);
  } catch (err) {
    console.error('Failed to retrieve custom guide problems:', err);
    res.status(500).json({ error: 'Failed to retrieve custom guide problems' });
  }
});

// POST add a custom guide problem
app.post('/api/guide/custom-problems', async (req, res) => {
  const { sectionId, problem } = req.body;
  if (!sectionId || !problem || !problem.title || !problem.url || !problem.difficulty) {
    return res.status(400).json({ error: 'Section ID and complete problem details are required.' });
  }
  try {
    await addCustomGuideProblem(sectionId, problem);
    res.json({ success: true, sectionId, problem });
  } catch (err) {
    console.error('Failed to add custom guide problem:', err);
    res.status(500).json({ error: 'Failed to add custom guide problem' });
  }
});

// DELETE remove a custom guide problem
app.delete('/api/guide/custom-problems/:sectionId/:title', async (req, res) => {
  const { sectionId, title } = req.params;
  if (!sectionId || !title) {
    return res.status(400).json({ error: 'Section ID and problem title are required.' });
  }
  try {
    await removeCustomGuideProblem(sectionId, title);
    res.json({ success: true, sectionId, title });
  } catch (err) {
    console.error('Failed to delete custom guide problem:', err);
    res.status(500).json({ error: 'Failed to delete custom guide problem' });
  }
});

// GET currently saved recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const recs = await getSavedRecommendations();
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve saved recommendations' });
  }
});

// POST mark a question as solved
app.post('/api/solved', async (req, res) => {
  const { 
    questionId, 
    notes, 
    difficulty, 
    category, 
    title, 
    url, 
    solvedAt,
    bruteForceTheory,
    optimizedTheory,
    repetition,
    reviewInterval,
    easiness,
    nextReviewAt
  } = req.body;
  
  if (!questionId) {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  try {
    if (pool) {
      // Ensure question exists in catalog (or insert it if it is a custom question)
      const qCheck = await pool.query('SELECT * FROM questions WHERE id = $1', [questionId]);
      if (qCheck.rowCount === 0 && title) {
        await pool.query(
          'INSERT INTO questions (id, title, difficulty, category, url, description) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            questionId,
            title,
            difficulty || 'Medium',
            category || 'General',
            url || `https://leetcode.com/problems/${questionId}/`,
            'Custom question added by user.'
          ]
        );
      }

      // Insert or update solved status
      await pool.query(`
        INSERT INTO solved_questions (
          question_id, notes, solved_at, 
          brute_force_theory, optimized_theory, 
          repetition, review_interval, easiness, next_review_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (question_id) DO UPDATE 
        SET 
          notes = EXCLUDED.notes, 
          solved_at = EXCLUDED.solved_at,
          brute_force_theory = COALESCE(EXCLUDED.brute_force_theory, solved_questions.brute_force_theory),
          optimized_theory = COALESCE(EXCLUDED.optimized_theory, solved_questions.optimized_theory),
          repetition = COALESCE(EXCLUDED.repetition, solved_questions.repetition),
          review_interval = COALESCE(EXCLUDED.review_interval, solved_questions.review_interval),
          easiness = COALESCE(EXCLUDED.easiness, solved_questions.easiness),
          next_review_at = COALESCE(EXCLUDED.next_review_at, solved_questions.next_review_at)
      `, [
        questionId, 
        notes || '', 
        solvedAt || new Date().toISOString(),
        bruteForceTheory || null,
        optimizedTheory || null,
        repetition !== undefined ? parseInt(repetition) : null,
        reviewInterval !== undefined ? parseInt(reviewInterval) : null,
        easiness !== undefined ? parseFloat(easiness) : null,
        nextReviewAt || null
      ]);

      return res.json({ success: true });
    }

    // JSON Fallback Mode
    const solvedList = readJsonFile(SOLVED_FILE, []);
    const questions = readJsonFile(QUESTIONS_FILE, []);
    
    let question = questions.find(q => q.id === questionId);
    if (!question && title) {
      question = {
        id: questionId,
        title,
        difficulty: difficulty || 'Medium',
        category: category || 'General',
        url: url || `https://leetcode.com/problems/${questionId}/`,
        description: 'Custom question added by user.'
      };
      questions.push(question);
      writeJsonFile(QUESTIONS_FILE, questions);
    }

    const existingSolvedIdx = solvedList.findIndex(s => s.questionId === questionId);
    const existingItem = existingSolvedIdx >= 0 ? solvedList[existingSolvedIdx] : {};
    
    // Calculate default next review for new solved items (1 day from now)
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    const solvedItem = {
      questionId,
      title: title || existingItem.title || (question ? question.title : 'Unknown Question'),
      difficulty: difficulty || existingItem.difficulty || (question ? question.difficulty : 'Medium'),
      category: category || existingItem.category || (question ? question.category : 'General'),
      url: url || existingItem.url || (question ? question.url : ''),
      notes: notes !== undefined ? notes : (existingItem.notes || ''),
      solvedAt: solvedAt || existingItem.solvedAt || new Date().toISOString(),
      bruteForceTheory: bruteForceTheory !== undefined ? bruteForceTheory : (existingItem.bruteForceTheory || ''),
      optimizedTheory: optimizedTheory !== undefined ? optimizedTheory : (existingItem.optimizedTheory || ''),
      repetition: repetition !== undefined ? parseInt(repetition) : (existingItem.repetition || 0),
      reviewInterval: reviewInterval !== undefined ? parseInt(reviewInterval) : (existingItem.reviewInterval || 1),
      easiness: easiness !== undefined ? parseFloat(easiness) : (existingItem.easiness || 2.5),
      nextReviewAt: nextReviewAt !== undefined ? nextReviewAt : (existingItem.nextReviewAt || nextDay.toISOString())
    };

    if (existingSolvedIdx >= 0) {
      solvedList[existingSolvedIdx] = solvedItem;
    } else {
      solvedList.push(solvedItem);
    }

    writeJsonFile(SOLVED_FILE, solvedList);
    res.json({ success: true, data: solvedItem });

  } catch (err) {
    console.error('Error saving solved question:', err);
    res.status(500).json({ error: 'Failed to record solved question' });
  }
});

// POST update DSA structure progress
app.post('/api/dsa-structures', async (req, res) => {
  const { id, status, notes } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: 'ID and status are required' });
  }

  try {
    if (pool) {
      const name = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      await pool.query(`
        INSERT INTO dsa_structures (id, name, status, notes, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
      `, [id, name, status, notes || '']);
      return res.json({ success: true });
    }

    // JSON Fallback Mode
    const dsaList = readJsonFile(DSA_STRUCTURES_FILE, DEFAULT_DSA_STRUCTURES);
    const idx = dsaList.findIndex(d => d.id === id);
    if (idx >= 0) {
      dsaList[idx].status = status;
      dsaList[idx].notes = notes || '';
      writeJsonFile(DSA_STRUCTURES_FILE, dsaList);
      return res.json({ success: true });
    }
    
    res.status(404).json({ error: 'DSA structure not found' });
  } catch (err) {
    console.error('Error updating DSA progress:', err);
    res.status(500).json({ error: 'Failed to update data structure progress' });
  }
});

// DELETE remove a question from solved list
app.delete('/api/solved/:id', async (req, res) => {
  const questionId = req.params.id;

  try {
    if (pool) {
      await pool.query('DELETE FROM solved_questions WHERE question_id = $1', [questionId]);
      return res.json({ success: true, message: 'Question removed from database solved list' });
    }

    // JSON Fallback Mode
    let solvedList = readJsonFile(SOLVED_FILE, []);
    solvedList = solvedList.filter(s => s.questionId !== questionId);
    writeJsonFile(SOLVED_FILE, solvedList);
    res.json({ success: true, message: 'Question removed from local solved list' });

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete solved question' });
  }
});

// POST add a custom question to the catalog
app.post('/api/questions', async (req, res) => {
  const { title, difficulty, category, url, description } = req.body;
  
  if (!title || !difficulty || !category) {
    return res.status(400).json({ error: 'Title, difficulty, and category are required' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = slug || Date.now().toString();

  try {
    if (pool) {
      const check = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
      if (check.rowCount > 0) {
        return res.status(400).json({ error: 'A question with this title or ID already exists.' });
      }

      await pool.query(
        'INSERT INTO questions (id, title, difficulty, category, url, description) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          id,
          title,
          difficulty,
          category,
          url || `https://leetcode.com/problems/${slug}/`,
          description || 'User added custom question.'
        ]
      );
      
      return res.json({ success: true, data: { id, title, difficulty, category, url, description } });
    }

    // JSON Fallback Mode
    const questions = readJsonFile(QUESTIONS_FILE, []);
    if (questions.some(q => q.id === id)) {
      return res.status(400).json({ error: 'A question with this title or ID already exists.' });
    }

    const newQuestion = {
      id,
      title,
      difficulty,
      category,
      url: url || `https://leetcode.com/problems/${slug}/`,
      description: description || 'User added custom question.'
    };

    questions.push(newQuestion);
    writeJsonFile(QUESTIONS_FILE, questions);
    res.json({ success: true, data: newQuestion });

  } catch (err) {
    res.status(500).json({ error: 'Failed to create new question' });
  }
});

// GET LeetCode user profile stats (with DB caching / failsafe offline reads)
app.get('/api/leetcode/profile', async (req, res) => {
  const username = process.env.LEETCODE_USERNAME;
  if (!username || username === 'your_leetcode_username_here') {
    return res.status(400).json({ error: 'LeetCode username not configured in .env file' });
  }

  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          userAvatar
          ranking
          realName
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  try {
    const data = await fetchLeetCodeGraphQL(query, { username });
    if (!data.data.matchedUser) {
      // User not found on LeetCode, return cached if exists
      const cached = await getCachedProfile(username);
      if (cached) {
        const jumps = await getRankingJumps(username, cached.ranking || 0);
        return res.json({
          ...cached,
          rankingJumps: jumps
        });
      }
      return res.status(404).json({ error: `LeetCode user "${username}" not found on LeetCode.` });
    }

    const mUser = data.data.matchedUser;
    const profile = mUser.profile;
    const stats = mUser.submitStats.acSubmissionNum;

    const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;

    const profileData = {
      username: mUser.username,
      realName: profile.realName || '',
      avatarUrl: profile.userAvatar || '',
      ranking: profile.ranking || 0,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSolved
    };

    await saveCachedProfile(username, profileData);
    await recordRankingHistory(username, profileData.ranking);
    const jumps = await getRankingJumps(username, profileData.ranking);
    res.json({
      ...profileData,
      rankingJumps: jumps
    });

  } catch (err) {
    console.warn('Error fetching LeetCode profile directly, falling back to cache:', err.message);
    const cached = await getCachedProfile(username);
    if (cached) {
      const jumps = await getRankingJumps(username, cached.ranking || 0);
      return res.json({
        ...cached,
        rankingJumps: jumps
      });
    }
    res.status(500).json({ error: 'Failed to fetch LeetCode profile statistics' });
  }
});

// POST sync recent accepted submissions from LeetCode
app.post('/api/leetcode/sync', async (req, res) => {
  const username = process.env.LEETCODE_USERNAME;
  if (!username || username === 'your_leetcode_username_here') {
    return res.status(400).json({ error: 'LeetCode username not configured in .env file' });
  }

  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    console.log(`Syncing submissions for LeetCode user: ${username}`);
    const data = await fetchLeetCodeGraphQL(query, { username, limit: 30 });
    const submissions = data.data.recentAcSubmissionList || [];
    
    if (submissions.length === 0) {
      return res.json({ success: true, syncedCount: 0, message: 'No recent accepted submissions found.' });
    }

    const allQuestions = await getAllQuestions();
    const solvedList = await getSolvedQuestions();
    
    let syncedCount = 0;
    const syncedTitles = [];

    for (const sub of submissions) {
      const alreadySolved = solvedList.some(s => 
        s.questionId === sub.titleSlug || 
        s.title.toLowerCase() === sub.title.toLowerCase()
      );

      if (alreadySolved) continue;

      let question = allQuestions.find(q => 
        q.id === sub.titleSlug || 
        q.title.toLowerCase() === sub.title.toLowerCase()
      );

      if (!question) {
        const difficulty = 'Medium';
        const category = 'Imported';
        const url = `https://leetcode.com/problems/${sub.titleSlug}/`;
        
        if (pool) {
          await pool.query(
            'INSERT INTO questions (id, title, difficulty, category, url, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
            [sub.titleSlug, sub.title, difficulty, category, url, 'Imported from LeetCode activity.']
          );
        } else {
          const jsonQuestions = readJsonFile(QUESTIONS_FILE, []);
          jsonQuestions.push({
            id: sub.titleSlug,
            title: sub.title,
            difficulty,
            category,
            url,
            description: 'Imported from LeetCode activity.'
          });
          writeJsonFile(QUESTIONS_FILE, jsonQuestions);
        }
        question = { id: sub.titleSlug, title: sub.title, difficulty, category, url };
      }

      const solvedAt = new Date(parseInt(sub.timestamp, 10) * 1000).toISOString();
      const notes = 'Synced from LeetCode activity.';

      if (pool) {
        await pool.query(`
          INSERT INTO solved_questions (question_id, notes, solved_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (question_id) DO UPDATE 
          SET solved_at = EXCLUDED.solved_at
        `, [question.id, notes, solvedAt]);
      } else {
        const jsonSolved = readJsonFile(SOLVED_FILE, []);
        jsonSolved.push({
          questionId: question.id,
          title: question.title,
          difficulty: question.difficulty,
          category: question.category,
          url: question.url,
          notes,
          solvedAt
        });
        writeJsonFile(SOLVED_FILE, jsonSolved);
      }

      syncedCount++;
      syncedTitles.push(sub.title);
    }

    res.json({ 
      success: true, 
      syncedCount, 
      syncedTitles,
      message: syncedCount > 0 
        ? `Successfully synced ${syncedCount} solved problems from LeetCode!` 
        : 'Your dashboard is fully in sync with your recent LeetCode activity.'
    });

  } catch (err) {
    console.error('Error syncing LeetCode submissions:', err);
    res.status(500).json({ error: err.message || 'Failed to sync submissions' });
  }
});

// POST extract and seed every single LeetCode question in DB/JSON (scaling extraction)
app.post('/api/leetcode/import-all', async (req, res) => {
  try {
    const count = await importAllLeetCodeQuestions();
    res.json({
      success: true,
      count,
      message: `Successfully extracted and stored all ${count} LeetCode problems in your database!`
    });
  } catch (err) {
    console.error('Failed to extract all problems:', err);
    res.status(500).json({ error: err.message || 'Full extraction failed.' });
  }
});

// POST get recommendations from AI (OpenRouter)
app.post('/api/recommend', async (req, res) => {
  let userApiKey = req.headers['x-openrouter-key'];
  if (userApiKey === 'null' || userApiKey === 'undefined' || userApiKey === '') {
    userApiKey = null;
  }
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
  const { model = 'openrouter/free', customInstruction = '' } = req.body;

  let solvedList = [];
  let allQuestions = [];
  let learningContext;
  try {
    learningContext = await buildAiContext({ focusGoal: customInstruction });
    solvedList = await getSolvedQuestions();
    allQuestions = await getAllQuestions();
  } catch (dbErr) {
    console.error('Error fetching data for recommendations:', dbErr);
  }

  const unsolvedQuestions = allQuestions.filter(q => !solvedList.some(s => s.questionId === q.id));

  // Helper to generate rule-based smart backup recommendations
  const getBackupRecommendations = () => {
    const mockRecs = [];
    const solvedDifficulties = solvedList.map(s => s.difficulty);
    const countDifficulties = (diff) => solvedDifficulties.filter(d => d === diff).length;
    
    let targetDifficulty = 'Easy';
    if (countDifficulties('Easy') > 2) targetDifficulty = 'Medium';
    if (countDifficulties('Medium') > 2) targetDifficulty = 'Hard';

    const topGap = learningContext?.gaps?.[0];
    const poolOfChoices = unsolvedQuestions.filter(q =>
      q.difficulty === targetDifficulty &&
      (!topGap || normalizeForMatch(q.category).includes(normalizeForMatch(topGap.name)))
    );
    const selections = poolOfChoices.length > 0 ? poolOfChoices : unsolvedQuestions;
    const selected = selections.slice(0, 3);
    
    selected.forEach(q => {
      mockRecs.push({
        title: q.title,
        difficulty: q.difficulty,
        category: q.category,
        url: q.url,
        reason: topGap
          ? `[Gap-driven Path] ${topGap.name} is ${topGap.solvedCount}/${topGap.target} toward its current practice target. This ${q.difficulty} ${q.category} problem directly closes that gap.`
          : `[Backup Path] This ${q.difficulty} challenge in ${q.category} is a logical next step based on your current practice progress.`
      });
    });

    if (mockRecs.length === 0) {
      allQuestions.slice(0, 3).forEach(q => {
        mockRecs.push({
          title: q.title,
          difficulty: q.difficulty,
          category: q.category,
          url: q.url,
          reason: `Get started with the classic "${q.title}" to build a solid foundation in ${q.category}.`
        });
      });
    }
    return mockRecs;
  };

  // If no API key configured, return mock recommendations
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.log('No OpenRouter API key configured. Providing mock recommendations.');
    const backupRecs = getBackupRecommendations();
    await saveRecommendations(backupRecs);
    return res.json({ 
      recommendations: backupRecs,
      isMock: true,
      message: 'Mock Mode: Configure OPENROUTER_API_KEY in your server-side .env file to get AI recommendations.'
    });
  }

  // System & User Prompts
  const systemPrompt = `You are a world-class algorithm coach and LeetCode mentor.
Your job is to recommend exactly 3 to 4 LeetCode questions that the user should solve next from their structured learning snapshot.
Use the focus goal and gaps to select questions. Reasons must explicitly mention a concrete number, status, or note from the snapshot when one exists; never invent user history.
Write every response field in English only.
Return your response ONLY as a valid JSON object matching this schema:
{
  "recommendations": [
    {
      "title": "Question Name",
      "difficulty": "Easy" | "Medium" | "Hard",
      "category": "Topic Name (e.g. Arrays, Trees, DP)",
      "url": "https://leetcode.com/problems/slug-name/",
      "reason": "Detailed, specific explanation of why this question is recommended based on their progress and what concepts they will master."
    }
  ]
}
Do not include any Markdown tags, backticks, or extra text. Output only raw, clean JSON.`;

  const unsolvedSummary = unsolvedQuestions.slice(0, 20).map(q => `- ${q.title} (${q.difficulty}, Category: ${q.category})`).join('\n');

  const userPrompt = `Structured learner context (source of truth):
${JSON.stringify(learningContext)}

Here is a pool of popular questions I haven't solved yet (you can recommend these, or other standard LeetCode questions):
${unsolvedSummary || 'No pre-seeded unsolved questions left.'}

${customInstruction ? `Custom goal/instruction: ${customInstruction}` : ''}

Please recommend 3-4 specific LeetCode questions that represent the best learning path for me right now. Ensure the URLs are correct. Make sure the JSON output is strictly valid and contains only the JSON.`;

  // Candidate models to try in sequence if rate-limited or unavailable
  const modelsToTry = [
    model, // User's selected model (e.g. openrouter/free)
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'qwen/qwen-2-7b-instruct:free'
  ];

  let lastError = null;

  for (const candidateModel of modelsToTry) {
    try {
      console.log(`Attempting AI recommendation with model: ${candidateModel}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'NeedCode LeetCode Recommender'
        },
        body: JSON.stringify({
          model: candidateModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Model returned an empty content string.');
      }

      // Parse JSON safely
      const parsedData = parseModelJson(content);

      if (!parsedData.recommendations || !Array.isArray(parsedData.recommendations)) {
        throw new Error('Response format is missing "recommendations" array.');
      }

      // Success! Save to database & Return the recommendations
      console.log(`AI recommendations generated successfully using: ${candidateModel}`);
      await saveRecommendations(parsedData.recommendations);
      return res.json({
        recommendations: parsedData.recommendations,
        isMock: false,
        modelUsed: candidateModel
      });

    } catch (err) {
      console.warn(`Model ${candidateModel} failed: ${err.message || err}`);
      lastError = err;
    }
  }

  // If we reach this point, all models failed
  console.error('All OpenRouter models failed. Falling back to local smart recommendation generator.', lastError);
  
  const backupRecs = getBackupRecommendations();
  await saveRecommendations(backupRecs);

  res.json({
    recommendations: backupRecs,
    isMock: true,
    message: `OpenRouter is currently overloaded or rate-limited. Showing smart practice paths as a backup. (Details: ${lastError ? lastError.message : 'Timeout'})`
  });
});

// POST ask AI to explain a data structure or problem
app.post('/api/explain', async (req, res) => {
  let userApiKey = req.headers['x-openrouter-key'];
  if (userApiKey === 'null' || userApiKey === 'undefined' || userApiKey === '') {
    userApiKey = null;
  }
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
  const { topic, hintOnly, focusGoal = '', launchProblemId = '', conversation = [], model = 'openrouter/free' } = req.body; // hintOnly: true returns only patternTag + constraintReading

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  let learningContext;
  try {
    learningContext = await buildAiContext({ topic, focusGoal, launchProblemId });
  } catch (err) {
    console.error('Failed to assemble explanation context:', err);
    return res.status(500).json({ error: 'Failed to assemble personalized learning context' });
  }
  const personalizedInsight = createPersonalizedInsight(learningContext);
  const conversationHistory = Array.isArray(conversation) ? conversation.slice(-6) : [];

  // If no API key configured, return mock explanation
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.log('No OpenRouter API key configured. Providing mock explanation.');
    if (hintOnly) {
      return res.json({
        hintOnly: true,
        conceptName: topic,
        patternTag: 'Sliding Window (Variable Size)',
        constraintReading: `n ≤ 10⁵ → O(N) or O(N log N) required. An O(N²) brute force would time out.`,
        personalizedInsight
      });
    }
    return res.json({
      hintOnly: false,
      conceptName: topic,
      patternTag: 'Sliding Window (Variable Size)',
      constraintReading: `n ≤ 10⁵ → O(N) or O(N log N) required. An O(N²) brute force would time out.`,
      bruteForceOptimizedBridge: `**Brute Force:** Check every possible subarray/substring pair — O(N²) time.\n\n**Why it fails at scale:** With N = 10⁵, 10¹⁰ operations would time out.\n\n**Optimized:** Use a sliding window: expand the right pointer, contract the left when the constraint is violated — O(N) total.`,
      dryRunTrace: `Input: s = "abcabcbb"\nWindow [a] → valid → max=1\nWindow [ab] → valid → max=2\nWindow [abc] → valid → max=3\nWindow [abca] → 'a' repeats → shrink: [bca] → max=3\n...Final answer: 3`,
      complexity: 'Time Complexity: O(N) | Space Complexity: O(K) where K = charset size',
      pitfalls: [
        'Off-by-one when updating start pointer',
        'Forgetting to update the character map when shrinking',
        'Edge case: empty string → return 0'
      ],
      codeImplementation: `#include <algorithm>\n#include <string>\n#include <unordered_map>\n\nusing namespace std;\n\nclass Solution {\npublic:\n  int lengthOfLongestSubstring(string s) {\n    unordered_map<char, int> lastSeen;\n    int start = 0;\n    int maxLength = 0;\n\n    for (int end = 0; end < static_cast<int>(s.size()); ++end) {\n      if (lastSeen.count(s[end])) {\n        start = max(start, lastSeen[s[end]] + 1);\n      }\n      lastSeen[s[end]] = end;\n      maxLength = max(maxLength, end - start + 1);\n    }\n\n    return maxLength;\n  }\n};`,
      followUpVariations: [
        'What if the string contains only lowercase letters? (Optimize space to O(26))',
        'What if you can allow at most K distinct characters?',
        'What if duplicates are allowed up to K times?'
      ],
      transferability: [
        'Minimum Window Substring uses the same expand/contract window',
        'Fruit Into Baskets is a direct analog with K=2 distinct elements',
        'Max Consecutive Ones III generalizes to flipping K zeros'
      ],
      personalizedInsight,
      nextRecommendedProblem: learningContext.nextRecommendation
        ? `${learningContext.nextRecommendation.title} — ${learningContext.nextRecommendation.reason}`
        : 'Minimum Size Subarray Sum — same variable-window pattern, now with a numeric target instead of a uniqueness constraint.'
    });
  }

  const hintSchema = `{
  "hintOnly": true,
  "conceptName": "string",
  "patternTag": "One-line pattern label, e.g. 'Sliding Window (Variable Size)'",
  "constraintReading": "Short callout: translate the problem constraints into expected complexity, e.g. 'n ≤ 10⁵ → O(N) required, rules out O(N²) brute force.'",
  "personalizedInsight": "One or two sentences referencing a specific item from the learner snapshot"
}`;

  const fullSchema = `{
  "hintOnly": false,
  "conceptName": "string — title of the concept or problem",
  "patternTag": "One-line pattern label, e.g. 'Sliding Window (Variable Size)'",
  "constraintReading": "Short callout translating constraints to target complexity — 1–2 sentences",
  "bruteForceOptimizedBridge": "Markdown string: describe the brute force approach, then explain exactly WHY it fails at scale (TLE/MLE), then derive the optimized approach step by step",
  "dryRunTrace": "Step-by-step trace of the algorithm on a small example input (3–6 steps). Show variable states at each step.",
  "complexity": "Time Complexity: O(...) | Space Complexity: O(...)",
  "pitfalls": ["common pitfall 1", "common pitfall 2", "edge case 3"],
  "codeImplementation": "Clean C++17 in LeetCode submission format: include necessary headers, then using namespace std;, then class Solution with the expected public method signature. Never include main() or code comments. Use <algorithm> and standard helpers such as sort, max, min, or reverse whenever they make the solution clearer.",
  "followUpVariations": ["Follow-up question 1 simulating an interviewer constraint", "Follow-up 2", "Follow-up 3"],
  "transferability": ["Other problem or pattern where this strategy directly applies 1", "2", "3"],
  "personalizedInsight": "One or two sentences referencing a specific item from the learner snapshot. Do not invent history.",
  "nextRecommendedProblem": "Name + one-sentence reason — use the provided nextRecommendation when available"
}`;

  const systemPrompt = hintOnly
    ? `You are a world-class algorithm coach. The user wants a HINT ONLY (not a full solution). Use the learner snapshot to make the personalizedInsight specific. Write every response field in English only. Return ONLY a JSON object matching this exact schema — no markdown, no extra text:
${hintSchema}`
    : `You are a world-class algorithm coach. Teach the user HOW TO THINK about this algorithm or problem — not just the answer. Your explanation must build intuition from brute force to optimal solution. Use the learner snapshot: explicitly reference a concrete solved problem, note, topic status, count, or focus goal in personalizedInsight when available. Do not make up learner facts. Write every response field in English only.
Return ONLY a valid JSON object matching this exact schema — no markdown, no backticks, no extra text:
${fullSchema}`;

  const userPrompt = hintOnly
    ? `Learner snapshot:\n${JSON.stringify(learningContext)}\n\nRecent Learn-session conversation:\n${JSON.stringify(conversationHistory)}\n\nGive me a hint (pattern tag + constraint reading only) for: ${topic}`
    : `Learner snapshot:\n${JSON.stringify(learningContext)}\n\nRecent Learn-session conversation:\n${JSON.stringify(conversationHistory)}\n\nFully explain the algorithm/pattern/problem: "${topic}". Focus on teaching insight and intuition. Make the dry run trace concrete with real variable values. Make code clean and well-commented.`;

  const modelsToTry = [
    model,
    'openrouter/free',
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free'
  ];

  let lastError = null;

  for (const candidateModel of modelsToTry) {
    try {
      console.log(`Explaining "${topic}" (hintOnly=${!!hintOnly}) using model: ${candidateModel}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'NeedCode LeetCode Recommender'
        },
        body: JSON.stringify({
          model: candidateModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter error status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Model returned empty content.');
      }

      const parsedData = parseModelJson(content);
      
      console.log(`Explanation generated successfully using: ${candidateModel}`);
      return res.json({
        ...parsedData,
        personalizedInsight: parsedData.personalizedInsight || personalizedInsight,
        nextRecommendedProblem: parsedData.nextRecommendedProblem || (learningContext.nextRecommendation
          ? `${learningContext.nextRecommendation.title} — ${learningContext.nextRecommendation.reason}`
          : undefined)
      });

    } catch (err) {
      console.warn(`Explanation model ${candidateModel} failed: ${err.message}`);
      lastError = err;
    }
  }

  // Fallback if all AI queries fail
  res.json({
    hintOnly: false,
    conceptName: topic,
    patternTag: 'Unknown Pattern',
    constraintReading: 'Could not determine constraints automatically.',
    bruteForceOptimizedBridge: `Failed to query AI explanation (${lastError ? lastError.message : 'Timeout'}). Try again or check your API key.`,
    dryRunTrace: 'Trace unavailable.',
    complexity: 'Time Complexity: O(?) | Space Complexity: O(?)',
    pitfalls: ['Review official editorial solutions.', 'Trace the code step-by-step with simple test cases.'],
    codeImplementation: '',
    followUpVariations: ['Check LeetCode discuss tab for follow-up questions.'],
    transferability: ['Review similar tagged problems on LeetCode.'],
    personalizedInsight,
    nextRecommendedProblem: learningContext.nextRecommendation
      ? `${learningContext.nextRecommendation.title} — ${learningContext.nextRecommendation.reason}`
      : 'Browse LeetCode by the same tag as this problem.'
  });
});

// GET all prebuilt DSA exercises with completion status
app.get('/api/exercises', async (req, res) => {
  try {
    if (pool) {
      const q = `
        SELECT 
          e.id, e.title, e.description, e.difficulty, e.category, 
          e.starter_code as "starterCode", e.starter_code_cpp as "starterCodeCpp",
          e.test_cases as "testCases", e.patterns, e.tutorial_concept as "tutorialConcept",
          e.tutorial_walkthrough as "tutorialWalkthrough", e.tutorial_trace as "tutorialTrace",
          sub_js.code as "submittedCodeJS", sub_js.status as "submissionStatusJS",
          sub_cpp.code as "submittedCodeCPP", sub_cpp.status as "submissionStatusCPP"
        FROM dsa_exercises e
        LEFT JOIN dsa_exercise_submissions sub_js ON e.id = sub_js.exercise_id AND sub_js.language = 'javascript'
        LEFT JOIN dsa_exercise_submissions sub_cpp ON e.id = sub_cpp.exercise_id AND sub_cpp.language = 'cpp'
        ORDER BY e.title ASC
      `;
      const result = await pool.query(q);
      const exercises = result.rows.map(row => ({
        ...row,
        testCases: JSON.parse(row.testCases),
        patterns: JSON.parse(row.patterns)
      }));
      res.json(exercises);
    } else {
      const exercises = readJsonFile(DSA_EXERCISES_FILE, DEFAULT_DSA_EXERCISES);
      const submissions = readJsonFile(DSA_EXERCISE_SUBMISSIONS_FILE, {});
      
      const mapped = exercises.map(e => {
        const exerciseSubmissions = submissions[e.id] || {};
        const subJS = exerciseSubmissions['javascript'] || null;
        const subCPP = exerciseSubmissions['cpp'] || null;
        return {
          id: e.id,
          title: e.title,
          description: e.description,
          difficulty: e.difficulty,
          category: e.category,
          starterCode: e.starter_code,
          starterCodeCpp: e.starter_code_cpp,
          testCases: typeof e.test_cases === 'string' ? JSON.parse(e.test_cases) : e.test_cases,
          patterns: typeof e.patterns === 'string' ? JSON.parse(e.patterns) : e.patterns,
          tutorialConcept: e.tutorial_concept,
          tutorialWalkthrough: e.tutorial_walkthrough,
          tutorialTrace: e.tutorial_trace,
          submittedCodeJS: subJS ? subJS.code : null,
          submissionStatusJS: subJS ? subJS.status : null,
          submittedCodeCPP: subCPP ? subCPP.code : null,
          submissionStatusCPP: subCPP ? subCPP.status : null
        };
      });
      res.json(mapped);
    }
  } catch (err) {
    console.error('Failed to get exercises:', err);
    res.status(500).json({ error: 'Failed to retrieve exercises list' });
  }
});

// POST submit a solution for an exercise
app.post('/api/exercises/submit', async (req, res) => {
  const { exerciseId, code, status, language = 'javascript' } = req.body;
  if (!exerciseId || !code || !status) {
    return res.status(400).json({ error: 'exerciseId, code, and status are required' });
  }

  try {
    if (pool) {
      const queryStr = `
        INSERT INTO dsa_exercise_submissions (exercise_id, code, status, language, solved_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (exercise_id, language) DO UPDATE
        SET code = EXCLUDED.code, status = EXCLUDED.status, solved_at = NOW()
      `;
      await pool.query(queryStr, [exerciseId, code, status, language]);
    } else {
      const submissions = readJsonFile(DSA_EXERCISE_SUBMISSIONS_FILE, {});
      if (!submissions[exerciseId]) {
        submissions[exerciseId] = {};
      }
      submissions[exerciseId][language] = {
        code,
        status,
        solved_at: new Date().toISOString()
      };
      writeJsonFile(DSA_EXERCISE_SUBMISSIONS_FILE, submissions);
    }
    res.json({ message: 'Submission saved successfully!' });
  } catch (err) {
    console.error('Failed to save submission:', err);
    res.status(500).json({ error: 'Failed to save exercise submission' });
  }
});

// GET coding patterns list
app.get('/api/patterns', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT id, name, description, key_identifiers as "keyIdentifiers", common_problems as "commonProblems", sample_template as "sampleTemplate", linked_problems as "linkedProblems" FROM dsa_patterns ORDER BY name ASC');
      const parsed = result.rows.map(row => ({
        ...row,
        keyIdentifiers: JSON.parse(row.keyIdentifiers),
        commonProblems: JSON.parse(row.commonProblems),
        linkedProblems: JSON.parse(row.linkedProblems || '[]')
      }));
      res.json(parsed);
    } else {
      const patterns = readJsonFile(DSA_PATTERNS_FILE, DEFAULT_DSA_PATTERNS);
      const parsed = patterns.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        keyIdentifiers: typeof p.key_identifiers === 'string' ? JSON.parse(p.key_identifiers) : p.key_identifiers,
        commonProblems: typeof p.common_problems === 'string' ? JSON.parse(p.common_problems) : p.common_problems,
        sampleTemplate: p.sample_template,
        linkedProblems: typeof p.common_problems === 'string' ? JSON.parse(p.common_problems) : (p.common_problems || [])
      }));
      res.json(parsed);
    }
  } catch (err) {
    console.error('Failed to get patterns:', err);
    res.status(500).json({ error: 'Failed to retrieve patterns list' });
  }
});

// Vector-style fuzzy search: match query against pattern name, description, key identifiers, and all linked problems
app.get('/api/patterns/search', async (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase().trim();
  if (!q) return res.json([]);

  try {
    let patterns = [];
    if (pool) {
      const result = await pool.query(
        'SELECT id, name, description, key_identifiers as "keyIdentifiers", common_problems as "commonProblems", sample_template as "sampleTemplate", linked_problems as "linkedProblems" FROM dsa_patterns'
      );
      patterns = result.rows.map(row => ({
        ...row,
        keyIdentifiers: JSON.parse(row.keyIdentifiers),
        commonProblems: JSON.parse(row.commonProblems),
        linkedProblems: JSON.parse(row.linkedProblems || '[]')
      }));
    } else {
      const raw = readJsonFile(DSA_PATTERNS_FILE, DEFAULT_DSA_PATTERNS);
      patterns = raw.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        keyIdentifiers: typeof p.key_identifiers === 'string' ? JSON.parse(p.key_identifiers) : p.key_identifiers,
        commonProblems: typeof p.common_problems === 'string' ? JSON.parse(p.common_problems) : p.common_problems,
        sampleTemplate: p.sample_template,
        linkedProblems: typeof p.common_problems === 'string' ? JSON.parse(p.common_problems) : (p.common_problems || [])
      }));
    }

    // Score each pattern by how well the query matches its fields
    const scored = patterns.map(pat => {
      const terms = q.split(/\s+/);
      let score = 0;
      const searchFields = [
        { text: pat.name.toLowerCase(), weight: 10 },
        { text: pat.description.toLowerCase(), weight: 3 },
        { text: (pat.keyIdentifiers || []).join(' ').toLowerCase(), weight: 5 },
        { text: (pat.linkedProblems || pat.commonProblems || []).join(' ').toLowerCase(), weight: 8 }
      ];
      for (const term of terms) {
        for (const field of searchFields) {
          if (field.text.includes(term)) score += field.weight;
        }
      }
      // Boost exact pattern name match
      if (pat.name.toLowerCase().includes(q)) score += 20;
      // Boost exact problem name match
      if ((pat.linkedProblems || pat.commonProblems || []).some(p => p.toLowerCase().includes(q))) score += 15;
      return { ...pat, _score: score };
    });

    const results = scored
      .filter(p => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...rest }) => rest);

    res.json(results);
  } catch (err) {
    console.error('Pattern search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Run server & initialize DB
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initDb();
});
