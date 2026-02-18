#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdbool.h>
#include <unistd.h>
#include <sys/select.h>
#include <termios.h>
#include <string.h>

// Global settings
int TOTAL_QUESTIONS = 5;  // Default number of questions
int TIME_LIMIT = 20;  // Default time limit in seconds

// Difficulty levels
typedef enum {
    EASY = 1,
    MEDIUM = 2,
    HARD = 3
} Difficulty;

// Function prototypes
void displayMainMenu();
void displayDifficultyMenu();
void displaySettings();
int getDigitSelection();
Difficulty getDifficultyLevel();
bool getDivisionMode();
void practiceMath(char operation, int digits, Difficulty diff, bool allowRemainder);
void practiceMixed(int digits, Difficulty diff, bool allowRemainder, bool ops[4]);
int generateNumber(int digits, Difficulty diff, char operation, bool isSecondNum);
int generateRandomNumber(int min, int max);
void clearInputBuffer();
char* getDifficultyName(Difficulty diff);
bool getAnswerWithTimeout(int *answer, int timeout);
void setNonBlockingMode(bool enable);
void special_mathPractice();
void specialMultiplication(int min, int max);
void specialSquare(int min, int max);

int main() {
    int choice;
    char continueChoice ='y';
    int digits;
    Difficulty difficulty;
    bool allowRemainder;
    
    // Seed the random number generator
    srand(time(NULL));
    
    printf("===========================================\n");
    printf("   MENTAL ARITHMETIC PRACTICE TOOL\n");
    printf("===========================================\n\n");
    
    do {
        displayMainMenu();
        printf("Enter your choice (1-8): ");
        char choice_buffer[10];
        if (fgets(choice_buffer, sizeof(choice_buffer), stdin) != NULL) {
            if (sscanf(choice_buffer, "%d", &choice) == 1){}
            else {
                choice = 0; // Invalid choice
                //printf("\nPlease Enter Only Numbers!\n");
            }
        } else {
            choice = 0; // Invalid choice
            //printf("Please Enter Only Numbers!\n");
        }

        
        if(choice >= 1 && choice <= 5) {
            // Get session settings
            digits = getDigitSelection();
            difficulty = getDifficultyLevel();
            
            if(choice == 4 || choice == 5) {
                allowRemainder = getDivisionMode();
            } else {
                allowRemainder = false;
            }
            
            if(choice == 5) {
                // Mixed operations mode
                bool operations[4] = {false, false, false, false};
                char opNames[4][20] = {"Addition", "Subtraction", "Multiplication", "Division"};
                char response;
                
                printf("\n--- Select Operations to Include ---\n");
                for(int i = 0; i < 4; i++) {
                    printf("Include %s? (y/n): ", opNames[i]);
                    char response_buffer[10];
                    if (fgets(response_buffer, sizeof(response_buffer), stdin) != NULL) {
                        sscanf(response_buffer, " %c", &response);
                    }
                    operations[i] = (response == 'y' || response == 'Y');
                }
                
                // Check if at least one operation is selected
                bool anySelected = false;
                for(int i = 0; i < 4; i++) {
                    if(operations[i]) anySelected = true;
                }
                
                if(!anySelected) {
                    printf("\nNo operations selected! Please try again.\n\n");
                    continue;
                }
                
                practiceMixed(digits, difficulty, allowRemainder, operations);
            } else {
                // Single operation mode
                char operations[] = {'+', '-', '*', '/'};
                practiceMath(operations[choice-1], digits, difficulty, allowRemainder);
            }
        } else if(choice == 6){
            special_mathPractice();
        } else if(choice == 7) {
            displaySettings();
        } else if(choice == 8) {
            printf("\nThank you for practicing! Keep it up!\n");
            return 0;
        } else {
            printf("\nInvalid choice! Please try again.\n\n");
            continue;
        }
        
        printf("\nDo you want to continue? (y/n): "); /* I've included this part because other options that have the back to menu option doesn't actually have any function to get back , so this statement works for it . Like it runs the loop again!*/
        char continue_buffer[10];
        if (fgets(continue_buffer, sizeof(continue_buffer), stdin) != NULL) {
            sscanf(continue_buffer, " %c", &continueChoice);
        }
        printf("\n");
        
        
    } while(continueChoice == 'y' || continueChoice == 'Y' || continueChoice == '\n' );
    
    printf("Thank you for practicing! Goodbye!\n");
    return 0;
}

