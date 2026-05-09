// Placement test questions for each category
// 10 questions per category, determines starting level
//neeeeeeeeeeeeeeed tooooooooooooooooooooooooo changeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
const placementQuestions = {
  SCRATCH: [
    {
      id: 'sc_q1',
      question: '"What block are you going to use to let the character move to the right?',
      options: ['Turn Right15degress", "Play Sound Meow", "Move 10 Step", "Say Hello!'],
      correctAnswer: 2,
      difficulty: 1,
      points: 10,
    },
    {
      id: 'sc_q2',
      question: 'What is the block that starts the program?',
      options: ['When This Sprite Click", "When Green Flag Clicked", "When Loudness 10", "When Time > 10'],
      correctAnswer: 1,
      difficulty: 2,
      points: 10,
    },
    {
      id: 'sc_q3',
      question: 'I want to repeat the code 5 times, What block will you use?',
      options: ['Wait 5 Seconds", "Forever", "Repeat 5", "If Then'],
      correctAnswer: 2,
      difficulty: 3,
      points: 10,
    },
    {
      id: 'sc_q4',
      question: 'How do you let the character say "hello"?',
      options: ['Think Hello!", "Say Hellol", "Play Sound Hello", "Change Size By 10'],
      correctAnswer: 1,
      difficulty: 4,
      points: 10,
    },
    {
      id: 'sc_q5',
      question: 'Do you want to add a meow sound, What is the block?',
      options: ['Play Sound Meow", "Stop All Sound", "Change Volume By 10", "Record New Sound'],
      correctAnswer: 0,
      difficulty: 5,
      points: 10,
    },
  ],

  PYTHON: [
    {
      id: 'py_q1',
      question: 'Which code creates a list of moves?',
      options: ['move="Right,Left,Up"', "moves Right+Left+Up", 'moves=["Right","Left","Up"]', "moves Right,Left,Up"],
      correctAnswer: 2,
      difficulty: 1,
      points: 10,
    },
    {
      id: 'py_q2',
      question: 'Which line moves the character to the right?',
      options: ["X+1", "X=X+1", "Y=Y+1", "X=0"],
      correctAnswer: 1,
      difficulty: 2,
      points: 10,
    },
    {
      id: 'py_q3',
      question: "I want to repeat the code 5 times, What block will you use?",
      options: ['"Wait 5 seconds", "Forever", "Repeat 5 times", "If Then"'],
      correctAnswer: 2,
      difficulty: 3,
      points: 10,
    },
    {
      id: 'py_q4',
      question: "How do you let the character say 'hello'?",
      options: ["Think Hello", "Play sound Hello", "Say Hello", "Change size By 10"],
      correctAnswer: 2,
      difficulty: 4,
      points: 10,
    },
    {
      id: 'py_q5',
      question: "Do you want to add a meow sound, What is the block?",
      options: ["Play Sound Meow", "Stop All Sound", "Change Volume By 10", "Record New Sound"],
      correctAnswer: 0,
      difficulty: 5,
      points: 10,
    },
    
  ],

  HTML: [
    {
      id: 'html_q1',
      question: "What is HTML used for?",
      options: ["Playing Game", "Drawing Pictures", "Creating Web Pages", "Listening To Music"],
      correctAnswer: 2,
      difficulty: 1,
      points: 10,
    },
    {
      id: 'html_q2',
      question: "Which tag is used to make a big heading?",
      options: ["<p>", "<h1>", "<div>", "<span>"],
      correctAnswer: 1,
      difficulty: 2,
      points: 10,
    },
    {
      id: 'html_q3',
      question: "Which tag is used to write normal text?",
      options: ["<title>", "<h1>", "<img>", "<p>"],
      correctAnswer: 3,
      difficulty: 3,
      points: 10,
    },
    {
      id: 'html_q4',
      question: "Which tag is used to add an image?",
      options: ["<photo>", "<pic>", "<image>", "<img>"],
      correctAnswer: 3,
      difficulty: 4,
      points: 10,
    },
    {
      id: 'html_q5',
      question: "Which tag is the main container of an HTML page?",
      options: ["<head>", "<title>", "<body>", "<html>"],
      correctAnswer: 3,
      difficulty: 5,
      points: 10,
    },
  ],
};

// Calculate which level to place user at based on score
const calculatePlacementLevel = (score, totalPoints) => {
  const percentage = (score / totalPoints) * 100;
  if (percentage >= 90) return 8;       // Start at level 8
  if (percentage >= 70) return 6;       // Start at level 6
  if (percentage >= 50) return 4;       // Start at level 4
  if (percentage >= 30) return 2;       // Start at level 2
  return 1;                              // Start from beginning
};

module.exports = { placementQuestions, calculatePlacementLevel };
