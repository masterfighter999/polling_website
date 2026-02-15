Objective
Build a web app that lets someone create a poll, share it via a link, and collect votes while results update in
real time for all viewers. The goal is to deliver a working product. You are free to choose any
implementation approach.
Required Features (Success Criteria)
1. Poll creation
• A user must be able to create a poll with a question and at least 2 options.
• After creation, the app must generate a shareable link to that poll.
2. Join by link
• Anyone with the share link must be able to view the poll and vote on one option (single-choice).
3. Real-time results
• When any user votes, all other users viewing that poll must see results update without manually
refreshing the page.
• You decide how “real-time” is achieved.
4. Fairness / anti-abuse
• The app must include at least two mechanisms that reduce repeat/abusive voting.
• You decide what threats you’re preventing and how to enforce fairness.
• In your notes (see Submission), explain what your two fairness controls are, what they prevent, and any
known limitations.
5. Persistence
• Polls and votes must be persisted so that refreshing the page does not lose the poll or votes.
• The share link must still work later (not only for the current session).
6. Deployment
• Share a publicly accessible URL where the app can be used.
Constraints
• Keep it simple.
• You may use any frameworks, libraries, external services, and AI tools.
• Prioritize correctness, stability, and handling of edge cases.