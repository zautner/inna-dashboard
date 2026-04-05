# UX Tasks

## Status Legend
- [ ] pending
- [~] in-progress
- [x] done
- [!] rejected — reason appended inline

## Tasks
- [x] 1. Replace generic nav icons with distinct per-page icons — sidebar nav uses identical circles for all 6 pages; replaced with unique unicode icons (templates/index.html, static/styles.css)
- [x] 2. Add loading spinner overlay for async operations — added CSS spinner animation and btnLoading() helper; wired into Process, Publish, Save Context buttons (static/styles.css, static/app.js)
- [x] 3. Enrich empty states with calls-to-action — empty states now show guidance hints and action buttons (e.g. "Create your first plan" in empty plans list) (static/app.js, static/styles.css)
- [x] 4. Add mobile-responsive sidebar with hamburger toggle — added hamburger button, backdrop overlay, and slide-in sidebar for screens under 768px (templates/index.html, static/styles.css, static/app.js)
- [x] 5. Replace window.prompt for tag input with inline tag entry — native prompt() replaced with inline text input + Add button in plan item toolbar; supports Enter/Escape keys (static/app.js, static/styles.css)
- [x] 6. Add color-coded metric cards for urgency states — metric cards now color-code based on status when count > 0 (failed=red, waiting=amber, draft=purple, approved=green) across Queue, Publishing, and Monitor pages (static/app.js, static/styles.css)
- [x] 7. Add media thumbnails to publishing timeline items — timeline items now show 56px thumbnail previews with video/image support (static/app.js, static/styles.css)
- [x] 8. Add drag-and-drop zone for media uploads in plan items — added visual drop zone with hover feedback above file input in plan item cards (static/app.js, static/styles.css)
- [x] 9. Improve toast notifications with entrance animation and icon — toasts now slide in/out with CSS animations and show checkmark/X icons (static/styles.css, static/app.js)
- [x] 10. Add visual status badges to saved plan cards — plan cards now show colored status pills and a progress bar showing approved/total items (static/app.js, static/styles.css)
- [x] 11. Enhance persona Business Snapshot with structured layout — snapshot now shows labeled sections (Profile, Audience, Voice, Forbidden Words as red tags, Quotes with left-border styling) (static/app.js, static/styles.css)
- [x] 12. Add keyboard shortcut Ctrl/Cmd+S to save on plans and persona pages — saves current plan when modal is open on Plans page, saves context on Persona page (static/app.js)