void displayMainMenu() {
    printf("Choose an option:\n");
    printf("1. Addition (+)\n");
    printf("2. Subtraction (-)\n");
    printf("3. Multiplication (*)\n");
    printf("4. Division (/)\n");
    printf("5. Mixed Operations\n");
    printf("6. Special Practice\n");
    printf("7. Settings\n");
    printf("8. Exit\n");
    printf("-------------------------------------------\n");
}

void displayDifficultyMenu() {
    printf("\n--- Select Difficulty Level ---\n");
    printf("1. Easy\n");
    printf("2. Medium\n");
    printf("3. Hard\n");
    printf("Enter difficulty (1-3): ");
}

int getDigitSelection() {
    int digits;
    printf("\n--- Number of Digits ---\n");
    printf("Enter number of digits (1-5): ");
    char digits_buffer[10];
    if (fgets(digits_buffer, sizeof(digits_buffer), stdin) != NULL) {
        sscanf(digits_buffer, "%d", &digits);
    } else {
        digits = 0; // Invalid
    }
    
    while(digits < 1 || digits > 5) {
        printf("Invalid! Please enter a number between 1 and 5: ");
        if (fgets(digits_buffer, sizeof(digits_buffer), stdin) != NULL) {
            sscanf(digits_buffer, "%d", &digits);
        } else {
            digits = 0; // Invalid
        }
    }
    
    return digits;
}

Difficulty getDifficultyLevel() {
    int diff;
    displayDifficultyMenu();
    char diff_buffer[10];
    if (fgets(diff_buffer, sizeof(diff_buffer), stdin) != NULL) {
        sscanf(diff_buffer, "%d", &diff);
    } else {
        diff = 0; // Invalid
    }
    
    while(diff < 1 || diff > 3) {
        printf("Invalid! Please enter 1, 2, or 3: ");
        if (fgets(diff_buffer, sizeof(diff_buffer), stdin) != NULL) {
            sscanf(diff_buffer, "%d", &diff);
        } else {
            diff = 0; // Invalid
        }
    }
    
    return (Difficulty)diff;
}

void displaySettings() {
    int newQuestions, newTimeLimit;
    int choice;
    
    printf("\n===========================================\n");
    printf("               SETTINGS\n");
    printf("===========================================\n");
    printf("1. Number of questions per session: %d\n", TOTAL_QUESTIONS);
    printf("2. Time limit per question: %d seconds\n\n", TIME_LIMIT);
    
    printf("What would you like to change?\n");
    printf("1. Number of questions\n");
    printf("2. Time limit\n");
    printf("3. Both\n");
    printf("4. Back to main menu\n");
    printf("Enter choice (1-4): ");
    char choice_buffer[10];
    if (fgets(choice_buffer, sizeof(choice_buffer), stdin) != NULL) {
        sscanf(choice_buffer, "%d", &choice);
    } else {
        choice = 0; // Invalid
    }
    
    if(choice == 1 || choice == 3) {
        printf("\nEnter new number of questions (1-50): ");
        char newQuestions_buffer[10];
        if (fgets(newQuestions_buffer, sizeof(newQuestions_buffer), stdin) != NULL) {
            sscanf(newQuestions_buffer, "%d", &newQuestions);
        }
        
        if(newQuestions >= 1 && newQuestions <= 50) {
            TOTAL_QUESTIONS = newQuestions;
            printf("✓ Questions per session updated to: %d\n", TOTAL_QUESTIONS);
        } else {
            printf("✗ Invalid! Keeping current setting: %d\n", TOTAL_QUESTIONS);
        }
    }
    
    if(choice == 2 || choice == 3) {
        printf("\nEnter new time limit (5-60 seconds): ");
        char newTimeLimit_buffer[10];
        if (fgets(newTimeLimit_buffer, sizeof(newTimeLimit_buffer), stdin) != NULL) {
            sscanf(newTimeLimit_buffer, "%d", &newTimeLimit);
        }
        
        if(newTimeLimit >= 5 && newTimeLimit <= 60) {
            TIME_LIMIT = newTimeLimit;
            printf("✓ Time limit updated to: %d seconds\n", TIME_LIMIT);
        } else {
            printf("✗ Invalid! Keeping current setting: %d seconds\n", TIME_LIMIT);
        }
    }
    
    printf("===========================================\n\n");
}

