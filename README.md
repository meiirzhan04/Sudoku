# SudokuMind

SudokuMind is a modern web platform for playing, learning and competing in Sudoku.  
It combines classic Sudoku gameplay with daily challenges, AI coaching, multiplayer battles, user profiles, leaderboards, admin management and moderation tools.

> Train your brain. One grid at a time.

---

## Product Idea

SudokuMind turns a simple Sudoku board into a full brain-training platform.

The main idea of the project is not only to let users solve Sudoku puzzles, but also to help them learn, compete, track progress and build a daily habit.

The platform is designed for:

- Casual Sudoku players who want a beautiful and simple puzzle experience.
- Students and beginners who want explanations and hints.
- Competitive players who want battles, rankings and statistics.
- Users who want to improve logic thinking and daily focus.
- Demo, portfolio and hackathon presentations where the project should look like a real product.

SudokuMind is more than a basic Sudoku website.  
It includes AI learning, friend battles, admin control, blacklist system, user management, achievements, streaks and many other features.

---

## Key Features

- Modern landing page with SudokuMind branding.
- Responsive UI for desktop and mobile.
- Dark and light mode.
- Email/password authentication.
- Google OAuth authentication.
- JWT-based user sessions.
- User profile with personal information and statistics.
- Generated Sudoku puzzles.
- Difficulty levels: Easy, Medium, Hard, Expert and Insane.
- Timer, mistakes, notes mode, hints and pause.
- Undo and redo system.
- Autosave for unfinished games.
- Daily Challenge system.
- Streak system for daily habit building.
- XP, levels and achievements.
- Global and city leaderboards.
- AI Coach and AI Teacher.
- Battle with Friends mode.
- AI Battle mode.
- Friends system.
- Admin Panel.
- User management.
- Blacklist system.
- Reports and moderation.
- Audit logs for admin actions.
- Pro/Premium page idea.
- Stripe-ready monetization idea.
- Backend-ready architecture with Spring Boot and PostgreSQL.

---

## Main Modules

SudokuMind includes several major modules:

### 1. Sudoku Game

The main game module allows users to solve Sudoku puzzles with different difficulty levels.

Game features:

- Number input.
- Notes mode.
- Mistake counter.
- Timer.
- Hint button.
- Pause game.
- Continue saved game.
- Puzzle validation.
- Completion screen.
- Statistics update after finishing.

---

### 2. Daily Challenge

The Daily Challenge gives all users the same puzzle every day.

Daily Challenge features:

- One puzzle per day.
- Shared leaderboard.
- Completion time tracking.
- Mistake tracking.
- Accuracy calculation.
- Daily streak update.
- XP reward.
- Share streak action.

This helps users return every day and makes the platform more engaging.

---

### 3. Habit & Streak System

SudokuMind includes a streak system that motivates users to keep solving puzzles every day.

The dashboard can show:

- Current streak.
- Weekly progress.
- Daily goal.
- XP progress.
- Level progress.
- Streak milestones.
- Rewards.
- Streak Freeze for premium users.

Streak milestones:

- 3 days.
- 7 days.
- 14 days.
- 30 days.
- 100 days.

Guest users can store streak data in localStorage, while registered users can sync progress with the backend.

---

## Battle With Friends

SudokuMind includes a Battle with Friends mode where users can compete with each other in real time.

Players can:

- Create a private battle room.
- Invite friends using a room code.
- Invite friends using a shareable link.
- Choose difficulty level.
- Choose battle mode.
- Wait in lobby.
- Mark themselves as ready.
- Start the game together.
- Solve the same Sudoku puzzle.
- See opponent progress.
- See opponent mistakes and hints.
- View final ranking.
- Start a rematch.

Winner can be calculated by:

- Fastest completion time.
- Lowest number of mistakes.
- Lowest number of hints used.
- Highest accuracy.
- Custom battle mode rules.

Battle modes:

- 1v1 Race.
- Group Race.
- No Mistakes Challenge.
- Fastest Time Wins.
- Accuracy Battle.
- Hard Mode Duel.

This feature turns Sudoku from a solo puzzle into a competitive social experience.

---

## AI Battle Mode

SudokuMind also includes AI Battle mode.

If the user does not have friends online, they can compete against an AI opponent.

AI difficulty levels:

- Easy AI.
- Medium AI.
- Hard AI.
- Expert AI.

AI opponent behavior can include:

- Simulated solving progress.
- Different solving speeds.
- Different mistake chances.
- Different hint usage.
- Dynamic progress bar.
- Final result comparison.

AI Battle helps users train and practice anytime.

---

## AI Teacher

SudokuMind includes an AI Teacher that helps users learn Sudoku instead of simply giving answers.

The AI Teacher can:

- Explain why a number belongs in a cell.
- Explain user mistakes.
- Give hints without fully solving the puzzle.
- Teach Sudoku strategies step by step.
- Answer user questions in natural language.
- Help beginners understand Sudoku rules.
- Explain advanced techniques.
- Act like a personal Sudoku tutor during the game.

Example questions users can ask:

- "Why is 5 correct in this cell?"
- "What should I check next?"
- "Give me a hint but do not solve it fully."
- "Explain this puzzle like I am a beginner."
- "What mistake did I make?"
- "Teach me a Sudoku strategy."
- "How can I solve this row?"
- "What numbers are possible in this box?"

Possible AI Teacher topics:

- Rows.
- Columns.
- 3x3 boxes.
- Candidates.
- Hidden singles.
- Naked singles.
- Naked pairs.
- Mistake explanation.
- Logical deduction.

This makes SudokuMind educational and useful for beginners, not just another puzzle page from the internet swamp.

---

## Admin Panel

SudokuMind includes an Admin Panel for platform management.

Admin Panel sections:

- Dashboard.
- Users.
- Roles.
- Blacklist.
- Reports.
- Game Sessions.
- Battle Rooms.
- Daily Challenges.
- AI Logs.
- Analytics.
- Settings.
- Audit Logs.

Admins can:

- View all users.
- Search users by username or email.
- Add users.
- Edit users.
- Delete users.
- Change user roles.
- Block users.
- Unblock users.
- Add users to blacklist.
- Remove users from blacklist.
- View user game history.
- View battle history.
- View reports.
- Review suspicious accounts.
- Manage leaderboard data.
- View AI Teacher usage logs.
- View platform analytics.

The Admin Panel makes the project look like a real production platform, not just a lonely Sudoku board floating in browser space.

---

## User Management

SudokuMind supports full user management.

User roles:

```ts
type UserRole = "USER" | "MODERATOR" | "ADMIN"
