# Jhoola Lab: DESIGN.md

ET 617 End-Semester Examination, 18 Nov 2026. Identity token: **23B0745**

## Exam card

| Field | Choice |
|---|---|
| P: Problem | **P5** Inquiry-based virtual laboratory |
| T: Topic | **P5-T1** Simple pendulum: length, mass, amplitude vs period (Class 9–11) |
| L: Learner context | **L2** First-generation learner in an urban low-income settlement, attends an NGO after-school centre with shared tablets |
| C: Design constraint | **C4** 10-minute sessions: one complete learning sequence fits in 10 minutes; the learner can stop and resume where they left off |
| ID | **23B0745** |

## D1 Educational problem

Class 9 learners at NGO after-school centres usually meet the pendulum as a formula to memorise (T = 2π√(L/g)) and never test it themselves. Many believe that a heavier bob or a bigger push changes how long one swing takes, and few have practised a fair test that changes only one thing at a time. Each child gets the centre's shared tablet for a short turn, so learning has to happen in short sessions that can be paused and picked up later. Jhoola Lab lets a learner predict, run timed swing experiments by changing length, mass and amplitude, and revise their idea from their own data, all within one 10-minute session.

### Learning outcomes

1. **Predict** whether changing the length, the mass of the bob or the starting angle (amplitude) changes the period of a simple pendulum, and **check** the prediction with an experiment.
2. **Design** a fair test that changes only one variable, and **explain** why the other two must stay the same.
3. **Explain** from their own data why a longer string gives a longer period, and **calculate** that making the string four times longer doubles the period.

### Context of use

- **Where:** "Prerna" NGO after-school centre in an urban settlement in Mumbai.
- **When:** 5–7 pm, one 10-minute turn per child on a shared tablet, two or three times a week.
- **Device:** a shared 10-inch Android tablet with Chrome on the centre's Wi-Fi. A facilitator is in the room.

## D2 Learner persona

| | |
|---|---|
| Name, age | **Sana Shaikh, 14**, Class 9, municipal secondary school (semi-English medium) |
| Background | First in her family to reach Class 9. Her father drives an auto-rickshaw and her mother does tailoring from home. She attends Prerna centre three evenings a week. |
| Prior knowledge (prerequisites) | Can measure length with a ruler in cm, read a stopwatch and divide by 10. Knows "a swing goes back and forth" but not the word *period*. Has not met square roots in physics, and has never planned an experiment herself. |
| Misconception M1 | **"A heavier bob swings faster"** (more mass means a shorter period). |
| Misconception M2 | **"A bigger push (larger angle) makes each swing take longer"** (amplitude changes the period). |
| Learning gap | Changes several things at once when experimenting, so she cannot tell which change caused the result. |
| Device and time | Shared tablet, one 10-minute turn, often interrupted when the next child's turn comes. |
| Language | Hindi at home, science in simple English. Key terms help when given with a Hindi gloss (period = *ek poore jhoole ka samay*). |
| Motivation | Wants to become a nurse. Enjoys hands-on activities and small wins. Loses confidence when a page starts with a formula. Encouraged by the facilitator's praise. |

## Content plan (outline for D3)

### Concept explanation (conversational, key points highlighted)

1. "Let's find out what decides how long one swing takes." The **period** is the time for one full swing, there and back.
2. Timing one swing is hard because your hand reacts late, so we **time 10 swings and divide by 10**.
3. A **fair test** changes only one thing at a time: length, mass or angle. Keep the other two the same.

### 10-minute learning sequence (C4)

| Step | Time | Learner does | Saved for resume |
|---|---|---|---|
| 1. Start | 0:30 | Picks her name on the shared tablet; sees "Continue from step N" if she stopped earlier | profile, step |
| 2. Predict | 1:30 | Answers three prediction questions (mass, angle, length). This is a diagnostic: the answers decide the order of experiments | predictions |
| 3. Lab | 5:00 | Runs pendulum trials with sliders for length, mass and angle; uses the stopwatch tool; trials go into a data table and graph | trials |
| 4. Explain and check | 2:30 | Numeric task, a "spot the fair test" task and a short written explanation that gets AI coach feedback | answers |
| 5. Wrap-up | 0:30 | Summary of what changed her mind; "Stop and save" is available at every step | done |

### Tasks (6 tasks in 4 formats)

1. **MCQ predict (mass):** "Sana ties a heavier stone to the same string. One swing will take… less time / more time / the same time." Model answer: the same time.
2. **MCQ predict (angle):** "She pulls the stone further back before letting go…" Model answer: the same time (for small angles).
3. **Lab experiment (fair test):** run two trials that change only the mass, then only the angle, then only the length.
4. **Numeric:** "A 1 m pendulum has a period of about 2.0 s. What is the period of a 25 cm pendulum?" Model answer: about 1.0 s, because a quarter of the length gives half the period.
5. **MCQ, fair-test spotting:** choose which pair of trials is a fair test of mass.
6. **Short written explanation:** "Use your results to explain whether mass changes the period." Gets AI coach feedback.

### Feedback plan

- **Correct:** confirms the answer and links it to her data ("Your two trials show the same period for 50 g and 200 g").
- **M1 (mass):** "Many people think heavier things swing faster. Let's test it: keep the length and angle the same and change only the mass."
- **M2 (angle):** "A bigger push makes the bob move faster, but it also has further to travel. Time 10 swings at 10° and at 30° and compare."

### Design challenge: learning from an unsuccessful experiment

When two trials change more than one variable, the lab marks the comparison as **not a fair test**. It names the variables that changed and asks which one to keep fixed, without saying which variable matters. A three-level hint ladder follows: a question, then pointing at the data table rows, then a "fair-test helper" that copies the last trial so she changes only one slider. The answer is never stated before she has revised her prediction.

### Adaptivity

- **Profile:** the predictions decide which experiment comes first. A learner who believes "mass matters" starts with the mass experiment.
- **Performance:** wrong answers lead to misconception-specific feedback and an extra scaffolded trial; correct answers unlock the 4× length challenge.
- **Interaction:** hint requests and repeated unfair trials switch on the fair-test helper.

### AI feature (planned)

**Lab coach:** reads the learner's written explanation together with her trial data, labels the misconception (M1, M2, none) and writes a short Socratic reply. The reply is checked before display (valid JSON, allowed labels, length limit, must not give away the answer). If the AI call fails or fails a check, a clearly labelled rule-based coach replies instead. API keys are stored only as Vercel environment variables.

### Screens

Start/profile → Session plan/resume → Predict → Lab → Explain and check → Summary → About (identity token, card, AI disclosure). The identity token appears in the footer of every screen.

### Built with

Vite React template, Tailwind CSS, Recharts and Lucide icons. AI assistance came from Claude (Claude Code), disclosed in the report's AI-use log.
