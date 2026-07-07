# UI Flows

The two main flows a teacher uses: rewarding a student, and managing the class.

## Flow 1: Reward a student

```
[Open app]
   |
   v
[See avatar grid + leaderboard]
   |
   v
[Tap student's avatar] -----> [Avatar highlights, becomes "selected"]
   |
   v
[Tap +1 / +2 / +3 button] --> [Avatar animates, sound plays,
   |                            leaderboard re-sorts,
   v                            localStorage saves]
   |
   v
[Same or different student?]
   |            |
   v            v
[Tap new    [Done — just leave it
 student]     selected, panel stays]
```

If the teacher taps **Sad Face** instead of +1/+2/+3:
```
[Tap selected student's Sad Face]
   |
   v
[Sad face overlay appears on avatar]
   |
   v
[Sad/buzzer sound plays]
   |
   v
[No point change. Just a visual flag for this class.]
```

## Flow 2: Start a new class

```
[Open app, current class still loaded]
   |
   v
[Tap "New Class" button in top bar]
   |
   v
[Confirm dialog: "Start a new class? This will clear all sad faces
 (points stay). Are you sure?"]
   |              |
   v              v
[Cancel]      [Confirm]
                  |
                  v
             [All sad faces cleared]
             [Points stay]
             [localStorage saves]
```

## Flow 3: Add a student

```
[Tap "+ Add Student" button in top bar]
   |
   v
[Modal: name field + photo upload (or skip photo)]
   |
   v
[Tap Save]
   |
   v
[New avatar appears in grid with default placeholder image
 until photo is added later]
```

## Layout (mobile-first)

```
+-----------------------------------+
|  Rewards  [Mute]  [New Class]    |  <- top bar
+-----------------------------------+
|  Leaderboard                      |
|  1. Ava ......... 12 pts          |
|  2. Ben .......... 9 pts          |
|  3. Clem ......... 6 pts          |
+-----------------------------------+
|  Selected: Ava                    |
|  [+1]  [+2]  [+3]  [😢]          |  <- reward panel
+-----------------------------------+
|  +-------+ +-------+ +-------+    |
|  | Ava   | | Ben   | | Clem  |    |  <- avatar grid
|  +-------+ +-------+ +-------+    |
|  +-------+ +-------+              |
|  | Dee   | | ...   |              |
|  +-------+ +-------+              |
+-----------------------------------+
```

On a wider screen (tablet/desktop), the layout switches to 2 columns: grid on the left, leaderboard + reward panel on the right.

## States

- **No student selected:** Reward panel is dimmed. "+1 / +2 / +3 / Sad Face" still visible but greyed out.
- **No students at all:** Show a friendly empty state: "Add your first student to get started" with a big "+ Add Student" button.
- **Sound off:** Mute icon shows a slash. Tap to unmute.