bool getDivisionMode() {
    char choice;
    printf("\n--- Division Mode ---\n");
    printf("Allow remainders? (y/n): ");
    char choice_buffer[10];
    if (fgets(choice_buffer, sizeof(choice_buffer), stdin) != NULL) {
        sscanf(choice_buffer, " %c", &choice);
    } else {
        choice = 'n'; // Default to no
    }
    
    return (choice == 'y' || choice == 'Y');
}

char* getDifficultyName(Difficulty diff) {
    switch(diff) {
        case EASY: return "EASY";
        case MEDIUM: return "MEDIUM";
        case HARD: return "HARD";
        default: return "UNKNOWN";
    }
}

int generateNumber(int digits, Difficulty diff, char operation, bool isSecondNum) {
    int min = 1;
    int max = 1;
    
    // Calculate range based on digits
    for(int i = 0; i < digits - 1; i++) {
        min *= 10;
    }
    max = min * 10 - 1;
    
    int num = generateRandomNumber(min, max);
    
    // Apply difficulty-based tweaks
    if(diff == HARD) {
        int choice = rand() % 4;
        
        switch(choice) {
            case 0: // Numbers ending in 9
                num = (num / 10) * 10 + 9;
                break;
            case 1: // Numbers ending in 1
                num = (num / 10) * 10 + 1;
                break;
            case 2: // Near powers of 10
                if(rand() % 2 == 0) {
                    num = min - 1 + rand() % 3; // Close to min
                } else {
                    num = max - rand() % 3; // Close to max
                }
                break;
            case 3: // Keep random
                break;
        }
    } else if(diff == EASY && operation == '*') {
        // For easy multiplication, use smaller multipliers
        if(isSecondNum) {
            num = generateRandomNumber(2, 9);
        }
    }
    
    return num;
}

bool readString(char* buffer, int size, int timeout) {
    fd_set readfds;
    struct timeval tv;
    int result;

    FD_ZERO(&readfds);
    FD_SET(STDIN_FILENO, &readfds);

    tv.tv_sec = timeout;
    tv.tv_usec = 0;

    result = select(STDIN_FILENO + 1, &readfds, NULL, NULL, &tv);

    if (result == -1) {
        perror("select");
        return false;
    } else if (result == 0) {
        return false; // Timeout
    } else {
        if (fgets(buffer, size, stdin) != NULL) {
            // Remove trailing newline
            buffer[strcspn(buffer, "\n")] = 0;
            return true;
        }
        return false;
    }
}

bool getAnswerWithTimeout(int *answer, int timeout) {
    char buffer[100];
    if (readString(buffer, sizeof(buffer), timeout)) {
        if (sscanf(buffer, "%d", answer) == 1) {
            return true;
        }
    }
    return false;
}

