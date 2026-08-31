export interface Example {
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  code: string;
}

export const examples: Example[] = [
  {
    name: 'Hello Duniya',
    nameHi: 'Namaste Duniya',
    description: 'HingScript ka pehla program — duniya ko namaste bolo!',
    icon: '👋',
    code: `# Namaste Duniya! HingScript mein pehla program
chhapa("Namaste Duniya! 🙏")
chhapa("HingScript chal raha hai!")

# Variable banao
ye naam = "HingScript Programmer"
ye umar = 25

chhapa("Mera naam: " + naam)
chhapa("Meri umar: " + sankhya(umar))
`,
  },
  {
    name: 'Calculator',
    nameHi: 'Calculator',
    description: 'Saare mathematical operations Hinglish mein',
    icon: '🧮',
    code: `# Calculator — saare ganit ke kaam
ye a = 15
ye b = 4

chhapa("--- Calculator ---")
chhapa("Jod (a + b): " + sankhya(a + b))
chhapa("Ghatao (a - b): " + sankhya(a - b))
chhapa("Gunna (a * b): " + sankhya(a * b))
chhapa("Bhag (a / b): " + sankhya(a / b))
chhapa("Shesh (a % b): " + sankhya(a % b))
chhapa("Power (a ** b): " + sankhya(a ** b))

# Factorial function
kaam factorial(n) {
  agar (n <= 1) {
    wapas 1
  }
  wapas n * factorial(n - 1)
}

chhapa("5 factorial = " + sankhya(factorial(5)))
chhapa("10 factorial = " + sankhya(factorial(10)))
`,
  },
  {
    name: 'Conditions',
    nameHi: 'Sharten',
    description: 'Agar/Warna conditions seekho',
    icon: '🔀',
    code: `# Sharten (Conditions) — agar/warna system
ye marks = 85

agar (marks >= 90) {
  chhapa("🌟 Shandar! Grade A+")
} wara agar (marks >= 80) {
  chhapa("⭐ Bahut accha! Grade A")
} wara agar (marks >= 70) {
  chhapa("👍 Accha! Grade B")
} wara agar (marks >= 60) {
  chhapa("👌 Theek hai. Grade C")
} wara {
  chhapa("📚 Mehnat karo! Grade F")
}

# Logical operators
ye age = 20
ye student = sach

agar (age >= 18 aur student) {
  chhapa("College mein ho, vote bhi daal sakte ho!")
}

agar (age < 18 ya !student) {
  chhapa("Abhi nahi...")
}
`,
  },
  {
    name: 'Loops',
    nameHi: 'Loops',
    description: 'Jabtak aur liye loops ka power',
    icon: '🔄',
    code: `# Loops — jabtak aur liye ke zariye kaam karo

# Jabtak loop (while loop)
chhapa("--- Jabtak Loop ---")
ye countdown = 5
jabtak (countdown > 0) {
  chhapa("⏱️ " + sankhya(countdown) + "...")
  countdown = countdown - 1
}
chhapa("🚀 Liftoff!")

# Liye loop (for loop with range)
chhapa("")
chhapa("--- Liye Loop ---")
liye (i = 0; i < 5; i++) {
  chhapa("Loop " + sankhya(i + 1))
}

# Liye with array (mein)
chhapa("")
chhapa("--- Array mein Loop ---")
ye fruits = ["🍎 Apple", "🍌 Banana", "🍇 Grapes", "🍊 Orange"]
liye (fruit mein fruits) {
  chhapa("Fruit: " + fruit)
}

# Multiplication table
chhapa("")
chhapa("--- Pahada Table (7) ---")
ye n = 7
liye (i = 1; i <= 10; i++) {
  chhapa(sankhya(n) + " × " + sankhya(i) + " = " + sankhya(n * i))
}
`,
  },
  {
    name: 'Arrays',
    nameHi: 'Soochi',
    description: 'Arrays (soochi) ke saare kaam',
    icon: '📦',
    code: `# Soochi (Arrays) — list of cheezein
ye numbers = [10, 20, 30, 40, 50]
ye names = ["Rahul", "Priya", "Amit", "Sneha"]

chhapa("Numbers: " + vakya(numbers))
chhapa("Names: " + vakya(names))
chhapa("Numbers ki lambai: " + sankhya(lambai(numbers)))

# Array mein cheezein jodna
ye new_numbers = jod(numbers, [60, 70])
chhapa("Naye numbers: " + vakya(new_numbers))

# Sorting
ye marks = [85, 92, 78, 95, 88]
chhapa("Marks pehle: " + vakya(marks))
ye sorted_marks = sort(marks)
chhapa("Marks sort: " + vakya(sorted_marks))

# Reverse
ye reversed = ulta(numbers)
chhapa("Ulta numbers: " + vakya(reversed))

# Check if element exists
agar (shamil(names, "Priya")) {
  chhapa("Priya soochi mein hai!")
}

# String operations
ye message = "Namaste HingScript"
chhapa("Uppercase: " + upar(message))
chhapa("Lowercase: " + nichla(message))
chhapa("Lambai: " + sankhya(lambai(message)))
`,
  },
  {
    name: 'Functions',
    nameHi: 'Kaam',
    description: 'Functions (kaam) aur lambda expressions',
    icon: '⚡',
    code: `# Kaam (Functions) — reusable code likho

# Simple kaam
kaam greet(naam) {
  chhapa("Namaste, " + naam + "! 🙏")
}

greet("Rahul")
greet("Priya")

# Return wala kaam
kaam add(a, b) {
  wapas a + b
}

kaam square(n) {
  wapas n * n
}

ye result = add(10, 20)
chhapa("10 + 20 = " + sankhya(result))
chhapa("5² = " + sankhya(square(5)))

# Fibonacci function
kaam fibonacci(n) {
  agar (n <= 0) { wapas 0 }
  agar (n == 1) { wapas 1 }
  wapas fibonacci(n - 1) + fibonacci(n - 2)
}

chhapa("")
chhapa("--- Fibonacci Series ---")
liye (i = 0; i < 12; i++) {
  chhapa("fib(" + sankhya(i) + ") = " + sankhya(fibonacci(i)))
}

# Higher-order function
kaam apply_twice(fn, x) {
  wapas fn(fn(x))
}

kaam double(n) {
  wapas n * 2
}

chhapa("double(double(3)) = " + sankhya(apply_twice(double, 3)))
`,
  },
  {
    name: 'Classes',
    nameHi: 'Classes',
    description: 'Object-Oriented Programming Hinglish mein',
    icon: '🏗️',
    code: `# Classes — Object Oriented HingScript!

# Student class banao
banayo Student(naam, marks) {
  ye.naam = naam
  ye.marks = marks
}

kaam marks_grade() {
  agar (ye.marks >= 90) { wapas "A+" }
  agar (ye.marks >= 80) { wapas "A" }
  agar (ye.marks >= 70) { wapas "B" }
  wapas "C"
}

kaam details() {
  chhapa("🎓 Student: " + ye.naam)
  chhapa("📊 Marks: " + sankhya(ye.marks))
  chhapa("🏆 Grade: " + marks_grade())
  chhapa("")
}

# Objects banao
ye student1 = new Student("Rahul", 92)
ye student2 = new Student("Priya", 78)
ye student3 = new Student("Amit", 95)

# Details nikalo
student1.details()
student2.details()
student3.details()

# Inheritance example
banayo Graduate(naam, marks, degree) {
  ye.naam = naam
  ye.marks = marks
  ye.degree = degree
}

kaam details() {
  chhapa("🎓 Graduate: " + ye.naam)
  chhapa("📚 Degree: " + ye.degree)
  chhapa("📊 Marks: " + sankhya(ye.marks))
  chhapa("")
}

ye grad = new Graduate("Dr. Sharma", 98, "PhD")
grad.details()
`,
  },
  {
    name: 'Objects',
    nameHi: 'Objects',
    description: 'Manakosh (dictionaries/objects) ke kaam',
    icon: '🗂️',
    code: `# Manakosh (Objects/Dictionaries)

# Student ka record
ye student = {
  naam: "Rahul Kumar",
  umar: 22,
  branch: "Computer Science",
  cgpa: 8.5,
  skills: ["JavaScript", "Python", "HingScript"]
}

chhapa("--- Student Record ---")
chhapa("Naam: " + student.naam)
chhapa("Umar: " + sankhya(student.umar))
chhapa("Branch: " + student.branch)
chhapa("CGPA: " + sankhya(student.cgpa))
chhapa("Skills: " + vakya(student.skills))

# Object modify karo
student.cgpa = 9.0
chhapa("Naya CGPA: " + sankhya(student.cgpa))

# Nested object
ye school = {
  name: "HingScript Academy",
  location: "Delhi",
  students: [student]
}

chhapa("")
chhapa("School: " + school.name)
chhapa("Location: " + school.location)
chhapa("First Student: " + school.students[0].naam)
`,
  },
  {
    name: 'Pattern',
    nameHi: 'Pattern',
    description: 'Star patterns aur maze Banana',
    icon: '⭐',
    code: `# Star Pattern Game — Creative coding HingScript mein!

# Triangle pattern
chhapa("--- ⭐ Star Triangle ---")
ye n = 5
liye (i = 1; i <= n; i++) {
  ye stars = ""
  liye (j = 0; j < i; j++) {
    stars = stars + "⭐"
  }
  chhapa(stars)
}

# Reverse triangle
chhapa("")
chhapa("--- 🔻 Reverse Triangle ---")
liye (i = n; i >= 1; i--) {
  ye spaces = ""
  ye stars = ""
  liye (j = 0; j < n - i; j++) {
    spaces = spaces + "  "
  }
  liye (j = 0; j < i; j++) {
    stars = stars + "⭐"
  }
  chhapa(spaces + stars)
}

# Diamond
chhapa("")
chhapa("--- 💎 Diamond ---")
ye size = 4
liye (i = 1; i <= size; i++) {
  ye pad = ""
  liye (j = 0; j < size - i; j++) { pad = pad + " " }
  liye (j = 0; j < 2 * i - 1; j++) { pad = pad + "⭐" }
  chhapa(pad)
}
liye (i = size - 1; i >= 1; i--) {
  ye pad = ""
  liye (j = 0; j < size - i; j++) { pad = pad + " " }
  liye (j = 0; j < 2 * i - 1; j++) { pad = pad + "⭐" }
  chhapa(pad)
}

# Number pyramid
chhapa("")
chhapa("--- 🔺 Number Pyramid ---")
liye (i = 1; i <= 5; i++) {
  ye pad = ""
  liye (j = 0; j < 5 - i; j++) { pad = pad + "  " }
  liye (j = 1; j <= i; j++) { pad = pad + sankhya(j) + " " }
  chhapa(pad)
}
`,
  },
];
