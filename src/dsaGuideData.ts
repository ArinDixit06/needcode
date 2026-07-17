export interface GuideProblem {
  title: string;
  patternNote: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  isCustom?: boolean;
  isAutoExpanded?: boolean;
}

export interface GuideSection {
  id: string;
  title: string;
  practiceTitle: string;
  practiceTasks: string[];
  problems: GuideProblem[];
}

export const dsaGuideSections: GuideSection[] = [
  {
    id: 'arrays',
    title: '1. Arrays',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement manually in C/C++ (fixed-size) to internalize memory layout, then switch to a language with dynamic arrays.',
      'Build your own dynamic array (like a Vector/ArrayList) from scratch: handle resizing (2x growth), amortized O(1) append, index out of bounds.',
      'Drill low-level moves: In-place reversal',
      'Drill low-level moves: Rotating by k (using reversal trick: reverse whole, reverse parts)',
      'Drill low-level moves: Two-pointer scanning (from both ends, or fast/slow)',
      'Drill low-level moves: Sliding window (fixed size and variable size)',
      'Drill low-level moves: Prefix sum / suffix sum construction',
      'Drill low-level moves: In-place partitioning (like the Dutch National Flag / quicksort partition)'
    ],
    problems: [
      { title: 'Two Sum', patternNote: 'hashmap pattern', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
      { title: 'Best Time to Buy and Sell Stock', patternNote: 'single pass, track min', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
      { title: 'Maximum Subarray', patternNote: "Kadane's Algorithm", difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/' },
      { title: 'Product of Array Except Self', patternNote: 'prefix/suffix product, no division', difficulty: 'Medium', url: 'https://leetcode.com/problems/product-of-array-except-self/' },
      { title: 'Move Zeroes', patternNote: 'two-pointer in-place', difficulty: 'Easy', url: 'https://leetcode.com/problems/move-zeroes/' },
      { title: 'Sort Colors', patternNote: 'Dutch National Flag / three-pointer partition', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-colors/' },
      { title: 'Merge Intervals', patternNote: 'sort and merge', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/' },
      { title: 'Insert Interval', patternNote: 'handling left, overlap, and right segments', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/' },
      { title: 'Next Permutation', patternNote: 'lexicographical order swap and reverse', difficulty: 'Medium', url: 'https://leetcode.com/problems/next-permutation/' },
      { title: '3Sum', patternNote: 'two-pointer after sort', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/' },
      { title: '4Sum', patternNote: 'nested loops + two-pointer after sort', difficulty: 'Medium', url: 'https://leetcode.com/problems/4sum/' },
      { title: 'Container With Most Water', patternNote: 'two-pointer from boundaries', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/' },
      { title: 'Trapping Rain Water', patternNote: 'prefix max/suffix max or two-pointer', difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/' },
      { title: 'Rotate Array', patternNote: 'reverse parts trick', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-array/' },
      { title: 'Rotate Image', patternNote: 'matrix transpose and reverse rows', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-image/' },
      { title: 'Find the Duplicate Number', patternNote: "Floyd's cycle detection on array-as-graph", difficulty: 'Medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/' },
      { title: 'Subarray Sum Equals K', patternNote: 'prefix sum + hashmap frequency lookup', difficulty: 'Medium', url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
      { title: 'Sliding Window Maximum', patternNote: 'monotonic deque', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
      { title: 'Maximum Subarray Circular', patternNote: 'Kadane variant (max subarray or total - min subarray)', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-sum-circular-subarray/' },
      { title: 'Merge Sorted Array', patternNote: 'in-place merge starting from back', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-sorted-array/' },
      { title: 'Gas Station', patternNote: 'greedy traversal accumulated balance check', difficulty: 'Medium', url: 'https://leetcode.com/problems/gas-station/' },
      { title: 'Spiral Matrix', patternNote: 'boundary simulation and layer traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/' }
    ]
  },
  {
    id: 'strings',
    title: '2. Strings',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Treat strings as arrays of characters — most array techniques transfer directly.',
      'Master building a frequency map (array of 26/128/256 or hashmap) in O(n).',
      'Master two-pointer palindrome checks.',
      'Master sliding window with a character-count map.',
      'Master string building efficiently (avoid O(n²) concatenation — use StringBuilder/list+join or template literals).',
      'Master basic pattern matching by hand: naive O(nm), then KMP, then Z-algorithm.',
      'Manual implementation of strStr, substring, split, trim without built-ins, at least once.'
    ],
    problems: [
      { title: 'Valid Anagram', patternNote: 'frequency map character count matching', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/' },
      { title: 'Valid Palindrome', patternNote: 'two-pointer alphanumeric scan', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/' },
      { title: 'Longest Substring Without Repeating Characters', patternNote: 'sliding window index mapping', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
      { title: 'Longest Repeating Character Replacement', patternNote: 'sliding window + character count frequency tracker', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/' },
      { title: 'Minimum Window Substring', patternNote: 'sliding window, hard variant tracking requirements', difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/' },
      { title: 'Group Anagrams', patternNote: 'hashmap of sorted string or count-signature', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/' },
      { title: 'Longest Palindromic Substring', patternNote: 'expand around center, or DP', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
      { title: 'Palindromic Substrings', patternNote: 'count palindromes by expanding around all center points', difficulty: 'Medium', url: 'https://leetcode.com/problems/palindromic-substrings/' },
      { title: 'Encode and Decode Strings', patternNote: 'length-prefix framing (e.g. 5#hello)', difficulty: 'Medium', url: 'https://leetcode.com/problems/encode-and-decode-strings/' },
      { title: 'Implement strStr()', patternNote: 'KMP algorithm for O(N+M) or Rabin-Karp rolling hash', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/' },
      { title: 'String to Integer (atoi)', patternNote: 'robust state machine and edge case handling', difficulty: 'Medium', url: 'https://leetcode.com/problems/string-to-integer-atoi/' },
      { title: 'Valid Parentheses', patternNote: 'stack matching corresponding brackets', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' },
      { title: 'Word Break', patternNote: 'DP + hashset dictionary lookup', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-break/' },
      { title: 'Longest Common Prefix', patternNote: 'horizontal or vertical scanning comparison', difficulty: 'Easy', url: 'https://leetcode.com/problems/longest-common-prefix/' },
      { title: 'Reverse Words in a String', patternNote: 'in-place word reversal and spacing cleanup', difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-words-in-a-string/' },
      { title: 'Zigzag Conversion', patternNote: 'row-by-row simulation array collection', difficulty: 'Medium', url: 'https://leetcode.com/problems/zigzag-conversion/' },
      { title: 'Repeated String Match', patternNote: 'Rabin-Karp for pattern matching (rolling hash)', difficulty: 'Medium', url: 'https://leetcode.com/problems/repeated-string-match/' },
      { title: 'Find All Anagrams in a String', patternNote: 'sliding window + frequency map comparison', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/' }
    ]
  },
  {
    id: 'linked-lists',
    title: '3. Linked Lists',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement singly, doubly, and circular linked lists from scratch — insert head/tail/middle, delete by value, delete by position, search, reverse.',
      'The core skill is pointer manipulation without losing references. Draw first, labeling prev, curr, next before coding.',
      'Master linked list primitive: Reverse a linked list (iterative + recursive)',
      'Master linked list primitive: Find the middle (slow/fast pointer)',
      'Master linked list primitive: Detect a cycle (Floyd\'s tortoise and hare) + find cycle start',
      'Master linked list primitive: Merge two sorted lists',
      'Master linked list primitive: Dummy head node trick (avoids edge-case code for head deletion)',
      'Rebuild a doubly linked list with a dummy head+tail — this is the backbone of LRU cache.'
    ],
    problems: [
      { title: 'Reverse Linked List', patternNote: 'iterative and recursive link swapping', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
      { title: 'Merge Two Sorted Lists', patternNote: 'dummy node comparisons pointer advancement', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
      { title: 'Linked List Cycle', patternNote: 'Floyd\'s slow/fast cycle detection', difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/' },
      { title: 'Linked List Cycle II', patternNote: 'find start of cycle using collision node offset', difficulty: 'Medium', url: 'https://leetcode.com/problems/linked-list-cycle-ii/' },
      { title: 'Remove Nth Node From End', patternNote: 'two-pointer with window gap of N', difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
      { title: 'Reorder List', patternNote: 'split list, reverse second half, interleave merge', difficulty: 'Medium', url: 'https://leetcode.com/problems/reorder-list/' },
      { title: 'Middle of the Linked List', patternNote: 'slow/fast pointers', difficulty: 'Easy', url: 'https://leetcode.com/problems/middle-of-the-linked-list/' },
      { title: 'Palindrome Linked List', patternNote: 'find middle, reverse second half, compare matches', difficulty: 'Easy', url: 'https://leetcode.com/problems/palindrome-linked-list/' },
      { title: 'Add Two Numbers', patternNote: 'linked list traversal with decimal carry logic', difficulty: 'Medium', url: 'https://leetcode.com/problems/add-two-numbers/' },
      { title: 'Copy List with Random Pointer', patternNote: 'hashmap copy or node interleaving trick', difficulty: 'Medium', url: 'https://leetcode.com/problems/copy-list-with-random-pointer/' },
      { title: 'Merge k Sorted Lists', patternNote: 'heap or divide & conquer list merging', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
      { title: 'Reverse Nodes in k-Group', patternNote: 'block-by-block sublist reversal', difficulty: 'Hard', url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/' },
      { title: 'Flatten a Multilevel Doubly Linked List', patternNote: 'DFS node stitching', difficulty: 'Medium', url: 'https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/' },
      { title: 'LRU Cache', patternNote: 'doubly linked list + hashmap (essential rite of passage)', difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache/' },
      { title: 'Sort List', patternNote: 'merge sort on linked list, O(N log N) in-place', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-list/' },
      { title: 'Intersection of Two Linked Lists', patternNote: 'two pointers traversing combined lengths', difficulty: 'Easy', url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/' }
    ]
  },
  {
    id: 'stacks',
    title: '4. Stacks',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement using an array and using a linked list — know both push/pop/peek/isEmpty in O(1).',
      'Implement a stack that also tracks the minimum in O(1) (auxiliary stack or storing pairs).',
      'Implement a queue using two stacks, and a stack using two queues — forces you to understand LIFO/FIFO tradeoff.',
      'Practice recognizing stack problems: matching/nesting, next greater/smaller element, undo/backtrack history.'
    ],
    problems: [
      { title: 'Valid Parentheses', patternNote: 'LIFO matching', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' },
      { title: 'Min Stack', patternNote: 'dual stacks for O(1) min value tracking', difficulty: 'Medium', url: 'https://leetcode.com/problems/min-stack/' },
      { title: 'Evaluate Reverse Polish Notation', patternNote: 'postfix parsing using operand stack', difficulty: 'Medium', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/' },
      { title: 'Daily Temperatures', patternNote: 'monotonic decreasing stack of indices', difficulty: 'Medium', url: 'https://leetcode.com/problems/daily-temperatures/' },
      { title: 'Next Greater Element I', patternNote: 'monotonic stack + hashmap map tracking', difficulty: 'Easy', url: 'https://leetcode.com/problems/next-greater-element-i/' },
      { title: 'Next Greater Element II', patternNote: 'monotonic stack over circular array traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/next-greater-element-ii/' },
      { title: 'Largest Rectangle in Histogram', patternNote: 'monotonic stack width index calculation', difficulty: 'Hard', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/' },
      { title: 'Trapping Rain Water', patternNote: 'stack-based bounded boundary calculations', difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/' },
      { title: 'Basic Calculator', patternNote: 'expression stack parsing with brackets and operators', difficulty: 'Hard', url: 'https://leetcode.com/problems/basic-calculator/' },
      { title: 'Basic Calculator II', patternNote: 'operator priority and sign tracking', difficulty: 'Medium', url: 'https://leetcode.com/problems/basic-calculator-ii/' },
      { title: 'Decode String', patternNote: 'nested count + string building stacks', difficulty: 'Medium', url: 'https://leetcode.com/problems/decode-string/' },
      { title: 'Asteroid Collision', patternNote: 'simulation collision checks with stack top', difficulty: 'Medium', url: 'https://leetcode.com/problems/asteroid-collision/' },
      { title: 'Implement Queue using Stacks', patternNote: 'LIFO to FIFO inversion with two stacks', difficulty: 'Easy', url: 'https://leetcode.com/problems/implement-queue-using-stacks/' },
      { title: 'Remove K Digits', patternNote: 'monotonic increasing greedy stack', difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-k-digits/' },
      { title: 'Simplify Path', patternNote: 'Unix path tokenizing and directory stack tracking', difficulty: 'Medium', url: 'https://leetcode.com/problems/simplify-path/' },
      { title: 'Sliding Window Maximum', patternNote: 'monotonic deque (bridges stack/queue)', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' }
    ]
  },
  {
    id: 'queues',
    title: '5. Queues (and Deques)',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement a queue with an array (circular buffer logic — track head/tail with modulo) and with a linked list.',
      'Implement a deque (double-ended queue) from scratch and use it to solve sliding window problems.',
      'Implement a circular buffer — common systems-adjacent DSA question.',
      'Practice BFS using a queue explicitly until level-order traversal is second nature.'
    ],
    problems: [
      { title: 'Design Circular Queue', patternNote: 'circular array tracking front/rear indices', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-circular-queue/' },
      { title: 'Design Circular Deque', patternNote: 'double-ended circular buffer list bounds', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-circular-deque/' },
      { title: 'Number of Recent Calls', patternNote: 'sliding time window range cleanup', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-recent-calls/' },
      { title: 'Sliding Window Maximum', patternNote: 'monotonic deque element removal', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
      { title: 'Rotting Oranges', patternNote: 'multi-source BFS queue cell transition', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotting-oranges/' },
      { title: 'Task Scheduler', patternNote: 'frequency count + cooldown queue combo', difficulty: 'Medium', url: 'https://leetcode.com/problems/task-scheduler/' },
      { title: 'Design Hit Counter', patternNote: 'queue timeline tracking or circular array statistics', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-hit-counter/' },
      { title: 'First Unique Character in a Stream', patternNote: 'queue + hashmap status tracking', difficulty: 'Easy', url: 'https://leetcode.com/problems/first-unique-character-in-a-string/' },
      { title: 'Moving Average from Data Stream', patternNote: 'fixed size sliding queue sum calculation', difficulty: 'Easy', url: 'https://leetcode.com/problems/moving-average-from-data-stream/' }
    ]
  },
  {
    id: 'hash-tables',
    title: '6. Hash Tables (Maps & Sets)',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement a hash table from scratch: pick a hash function, handle collisions with chaining (array of linked lists) and separately with open addressing (linear probing) — build both once to understand tradeoffs.',
      'Implement resizing (rehashing when load factor exceeds a threshold).',
      'Practice recognizing "this is O(n²) brute force, but a hashmap makes it O(n)" — the highest-leverage pattern in all of DSA.'
    ],
    problems: [
      { title: 'Two Sum', patternNote: 'single-pass lookup map', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
      { title: 'Contains Duplicate', patternNote: 'visited hashset tracking', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/' },
      { title: 'Group Anagrams', patternNote: 'hashmap of sorted string/count-signature keys', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/' },
      { title: 'Top K Frequent Elements', patternNote: 'hashmap frequency count + bucket sort or heap', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
      { title: 'Longest Consecutive Sequence', patternNote: 'hashset start-of-sequence detection (O(N))', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/' },
      { title: 'Valid Sudoku', patternNote: 'hashsets tracking rows, columns, and sub-grids', difficulty: 'Medium', url: 'https://leetcode.com/problems/valid-sudoku/' },
      { title: 'Design HashMap', patternNote: 'hashing implementation with buckets chaining', difficulty: 'Easy', url: 'https://leetcode.com/problems/design-hashmap/' },
      { title: 'Design HashSet', patternNote: 'hash table with binary array bucket index flags', difficulty: 'Easy', url: 'https://leetcode.com/problems/design-hashset/' },
      { title: 'Subarray Sum Equals K', patternNote: 'prefix sum prefix counts frequency map', difficulty: 'Medium', url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
      { title: 'LRU Cache', patternNote: 'hashmap lookups + DLL ordering node operations', difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache/' },
      { title: '4Sum II', patternNote: 'hashmap of pair sums split grouping', difficulty: 'Medium', url: 'https://leetcode.com/problems/4sum-ii/' },
      { title: 'Isomorphic Strings', patternNote: 'dual character translation map mappings', difficulty: 'Easy', url: 'https://leetcode.com/problems/isomorphic-strings/' },
      { title: 'Word Pattern', patternNote: 'isomorphic mapping between pattern letters and words', difficulty: 'Easy', url: 'https://leetcode.com/problems/word-pattern/' },
      { title: 'Ransom Note', patternNote: 'char counts frequency array matching', difficulty: 'Easy', url: 'https://leetcode.com/problems/ransom-note/' },
      { title: 'Longest Substring Without Repeating Characters', patternNote: 'hashmap sliding window boundaries', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
      { title: 'Design Twitter', patternNote: 'hashmap of user feeds + min-heap timeline merging', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-twitter/' }
    ]
  },
  {
    id: 'trees',
    title: '7. Trees (Binary Trees & BSTs)',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Build a binary tree node class, implement preorder, inorder, postorder (recursive AND iterative using explicit stack), and level-order (using a queue). Don\'t skip iterative versions.',
      'Implement a BST from scratch: insert, search, delete (the delete-with-two-children case is the important one — find inorder successor/predecessor).',
      'Implement tree height, diameter, and "is balanced" checks.',
      'Practice converting between representations: array ↔ tree, sorted array → balanced BST.',
      'Get comfortable with recursion patterns: bottom-up (combine results from children) vs top-down (pass information down via parameters).'
    ],
    problems: [
      { title: 'Maximum Depth of Binary Tree', patternNote: 'bottom-up recursion height evaluation', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
      { title: 'Invert Binary Tree', patternNote: 'recursive swap left/right children', difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/' },
      { title: 'Diameter of Binary Tree', patternNote: 'bottom-up height recursion updating diameter global max', difficulty: 'Easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/' },
      { title: 'Balanced Binary Tree', patternNote: 'bottom-up height check returning invalid marker -1', difficulty: 'Easy', url: 'https://leetcode.com/problems/balanced-binary-tree/' },
      { title: 'Same Tree', patternNote: 'recursive structure comparison base cases', difficulty: 'Easy', url: 'https://leetcode.com/problems/same-tree/' },
      { title: 'Symmetric Tree', patternNote: 'mirror check recursion on dual child paths', difficulty: 'Easy', url: 'https://leetcode.com/problems/symmetric-tree/' },
      { title: 'Binary Tree Level Order Traversal', patternNote: 'BFS queue level size loop traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
      { title: 'Binary Tree Zigzag Level Order Traversal', patternNote: 'BFS level queue with alternating collection orders', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/' },
      { title: 'Path Sum', patternNote: 'top-down reduction of target value to leaves', difficulty: 'Easy', url: 'https://leetcode.com/problems/path-sum/' },
      { title: 'Path Sum II', patternNote: 'DFS path backtracking tracking path arrays', difficulty: 'Medium', url: 'https://leetcode.com/problems/path-sum-ii/' },
      { title: 'Lowest Common Ancestor of a Binary Tree', patternNote: 'DFS bottom-up node detection bubble up', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/' },
      { title: 'Lowest Common Ancestor of a Binary Search Tree', patternNote: 'LCA traversal path splits using BST properties', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },
      { title: 'Validate Binary Search Tree', patternNote: 'top-down min/max constraint boundaries validation', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
      { title: 'Kth Smallest Element in a BST', patternNote: 'inorder traversal counter or index lookups', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/' },
      { title: 'Construct Binary Tree from Preorder and Inorder Traversal', patternNote: 'recursive partition arrays map boundaries', difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/' },
      { title: 'Serialize and Deserialize Binary Tree', patternNote: 'BFS level representation or preorder DFS parsing strings', difficulty: 'Hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },
      { title: 'Binary Tree Maximum Path Sum', patternNote: 'bottom-up single path calculation updating global max path sum', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
      { title: 'Binary Tree Right Side View', patternNote: 'BFS or DFS level tracking rightmost nodes', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-right-side-view/' },
      { title: 'Convert Sorted Array to Binary Search Tree', patternNote: 'binary search recursion dividing midpoints', difficulty: 'Easy', url: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/' },
      { title: 'Flatten Binary Tree to Linked List', patternNote: 'reversed postorder DFS or Morris traversal flattening', difficulty: 'Medium', url: 'https://leetcode.com/problems/flatten-binary-tree-to-linked-list/' },
      { title: 'Insert into a Binary Search Tree', patternNote: 'BST search path leaf insertion', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-into-a-binary-search-tree/' },
      { title: 'Delete Node in a BST', patternNote: 'replaces with inorder predecessor/successor swaps', difficulty: 'Medium', url: 'https://leetcode.com/problems/delete-node-in-a-bst/' },
      { title: 'Count Good Nodes in Binary Tree', patternNote: 'top-down max value tracking path DFS', difficulty: 'Medium', url: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/' },
      { title: 'Vertical Order Traversal of a Binary Tree', patternNote: 'column coordinate sorting nodes with BFS', difficulty: 'Hard', url: 'https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/' }
    ]
  },
  {
    id: 'heaps',
    title: '8. Heaps (Priority Queues)',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement a binary heap from scratch using an array: sift-up (insert), sift-down (extract-min/max), heapify an entire array in O(n). Do both min-heap and max-heap.',
      'Practice deriving parent/child index formulas: parent = (i-1)/2, left = 2i+1, right = 2i+2.',
      'Understand heap vs sorting: heaps win when only needing top-k or running min/max, not a full order.',
      'Practice "two heaps" pattern (max-heap for lower half, min-heap for upper half) for median-tracking.'
    ],
    problems: [
      { title: 'Kth Largest Element in an Array', patternNote: 'min-heap of size K or Quickselect (O(N))', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
      { title: 'Kth Largest Element in a Stream', patternNote: 'min-heap size K tracking running values', difficulty: 'Easy', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/' },
      { title: 'Top K Frequent Elements', patternNote: 'hashmap counting + min-heap or bucket sort', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
      { title: 'Find Median from Data Stream', patternNote: 'two heaps pattern balancing sizes', difficulty: 'Hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/' },
      { title: 'Merge k Sorted Lists', patternNote: 'min-heap merging nodes from K sources', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
      { title: 'Task Scheduler', patternNote: 'max-heap tracking task counts + wait list cooling', difficulty: 'Medium', url: 'https://leetcode.com/problems/task-scheduler/' },
      { title: 'Meeting Rooms II', patternNote: 'min-heap of end times tracking active meetings', difficulty: 'Medium', url: 'https://leetcode.com/problems/meeting-rooms-ii/' },
      { title: 'K Closest Points to Origin', patternNote: 'max-heap distance size K or Quickselect', difficulty: 'Medium', url: 'https://leetcode.com/problems/k-closest-points-to-origin/' },
      { title: 'Reorganize String', patternNote: 'max-heap character counts + cooldown character hold', difficulty: 'Medium', url: 'https://leetcode.com/problems/reorganize-string/' },
      { title: 'Ugly Number II', patternNote: 'min-heap tracking next multiples or DP', difficulty: 'Medium', url: 'https://leetcode.com/problems/ugly-number-ii/' },
      { title: 'Sliding Window Median', patternNote: 'two heaps with lazy removal of elements outside window', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-median/' },
      { title: 'Design Twitter', patternNote: 'heap merge of feeds from multiple users', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-twitter/' },
      { title: 'Last Stone Weight', patternNote: 'max-heap extracting two heaviest stones', difficulty: 'Easy', url: 'https://leetcode.com/problems/last-stone-weight/' }
    ]
  },
  {
    id: 'tries',
    title: '9. Tries (Prefix Trees)',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement a Trie from scratch: node with children map/array(26) and an isEndOfWord flag. Implement insert, search, and startsWith.',
      'Practice adding a count field per node to support "count words with this prefix" type queries.',
      'Extend it to support wildcard search (. matches any character) via DFS through the trie.'
    ],
    problems: [
      { title: 'Implement Trie (Prefix Tree)', patternNote: 'node tree mapping alphabet links', difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/' },
      { title: 'Design Add and Search Words Data Structure', patternNote: 'trie wildcard matching using DFS branching', difficulty: 'Medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/' },
      { title: 'Word Search II', patternNote: 'backtracking DFS on grid using Trie to prune paths', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-search-ii/' },
      { title: 'Replace Words', patternNote: 'trie root lookup finding shortest prefix matches', difficulty: 'Medium', url: 'https://leetcode.com/problems/replace-words/' },
      { title: 'Longest Word in Dictionary', patternNote: 'trie search building words character by character', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-word-in-dictionary/' },
      { title: 'Maximum XOR of Two Numbers in an Array', patternNote: 'binary trie (bits 0/1) path maximization', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/' },
      { title: 'Search Suggestions System', patternNote: 'trie traversal compiling top 3 lexicographical items', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-suggestions-system/' }
    ]
  },
  {
    id: 'graphs',
    title: '10. Graphs',
    practiceTitle: 'How to practice the structure itself',
    practiceTasks: [
      'Implement graph representations: adjacency list (most common) and adjacency matrix — know sparse vs dense differences.',
      'Implement without looking up: BFS (queue-based, shortest path in unweighted graph)',
      'Implement without looking up: DFS (recursive AND iterative with explicit stack)',
      'Implement without looking up: Cycle detection (directed: color/visiting-state method; undirected: parent tracking or union-find)',
      'Implement without looking up: Topological sort (Kahn\'s BFS-based, and DFS-based)',
      'Implement without looking up: Union-Find / Disjoint Set Union with path compression + union by rank',
      'Implement without looking up: Dijkstra\'s shortest path (min-heap based)'
    ],
    problems: [
      { title: 'Number of Islands', patternNote: 'DFS/BFS flood fill on 2D grid matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' },
      { title: 'Clone Graph', patternNote: 'DFS/BFS with visited hashmap matching old-to-new nodes', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/' },
      { title: 'Course Schedule', patternNote: 'detect cycle in directed graph (DFS/Kahn)', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' },
      { title: 'Course Schedule II', patternNote: 'topological sort order returning node checklist (Kahn/DFS)', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule-ii/' },
      { title: 'Pacific Atlantic Water Flow', patternNote: 'grid border DFS/BFS reverse flowing tracking', difficulty: 'Medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/' },
      { title: 'Graph Valid Tree', patternNote: 'undirected cycle check (Union-Find or DFS)', difficulty: 'Medium', url: 'https://leetcode.com/problems/graph-valid-tree/' },
      { title: 'Number of Connected Components in an Undirected Graph', patternNote: 'Union-Find or DFS counting islands', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/' },
      { title: 'Rotting Oranges', patternNote: 'multi-source BFS queue tracking minutes layer steps', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotting-oranges/' },
      { title: 'Word Ladder', patternNote: 'BFS word path transformations unweighted search steps', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-ladder/' },
      { title: 'Word Ladder II', patternNote: 'BFS shortest distance graph + DFS path reconstruction', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-ladder-ii/' },
      { title: 'Redundant Connection', patternNote: 'Union-Find edge detection cycle creation', difficulty: 'Medium', url: 'https://leetcode.com/problems/redundant-connection/' },
      { title: 'Network Delay Time', patternNote: 'Dijkstra shortest path min-heap node relaxation', difficulty: 'Medium', url: 'https://leetcode.com/problems/network-delay-time/' },
      { title: 'Cheapest Flights Within K Stops', patternNote: 'Bellman-Ford or modified Dijkstra with node level stops limit', difficulty: 'Medium', url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/' },
      { title: 'Alien Dictionary', patternNote: 'topological sort character order DAG compilation', difficulty: 'Hard', url: 'https://leetcode.com/problems/alien-dictionary/' },
      { title: 'Reconstruct Itinerary', patternNote: 'Eulerian path search (Hierholzer\'s postorder DFS)', difficulty: 'Hard', url: 'https://leetcode.com/problems/reconstruct-itinerary/' },
      { title: 'Min Cost to Connect All Points', patternNote: 'Kruskal\'s (Union-Find + sorting) or Prim\'s (min-heap MST)', difficulty: 'Medium', url: 'https://leetcode.com/problems/min-cost-to-connect-all-points/' },
      { title: 'Is Graph Bipartite?', patternNote: '2-coloring node vertices via BFS/DFS', difficulty: 'Medium', url: 'https://leetcode.com/problems/is-graph-bipartite/' },
      { title: 'Surrounded Regions', patternNote: 'boundary-connected grid DFS marking non-flippable cells', difficulty: 'Medium', url: 'https://leetcode.com/problems/surrounded-regions/' },
      { title: 'Accounts Merge', patternNote: 'Union-Find grouping email nodes component lists', difficulty: 'Medium', url: 'https://leetcode.com/problems/accounts-merge/' },
      { title: 'Critical Connections in a Network', patternNote: 'Tarjan\'s bridges algorithm tracking low-link discovery times', difficulty: 'Hard', url: 'https://leetcode.com/problems/critical-connections-in-a-network/' }
    ]
  },
  {
    id: 'dynamic-programming',
    title: '11. Dynamic Programming',
    practiceTitle: 'How to practice the technique itself',
    practiceTasks: [
      'Define DP state explicitly: "dp[i] represents ___" before coding.',
      'Write the recurrence relation.',
      'Identify the base case(s).',
      'Decide traversal order.',
      'Code brute-force recursion first, then memoize, then convert to bottom-up tabulation, then optimize space.',
      'Practice DP shapes: 1D DP (sequences), 2D DP (strings/grids), Knapsack (choices/capacity), Interval DP (ranges), Tree DP.'
    ],
    problems: [
      { title: 'Climbing Stairs', patternNote: 'base case 1D DP (Fibonacci)', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
      { title: 'House Robber', patternNote: '1D DP pick or skip state options', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/' },
      { title: 'House Robber II', patternNote: 'circular houses DP (run 0..n-2 and 1..n-1 separately)', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber-ii/' },
      { title: 'Longest Increasing Subsequence', patternNote: '1D sequence DP search or binary search patience sorting', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
      { title: 'Coin Change', patternNote: 'unbounded knapsack min coins tabulations', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/' },
      { title: 'Coin Change II', patternNote: 'ways to make change (order does not matter)', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change-ii/' },
      { title: 'Partition Equal Subset Sum', patternNote: '0/1 knapsack target sum subset existence', difficulty: 'Medium', url: 'https://leetcode.com/problems/partition-equal-subset-sum/' },
      { title: 'Target Sum', patternNote: '0/1 knapsack sum subset combinations count', difficulty: 'Medium', url: 'https://leetcode.com/problems/target-sum/' },
      { title: 'Longest Common Subsequence', patternNote: '2D DP string match grid evaluations', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/' },
      { title: 'Edit Distance', patternNote: '2D string grid operations min edits', difficulty: 'Hard', url: 'https://leetcode.com/problems/edit-distance/' },
      { title: 'Longest Palindromic Subsequence', patternNote: '2D grid match of string with its reverse', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-subsequence/' },
      { title: 'Word Break', patternNote: '1D array tracking substring break existence', difficulty: 'Medium', url: 'https://leetcode.com/problems/word-break/' },
      { title: 'Maximum Product Subarray', patternNote: 'Kadane variant tracking min/max products due to negatives', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/' },
      { title: 'Decode Ways', patternNote: '1D DP sequence parsing valid digit combinations', difficulty: 'Medium', url: 'https://leetcode.com/problems/decode-ways/' },
      { title: 'Unique Paths', patternNote: '2D grid cell pathway sum accumulations', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths/' },
      { title: 'Unique Paths II', patternNote: '2D grid path with obstacle cell zeros', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths-ii/' },
      { title: 'Minimum Path Sum', patternNote: '2D grid cell min path accumulations', difficulty: 'Medium', url: 'https://leetcode.com/problems/minimum-path-sum/' },
      { title: 'Interleaving String', patternNote: '2D DP matching characters grid intersections', difficulty: 'Medium', url: 'https://leetcode.com/problems/interleaving-string/' },
      { title: 'Burst Balloons', patternNote: 'interval range DP bubble subproblem matrix', difficulty: 'Hard', url: 'https://leetcode.com/problems/burst-balloons/' },
      { title: 'Matrix Chain Multiplication', patternNote: 'interval DP range partition min multiplications', difficulty: 'Medium', url: 'https://leetcode.com/problems/matrix-chain-multiplication/' }, // Note: MCM is not standard on LC but often taught
      { title: 'Best Time to Buy and Sell Stock III', patternNote: 'state machine DP (2 transactions maximum)', difficulty: 'Hard', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/' },
      { title: 'Best Time to Buy and Sell Stock IV', patternNote: 'state machine DP (k transactions)', difficulty: 'Hard', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/' }
    ]
  },
  {
    id: 'advanced',
    title: '12. Advanced Structures',
    practiceTitle: 'Bonus tier structures to master',
    practiceTasks: [
      'Segment Tree: range sum/min/max queries + point updates from scratch (build, query, update).',
      'Fenwick Tree / Binary Indexed Tree: simpler alternative to segment tree for prefix sums with updates.',
      'Sparse Table: static range min/max queries in O(1) after O(n log n) preprocessing.',
      'Monotonic Stack/Deque (pattern recognition for range boundaries).'
    ],
    problems: [
      { title: 'Range Sum Query - Mutable', patternNote: 'Segment Tree or Fenwick Tree point updates', difficulty: 'Medium', url: 'https://leetcode.com/problems/range-sum-query-mutable/' },
      { title: 'Range Minimum Query', patternNote: 'Sparse Table static query range or Segment Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/range-minimum-query/' }, // Conceptual or standard
      { title: 'Count of Smaller Numbers After Self', patternNote: 'Fenwick Tree prefix sums / merge sort indices', difficulty: 'Hard', url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/' },
      { title: 'Online Stock Span', patternNote: 'monotonic stack tracking indices and weights', difficulty: 'Medium', url: 'https://leetcode.com/problems/online-stock-span/' },
      { title: 'Shortest Subarray with Sum at Least K', patternNote: 'monotonic deque prefix sum comparisons', difficulty: 'Hard', url: 'https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/' }
    ]
  }
];