void practiceMath(char operation, int digits, Difficulty diff, bool allowRemainder) {
    int num1, num2, correctAnswer, userAnswer;
    int score = 0;
    time_t startTime, currentTime;
    double elapsedTime, avgTime = 0;
    bool gotAnswer;
    
    printf("\n===========================================\n");
    printf("   %c PRACTICE - %d digits - %s MODE\n", operation, digits, getDifficultyName(diff));
    printf("   %d seconds per question\n", TIME_LIMIT);
    printf("===========================================\n\n");
    
    for(int i = 1; i <= TOTAL_QUESTIONS; i++) {
        // Generate numbers
        num1 = generateNumber(digits, diff, operation, false);
        num2 = generateNumber(digits, diff, operation, true);
        
        // Special handling for division
        if(operation == '/') {
            if(!allowRemainder) {
                // Ensure clean division by generating num1 first, then finding a divisor (num2)
                num1 = generateNumber(digits, diff, operation, false);
                
                // Find a non-trivial divisor for num2
                int temp_divisor = generateNumber(digits > 1 ? digits / 2 : 1, diff, operation, true);
                while(num1 % temp_divisor != 0 || temp_divisor == 1) {
                    temp_divisor = generateNumber(digits > 1 ? digits / 2 : 1, diff, operation, true);
                    // Failsafe to prevent infinite loop on prime numbers, though unlikely with larger numbers
                    if (temp_divisor > num1 / 2) temp_divisor = num1;
                }
                num2 = temp_divisor;
                correctAnswer = num1 / num2;
            } else {
                correctAnswer = num1 / num2;
            }
        } else {
            // Calculate correct answer
            switch(operation) {
                case '+':
                    correctAnswer = num1 + num2;
                    break;
                case '-':
                    // Ensure positive result for easier levels
                    if(diff == EASY && num1 < num2) {
                        int temp = num1;
                        num1 = num2;
                        num2 = temp;
                    }
                    correctAnswer = num1 - num2;
                    break;
                case '*':
                    correctAnswer = num1 * num2;
                    break;
            }
        }
        
        // Display question
        printf("Question %d: %d %c %d = ?\n", i, num1, operation, num2);
        printf("Your answer: ");
        fflush(stdout);
        
        // Start timer
        startTime = time(NULL);
        
        // Get answer with timeout
        gotAnswer = getAnswerWithTimeout(&userAnswer, TIME_LIMIT);
        
        // Check elapsed time
        currentTime = time(NULL);
        elapsedTime = difftime(currentTime, startTime);
        
        // Check answer and time
        if(!gotAnswer) {
            printf("\n⏰ TIME'S UP! (%d seconds)\n", TIME_LIMIT);
            printf("The correct answer was: %d\n\n", correctAnswer);
            avgTime += TIME_LIMIT;
        } else if(userAnswer == correctAnswer) {
            printf("✓ CORRECT! (%.0f seconds)\n\n", elapsedTime);
            score++;
            avgTime += elapsedTime;
        } else {
            printf("✗ INCORRECT! The correct answer was: %d (%.0f seconds)\n\n", 
                   correctAnswer, elapsedTime);
            avgTime += elapsedTime;
        }
    }
    
    // Display final score
    printf("===========================================\n");
    printf("   FINAL SCORE: %d/%d\n", score, TOTAL_QUESTIONS);
    printf("   Percentage: %.1f%%\n", (score * 100.0) / TOTAL_QUESTIONS);
    printf("   Average Time: %.2f seconds\n", avgTime / TOTAL_QUESTIONS);
    printf("===========================================\n");
}

