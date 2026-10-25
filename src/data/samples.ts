import { SampleError } from '../types';

export const SAMPLE_ERRORS: SampleError[] = [
  {
    id: 'python-nameerror',
    label: 'Python: NameError',
    language: 'python',
    code: `name = "Alex"
print(nam)`,
    error: `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    print(nam)
NameError: name 'nam' is not defined. Did you mean: 'name'?`,
    context: 'Intro to Python homework - variable typo',
    expectedCategory: 'Runtime / NameError',
    description: 'The variable used in print does not match the defined variable.'
  },
  {
    id: 'java-nullpointer',
    label: 'Java: NullPointerException',
    language: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        String name = null;
        System.out.println(name.length());
    }
}`,
    error: `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null
    at Main.main(Main.java:4)`,
    context: 'Data structures lab assignment',
    expectedCategory: 'Runtime / NullPointerException',
    description: 'The program attempts to call a method on a null reference.'
  },
  {
    id: 'c-missing-semicolon',
    label: 'C: Missing semicolon',
    language: 'c',
    code: `#include <stdio.h>

int main(void) {
    printf("Hello")
    return 0;
}`,
    error: `main.c: In function 'main':
main.c:5:5: error: expected ';' before 'return'
    5 |     return 0;
      |     ^~~~~~`,
    context: 'First semester C programming lab',
    expectedCategory: 'Syntax / Semicolon',
    description: 'A semicolon is missing after the printf statement.'
  },
  {
    id: 'cpp-undefined-variable',
    label: 'C++: Undefined variable',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << total;
    return 0;
}`,
    error: `main.cpp: In function 'int main()':
main.cpp:5:13: error: 'total' was not declared in this scope
    5 |     cout << total;
      |             ^~~~~`,
    context: 'CS lab - scope & variable declarations',
    expectedCategory: 'Compiler / Scope',
    description: 'The variable total has not been declared in the visible scope.'
  },
  {
    id: 'js-typeerror',
    label: 'JavaScript: TypeError',
    language: 'javascript',
    code: `const user = null;
console.log(user.name);`,
    error: `TypeError: Cannot read properties of null (reading 'name')
    at Object.<anonymous> (/app/index.js:2:18)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)`,
    context: 'Frontend web development course',
    expectedCategory: 'Runtime / TypeError',
    description: 'The code attempts to access a property of null.'
  }
];
