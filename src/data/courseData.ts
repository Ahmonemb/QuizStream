export interface Checkpoint {
  id: string;
  time: number;
  label: string;
  question: string;
  options: string[];
  correctIndex: number;
  status: "upcoming" | "active" | "completed" | "incorrect";
}

export interface NavItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

export const navItems: NavItem[] = [
  { id: "home", title: "Home", icon: "Home", path: "/" },
  { id: "courses", title: "Courses", icon: "BookOpen", path: "/courses" },
  { id: "progress", title: "Progress", icon: "BarChart3", path: "/progress" },
  { id: "settings", title: "Settings", icon: "Settings", path: "/settings" },
];

export const checkpoints: Checkpoint[] = [
  {
    id: "q1",
    time: 45,
    label: "Variables & Types",
    question: "Which keyword is used to declare a constant in JavaScript?",
    options: ["var", "let", "const", "define"],
    correctIndex: 2,
    status: "completed",
  },
  {
    id: "q2",
    time: 120,
    label: "Functions",
    question: "What does the 'return' statement do in a function?",
    options: [
      "Stops the function and outputs a value",
      "Declares a new variable",
      "Creates a loop",
      "Imports a module",
    ],
    correctIndex: 0,
    status: "completed",
  },
  {
    id: "q3",
    time: 210,
    label: "Arrays",
    question: "Which method adds an element to the end of an array?",
    options: ["shift()", "unshift()", "pop()", "push()"],
    correctIndex: 3,
    status: "active",
  },
  {
    id: "q4",
    time: 300,
    label: "Objects",
    question: "How do you access a property 'name' on an object 'user'?",
    options: ["user->name", "user.name", "user::name", "user[name]"],
    correctIndex: 1,
    status: "upcoming",
  },
  {
    id: "q5",
    time: 390,
    label: "Loops",
    question: "Which loop guarantees at least one execution?",
    options: ["for", "while", "do...while", "for...in"],
    correctIndex: 2,
    status: "upcoming",
  },
];

export const transcriptSegments = [
  { time: 0, text: "Welcome to this JavaScript fundamentals course. Today we'll cover the building blocks of the language." },
  { time: 15, text: "Let's start by understanding how JavaScript handles data through variables and different data types." },
  { time: 30, text: "In JavaScript, we have three ways to declare variables: var, let, and const." },
  { time: 45, text: "The 'const' keyword creates a constant reference — meaning the variable cannot be reassigned." },
  { time: 60, text: "Now let's talk about data types. JavaScript has primitives like strings, numbers, and booleans." },
  { time: 90, text: "Functions are reusable blocks of code. You can define them using function declarations or arrow functions." },
  { time: 120, text: "The return statement exits the function and sends a value back to where the function was called." },
  { time: 150, text: "Arrow functions provide a shorter syntax and don't bind their own 'this' context." },
  { time: 180, text: "Arrays are ordered collections. You can store multiple values in a single variable." },
  { time: 210, text: "Common array methods include push, pop, shift, unshift, map, filter, and reduce." },
  { time: 240, text: "Objects store data as key-value pairs. They're fundamental to JavaScript programming." },
  { time: 300, text: "You access object properties using dot notation or bracket notation." },
  { time: 330, text: "Loops let you repeat code. JavaScript offers for, while, do-while, and for...of loops." },
  { time: 390, text: "The do-while loop always executes at least once before checking the condition." },
];