void practiceMixed(int digits, Difficulty diff, bool allowRemainder, bool ops[4]) {
    char operations[] = {'+', '-', '*', '/'};
    int num1, num2, correctAnswer, userAnswer;
    int score = 0;
    time_t startTime, currentTime;
    double elapsedTime, avgTime = 0;
    bool gotAnswer;
    
    printf("\n===========================================\n");
    printf("   MIXED OPERATIONS - %d digits - %s MODE\n", digits, getDifficultyName(diff));
    printf("   %d seconds per question\n", TIME_LIMIT);
    printf("===========================================\n\n");
    
    for(int i = 1; i <= TOTAL_QUESTIONS; i++) {
        // Select random operation from enabled ones
        char operation;
        do {
            int opIndex = rand() % 4;
            if(ops[opIndex]) {
                operation = operations[opIndex];
                break;
            }
        } while(1);
        
        // Generate numbers
        num1 = generateNumber(digits, diff, operation, false);
        num2 = generateNumber(digits, diff, operation, true);
        
        // Calculate correct answer (same logic as practiceMath)
        if(operation == '/') {
            if(!allowRemainder) {
                // Ensure clean division by generating num1 first, then finding a divisor (num2)
                num1 = generateNumber(digits, diff, operation, false);
                
                // Find a non-trivial divisor for num2
                int temp_divisor = generateNumber(digits > 1 ? digits / 2 : 1, diff, operation, true);
                while(num1 % temp_divisor != 0 || temp_divisor == 1) {
                    temp_divisor = generateNumber(digits > 1 ? digits / 2 : 1, diff, operation, true);
                    // Failsafe to prevent infinite loop on prime numbers, though unlikely with larger numbers
                    if (temp_divisor > num1 / 2) temp_divisor = num1;
                }
                num2 = temp_divisor;
                correctAnswer = num1 / num2;
            } else {
                correctAnswer = num1 / num2;
            }
        } else {
            switch(operation) {
                case '+':
                    correctAnswer = num1 + num2;
                    break;
                case '-':
                    if(diff == EASY && num1 < num2) {
                        int temp = num1;
                        num1 = num2;
                        num2 = temp;
                    }
                    correctAnswer = num1 - num2;
                    break;
                case '*':
                    correctAnswer = num1 * num2;
                    break;
            }
        }
        
        // Display question
        printf("Question %d: %d %c %d = ?\n", i, num1, operation, num2);
        printf("Your answer: ");
        fflush(stdout);
        
        // Start timer
        startTime = time(NULL);
        
        // Get answer with timeout
        gotAnswer = getAnswerWithTimeout(&userAnswer, TIME_LIMIT);
        
        // Check elapsed time
        currentTime = time(NULL);
        elapsedTime = difftime(currentTime, startTime);
        
        // Check answer and time
        if(!gotAnswer) {
            printf("\n⏰ TIME'S UP! (%d seconds)\n", TIME_LIMIT);
            printf("The correct answer was: %d\n\n", correctAnswer);
            avgTime += TIME_LIMIT;
        } else if(userAnswer == correctAnswer) {
            printf("✓ CORRECT! (%.0f seconds)\n\n", elapsedTime);
            score++;
            avgTime += elapsedTime;
        } else {
            printf("✗ INCORRECT! The correct answer was: %d (%.0f seconds)\n\n", 
                   correctAnswer, elapsedTime);
            avgTime += elapsedTime;
        }
    }
    
    // Display final score
    printf("===========================================\n");
    printf("   FINAL SCORE: %d/%d\n", score, TOTAL_QUESTIONS);
    printf("   Percentage: %.1f%%\n", (score * 100.0) / TOTAL_QUESTIONS);
    printf("   Average Time: %.2f seconds\n", avgTime / TOTAL_QUESTIONS);
    printf("===========================================\n");
}

int generateRandomNumber(int min, int max) {
    return min + rand() % (max - min + 1);
}

void special_mathPractice(){
    int choice;
    do{
        printf("\n");
        printf("----- Enter Your Choice ------ \n");
        printf("1. Multiplicaton Table \n");
        printf("2. Square Numbers \n");
        printf("3. Square Roots \n");
        printf("4. Fractions \n");
        printf("5. Back \n");
        printf("---------------------------------\n");
            //Input for choice
        printf("Enter your choice (1-5): ");
        char choice_buffer[10];
        if (fgets(choice_buffer, sizeof(choice_buffer), stdin) != NULL) {
            if (sscanf(choice_buffer, "%d", &choice) == 1){}
            else {
                choice = 0; // Invalid choice
                printf("\nPlease Enter Only Numbers!\n");
            }
        } else {
            choice = 0; // Invalid choice
            printf("Please Enter Only Numbers! Moving To Next Question\n");
        }
        if(choice == 1){
            printf("\nChoose Options(1-3):\n");
            printf("1. Table of (1-10)\n");
            printf("2. Table of (11-20)\n");            
            printf("3. Table of (1-20)\n");
            printf("---------------------------------\n");
            
            
            char buffer[100];
            int choice_sub;
            if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
                if (sscanf(buffer, "%d", &choice_sub) == 1) { //removes the /n and gets the integer from buffer 
                    // Successfully got integer
                    if(choice_sub == 1){
                        specialMultiplication(1,10);
                    }else if(choice_sub == 2){
                        specialMultiplication(11,20);
                    }else{
                        specialMultiplication(1,20);
                    }
                } else {
                    // Invalid input
                    printf("Please Enter Only Numbers! Moving To Next Question\n");
                }
            }
        }else if(choice == 2){
            specialSquare(1,25);
        }else if(choice == 3 || choice == 4){
            printf("\n\tUse Your Calculator!\n");
        }
        
    }while(choice != 5);
}
void specialMultiplication(int min, int max){
    int score = 0;
    // Answering Part
    for(int i = 1;i<=10;i++){
        // Number Generation
        int num1 = generateRandomNumber(min,max);
        int num2 = generateRandomNumber(min,max);
        while(num1 == num2){
            num1 = generateRandomNumber(min,max);
        }
        int result = num1 * num2;
        //Question Display
        printf("Question %d: %d * %d = ?\n", i, num1, num2);
        printf("Your answer: ");
        char buffer[100];
        int answer;
        //Input Section
        if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
            if (sscanf(buffer, "%d", &answer) == 1) { //removes the /n and gets the integer from buffer 
                // Successfully got integer
                if(result == answer){
                    score++;
                    printf("✓ CORRECT!\n");
                }else{
                    printf("✗ INCORRECT! The correct answer was: %d \n",result);
                }
            } else {
                // Invalid input
                printf("Please Enter Only Numbers! Moving To Next Question\n");
            }
        }
        
    }
                        // Display final score
    printf("\n===========================================\n");
    printf("   FINAL SCORE: %d/%d\n", score, 10);
    printf("   Percentage: %.1f%%\n", (score * 100.0) /10);
    printf("===========================================\n");
    
    // multiplication Table Ends        
}
void specialSquare(int min, int max){
    int score = 0;
    // Answering Part
    for(int i = 1;i<=5;i++){
        // Number Generation
        int num1 = generateRandomNumber(min,max);
        int result = num1 * num1;
        //Question Display
        printf("Question %d: Square of %d = ?\n", i, num1);
        printf("Your answer: ");
        char buffer[100];
        int answer;
        //Input Section
        if (fgets(buffer, sizeof(buffer), stdin) != NULL) {
            if (sscanf(buffer, "%d", &answer) == 1) { //removes the /n and gets the integer from buffer 
                // Successfully got integer
                if(result == answer){
                    score++;
                    printf("✓ CORRECT!\n");
                }else{
                    printf("✗ INCORRECT! The correct answer was: %d \n",result);
                }
            } else {
                // Invalid input
                printf("Please Enter Only Numbers! Moving To Next Question\n");
            }
        }
        
    }
                        // Display final score
    printf("\n===========================================\n");
    printf("   FINAL SCORE: %d/%d\n", score, 5);
    printf("   Percentage: %.1f%%\n", (score * 100.0) /5);
    printf("===========================================\n");
    
    // multiplication Table Ends        
}
