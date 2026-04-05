/* ── i18n — multilingual support ── */
const LOCALES = ["en", "ua", "he", "ru"];
const RTL_LOCALES = ["he"];

const translations = {
  en: {
    // Nav
    "nav.plans": "Plans",
    "nav.queue": "Queue",
    "nav.publishing": "Publishing",
    "nav.persona": "Persona",
    "nav.help": "Help",
    "nav.monitor": "Monitor",
    "app.subtitle": "Social Media Agent",
    "sidebar.itemsBatch": "{n} items/batch",
    "menuToggle": "Toggle menu",

    // Plans page
    "plans.eyebrow": "Content",
    "plans.title": "Plans",
    "plans.newPlan": "New plan",
    "plans.yourPlans": "Your plans",
    "plans.yourPlansHint": "Open a plan in a window to edit",

    // Queue page
    "queue.eyebrow": "Queue",
    "queue.title": "Queue & Processing",
    "queue.process": "Process New Items",
    "queue.refresh": "Refresh",
    "queue.counts": "Queue Counts",
    "queue.reviewEdit": "Review & Edit",
    "queue.noTextYet": "No AI text generated yet",
    "queue.editText": "AI-Generated Text",
    "queue.rethinkFeedback": "Feedback for AI",

    // Publishing page
    "pub.eyebrow": "Publishing",
    "pub.title": "Publishing Overview",
    "pub.publishDue": "Publish Due Items",
    "pub.refresh": "Refresh",
    "pub.metrics": "Publishing Metrics",
    "pub.timeline": "Upcoming & Past Publications",
    "pub.noTextPreview": "No text",
    "pub.viewDetails": "View Details",

    // Persona page
    "persona.eyebrow": "Context",
    "persona.title": "Persona Editor",
    "persona.reload": "Reload",
    "persona.save": "Save Context",
    "persona.name": "Name",
    "persona.specialty": "Specialty",
    "persona.location": "Location",
    "persona.philosophy": "Philosophy",
    "persona.targetAudience": "Target Audience",
    "persona.voiceTone": "Voice Tone",
    "persona.voiceStyle": "Voice Style",
    "persona.forbiddenWords": "Forbidden Words (one per line)",
    "persona.quotes": "Quotes (one per line)",
    "persona.snapshot": "Business Snapshot",
    "persona.snapshotProfile": "Profile",
    "persona.snapshotAudience": "Target Audience",
    "persona.snapshotVoice": "Voice",
    "persona.snapshotTone": "Tone:",
    "persona.snapshotStyle": "Style:",
    "persona.snapshotForbidden": "Forbidden Words",
    "persona.snapshotQuotes": "Quotes",

    // Help page
    "help.eyebrow": "Help",
    "help.title": "Documentation",
    "help.botCommands": "Bot Commands",
    "help.workspaceDocs": "Workspace Docs",
    "help.noDoc": "No document selected.",

    // Monitor page
    "monitor.eyebrow": "Monitor",
    "monitor.title": "Dashboard Monitor",
    "monitor.refresh": "Refresh",
    "monitor.queueHealth": "Queue Health",
    "monitor.pubSummary": "Publishing Summary",
    "monitor.recentItems": "Recent Queue Items",
    "monitor.failedItems": "Failed & Canceled Items",
    "monitor.openPlans": "Open Plans",

    // Plan modal
    "modal.plan": "Plan",
    "modal.newPlan": "New plan",
    "modal.save": "Save",
    "modal.close": "Close",
    "modal.planName": "Plan Name",
    "modal.planNamePlaceholder": "Week Plan",
    "modal.planType": "Plan Type",
    "modal.typeWeek": "week",
    "modal.typeMonth": "month",
    "modal.typeQuarter": "quarter",
    "modal.startDate": "Start Date",
    "modal.slots": "Slots",
    "modal.addRow": "Add row",
    "modal.createPlan": "Create plan",
    "modal.cancel": "Cancel",
    "modal.builderHint": "Add one row per post slot (day + format). You can change platforms later on each item.",
    "modal.addSlot": "Add slot",

    // Plan item
    "planItem.dayLabel": "Day label",
    "planItem.dayPlaceholder": "e.g. Monday",
    "planItem.goesLive": "Goes live",
    "planItem.expect": "Expect",
    "planItem.platforms": "Platforms ({n} selected)",
    "planItem.aiDraft": "AI draft text",
    "planItem.flowHint": "1) Drop or choose file \u2192 preview updates \u00b7 2) Add tag(s) \u00b7 3) Approve uploads to server",
    "planItem.dropZone": "Drop media file here or use the button below",
    "planItem.chooseFile": "Choose media file",
    "planItem.addTag": "Add tag",
    "planItem.clearMedia": "Clear media",
    "planItem.approveQueue": "Approve for queue",
    "planItem.approveTitle": "Uploads if needed, saves the plan, syncs queue, reloads from server",
    "planItem.removeSlot": "Remove slot",
    "planItem.noMedia": "No media yet",
    "planItem.noMediaHint": "Choose a file, add tags, then approve.",
    "planItem.tags": "Tags",
    "planItem.noTags": "No tags yet \u2014 use Add tag",
    "planItem.localOnly": "Local only",
    "planItem.slotPreview": "Slot preview",
    "planItem.day": "Day",
    "planItem.mediaType": "Media Type",
    "planItem.remove": "Remove",

    // Status labels
    "status.new": "New",
    "status.waiting_media": "Waiting Media",
    "status.draft": "Draft",
    "status.rethinking": "Rethinking",
    "status.approved": "Approved",
    "status.canceled": "Canceled",
    "status.posted": "Posted",
    "status.preparing": "preparing",
    "status.open": "open",
    "status.closed": "closed",

    // Metric labels
    "metric.scheduled": "Scheduled",
    "metric.published": "Published",
    "metric.failed": "Failed",
    "metric.approvedItems": "Approved Items",
    "metric.waitingSchedule": "Waiting For Schedule",
    "metric.upcoming": "Upcoming",
    "metric.approved": "Approved",
    "metric.waiting": "Waiting",

    // Content types (not translated — brand names)
    "ct.instagramFeed": "Instagram Feed",
    "ct.instagramStory": "Instagram Story",
    "ct.instagramReel": "Instagram Reel",
    "ct.facebookPost": "Facebook Post",
    "ct.tiktokVideo": "TikTok Video",

    // Buttons
    "btn.save": "Save",
    "btn.open": "Open",
    "btn.reopen": "Reopen",
    "btn.close": "Close",
    "btn.delete": "Delete",
    "btn.approve": "Approve",
    "btn.rethink": "Rethink",
    "btn.cancel": "Cancel",
    "btn.attachMedia": "Attach Media",
    "btn.submitFeedback": "Submit Feedback",
    "btn.add": "Add",
    "btn.retry": "Retry {target}",

    // Media types
    "media.photo": "photo",
    "media.video": "video",
    "media.any": "any",

    // Placeholders
    "ph.optionalCaption": "Optional caption",
    "ph.whatShouldChange": "What should change?",
    "ph.tagName": "tag name",
    "ph.planName": "e.g. April week",

    // Empty states
    "empty.noPlans": "No saved plans yet.",
    "empty.noPlansHint": "Create a content plan to schedule posts across your social channels.",
    "empty.noQueueItems": "No active queue items.",
    "empty.noQueueItemsHint": "Approve plan items to add them to the queue.",
    "empty.noWaitingMedia": "No items waiting for media.",
    "empty.noWaitingMediaHint": "Items needing media will appear here after processing.",
    "empty.noDrafts": "No drafts or rethinking items.",
    "empty.noDraftsHint": "Process queue items to generate AI drafts for review.",
    "empty.noTimeline": "No scheduled or published items.",
    "empty.noTimelineHint": "Approve drafts with a publish date to see them here.",
    "empty.noCommands": "No recent commands.",
    "empty.noErrors": "No severe errors.",
    "empty.noRecentItems": "No recent queue items.",
    "empty.noFailedItems": "No failed or canceled items.",
    "empty.noOpenPlans": "No open plans.",
    "empty.noMedia": "No media",
    "empty.noCaption": "No caption",
    "empty.noCaptionContext": "No caption context",
    "empty.noPreview": "No preview",
    "empty.noGeneratedText": "No generated text yet.",
    "empty.noPublishJobs": "No publish jobs.",

    // Toast messages
    "toast.planSaved": "Plan saved.",
    "toast.planDeleted": "Plan deleted.",
    "toast.contextSaved": "Context saved.",
    "toast.processed": "Queue processed.",
    "toast.publishComplete": "Publish-now complete.",
    "toast.mediaAttached": "Media attached to {id}.",
    "toast.rethinkSubmitted": "Rethink submitted.",
    "toast.uploadComplete": "Plan saved \u2014 media and tags are on the server.",
    "toast.retryRequested": "Retry requested.",
    "toast.actionComplete": "{action} completed.",
    "toast.noSave": "No plan to save.",
    "toast.couldNotApprove": "Could not approve slot",
    "toast.oneplatform": "Choose at least one platform.",
    "toast.processComplete": "Processing complete",
    "toast.processDetails": "Processed: {processed} \u00b7 With media: {withMedia} \u00b7 Waiting: {waiting}",
    "toast.publishDetails": "Published: {published} \u00b7 Failed: {failed}",

    // Plans
    "plans.noStartDate": "Start date not set",
    "plans.ready": "{approved}/{total} ready",
    "plans.pendingBanner": "{n} plan items pending processing or waiting for media.",
    "planItem.nSlots": "{n} slots",

    // Confirmations
    "confirm.deletePlan": "Delete this plan?",
    "confirm.cancelDraft": "Cancel this draft?",
    "confirm.cancelItem": "Cancel this item?",

    // Modal
    "modal.reviewTitle": "Review Queue Item",

    // Errors / validation
    "error.setStartDate": "Set the plan start date and day label so a publish time exists.",
    "error.chooseMedia": "Choose a media file for this slot first.",

    // Loading states
    "loading.uploading": "Uploading\u2026",
    "loading.saving": "Saving\u2026",
    "loading.loading": "Loading\u2026",
    "loading.processing": "Processing\u2026",
    "loading.publishing": "Publishing\u2026",
    "loading.approving": "Approving\u2026",
    "loading.rethinking": "Rethinking\u2026",

    // Result cards
    "result.processComplete": "Processing complete",
    "result.processDetail": "Processed: {processed} \u00b7 With media: {withMedia} \u00b7 Waiting: {waitingForMedia}",
    "result.publishComplete": "Publishing complete",
    "result.publishDetail": "Published: {published} \u00b7 Failed: {failed}",

    // Format strings
    "fmt.nSlots": "{n} slot|{n} slots",
    "fmt.nReady": "{approved}/{total} ready",
    "fmt.nItems": "{n} items",
    "fmt.startDateNotSet": "Start date not set",
    "fmt.pendingBanner": "{n} plan items pending processing or waiting for media.",
    "fmt.hasText": "has text",
    "fmt.noText": "no text",
    "fmt.processed": "Processed {date}",
    "fmt.publish": "Publish {date}",
    "fmt.failedTargets": "Failed: {targets}",

    // Plan types
    "type.week": "week",
    "type.month": "month",
    "type.quarter": "quarter",

    // Language selector
    "lang.label": "Language",
    "lang.en": "English",
    "lang.uk": "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    "lang.he": "\u05e2\u05d1\u05e8\u05d9\u05ea",
    "lang.ru": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  },

  ua: {
    "nav.plans": "\u041f\u043b\u0430\u043d\u0438",
    "nav.queue": "\u0427\u0435\u0440\u0433\u0430",
    "nav.publishing": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f",
    "nav.persona": "\u041f\u0435\u0440\u0441\u043e\u043d\u0430",
    "nav.help": "\u0414\u043e\u043f\u043e\u043c\u043e\u0433\u0430",
    "nav.monitor": "\u041c\u043e\u043d\u0456\u0442\u043e\u0440",
    "app.subtitle": "\u0410\u0433\u0435\u043d\u0442 \u0441\u043e\u0446\u0456\u0430\u043b\u044c\u043d\u0438\u0445 \u043c\u0435\u0434\u0456\u0430",
    "sidebar.itemsBatch": "{n} \u0435\u043b\u0435\u043c/\u043f\u0430\u043a\u0435\u0442",
    "menuToggle": "\u041c\u0435\u043d\u044e",

    "plans.eyebrow": "\u041a\u043e\u043d\u0442\u0435\u043d\u0442",
    "plans.title": "\u041f\u043b\u0430\u043d\u0438",
    "plans.newPlan": "\u041d\u043e\u0432\u0438\u0439 \u043f\u043b\u0430\u043d",
    "plans.yourPlans": "\u0412\u0430\u0448\u0456 \u043f\u043b\u0430\u043d\u0438",
    "plans.yourPlansHint": "\u0412\u0456\u0434\u043a\u0440\u0438\u0439\u0442\u0435 \u043f\u043b\u0430\u043d \u0434\u043b\u044f \u0440\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u043d\u043d\u044f",

    "queue.eyebrow": "\u0427\u0435\u0440\u0433\u0430",
    "queue.title": "\u0427\u0435\u0440\u0433\u0430 \u0442\u0430 \u043e\u0431\u0440\u043e\u0431\u043a\u0430",
    "queue.process": "\u041e\u0431\u0440\u043e\u0431\u0438\u0442\u0438 \u043d\u043e\u0432\u0456",
    "queue.refresh": "\u041e\u043d\u043e\u0432\u0438\u0442\u0438",
    "queue.counts": "\u041b\u0456\u0447\u0438\u043b\u044c\u043d\u0438\u043a\u0438 \u0447\u0435\u0440\u0433\u0438",
    "queue.reviewEdit": "\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u0434 \u0442\u0430 \u0440\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u043d\u043d\u044f",
    "queue.noTextYet": "\u0422\u0435\u043a\u0441\u0442 AI \u0449\u0435 \u043d\u0435 \u0437\u0433\u0435\u043d\u0435\u0440\u043e\u0432\u0430\u043d\u043e",
    "queue.editText": "\u0422\u0435\u043a\u0441\u0442, \u0437\u0433\u0435\u043d\u0435\u0440\u043e\u0432\u0430\u043d\u0438\u0439 AI",
    "queue.rethinkFeedback": "\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0438\u0439 \u0437\u0432'\u044f\u0437\u043e\u043a \u0434\u043b\u044f AI",

    "pub.eyebrow": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f",
    "pub.title": "\u041e\u0433\u043b\u044f\u0434 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0439",
    "pub.publishDue": "\u041e\u043f\u0443\u0431\u043b\u0456\u043a\u0443\u0432\u0430\u0442\u0438 \u0437\u0430\u043f\u043b\u0430\u043d\u043e\u0432\u0430\u043d\u0456",
    "pub.refresh": "\u041e\u043d\u043e\u0432\u0438\u0442\u0438",
    "pub.metrics": "\u041c\u0435\u0442\u0440\u0438\u043a\u0438 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0439",
    "pub.timeline": "\u041c\u0430\u0439\u0431\u0443\u0442\u043d\u0456 \u0442\u0430 \u043c\u0438\u043d\u0443\u043b\u0456 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457",
    "pub.noTextPreview": "\u0411\u0435\u0437 \u0442\u0435\u043a\u0441\u0442\u0443",
    "pub.viewDetails": "\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u0438",

    "persona.eyebrow": "\u041a\u043e\u043d\u0442\u0435\u043a\u0441\u0442",
    "persona.title": "\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440 \u043f\u0435\u0440\u0441\u043e\u043d\u0438",
    "persona.reload": "\u041f\u0435\u0440\u0435\u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438",
    "persona.save": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    "persona.name": "\u0406\u043c\u02bc\u044f",
    "persona.specialty": "\u0421\u043f\u0435\u0446\u0456\u0430\u043b\u044c\u043d\u0456\u0441\u0442\u044c",
    "persona.location": "\u041c\u0456\u0441\u0446\u0435",
    "persona.philosophy": "\u0424\u0456\u043b\u043e\u0441\u043e\u0444\u0456\u044f",
    "persona.targetAudience": "\u0426\u0456\u043b\u044c\u043e\u0432\u0430 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0456\u044f",
    "persona.voiceTone": "\u0422\u043e\u043d \u0433\u043e\u043b\u043e\u0441\u0443",
    "persona.voiceStyle": "\u0421\u0442\u0438\u043b\u044c \u0433\u043e\u043b\u043e\u0441\u0443",
    "persona.forbiddenWords": "\u0417\u0430\u0431\u043e\u0440\u043e\u043d\u0435\u043d\u0456 \u0441\u043b\u043e\u0432\u0430 (\u043f\u043e \u043e\u0434\u043d\u043e\u043c\u0443 \u043d\u0430 \u0440\u044f\u0434\u043e\u043a)",
    "persona.quotes": "\u0426\u0438\u0442\u0430\u0442\u0438 (\u043f\u043e \u043e\u0434\u043d\u0456\u0439 \u043d\u0430 \u0440\u044f\u0434\u043e\u043a)",
    "persona.snapshot": "\u041e\u0433\u043b\u044f\u0434 \u0431\u0456\u0437\u043d\u0435\u0441\u0443",
    "persona.snapshotProfile": "\u041f\u0440\u043e\u0444\u0456\u043b\u044c",
    "persona.snapshotAudience": "\u0426\u0456\u043b\u044c\u043e\u0432\u0430 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0456\u044f",
    "persona.snapshotVoice": "\u0413\u043e\u043b\u043e\u0441",
    "persona.snapshotTone": "\u0422\u043e\u043d:",
    "persona.snapshotStyle": "\u0421\u0442\u0438\u043b\u044c:",
    "persona.snapshotForbidden": "\u0417\u0430\u0431\u043e\u0440\u043e\u043d\u0435\u043d\u0456 \u0441\u043b\u043e\u0432\u0430",
    "persona.snapshotQuotes": "\u0426\u0438\u0442\u0430\u0442\u0438",

    "help.eyebrow": "\u0414\u043e\u043f\u043e\u043c\u043e\u0433\u0430",
    "help.title": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0456\u044f",
    "help.botCommands": "\u041a\u043e\u043c\u0430\u043d\u0434\u0438 \u0431\u043e\u0442\u0430",
    "help.workspaceDocs": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0438",
    "help.noDoc": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u043d\u0435 \u043e\u0431\u0440\u0430\u043d\u043e.",

    "monitor.eyebrow": "\u041c\u043e\u043d\u0456\u0442\u043e\u0440",
    "monitor.title": "\u041c\u043e\u043d\u0456\u0442\u043e\u0440 \u043f\u0430\u043d\u0435\u043b\u0456",
    "monitor.refresh": "\u041e\u043d\u043e\u0432\u0438\u0442\u0438",
    "monitor.queueHealth": "\u0421\u0442\u0430\u043d \u0447\u0435\u0440\u0433\u0438",
    "monitor.pubSummary": "\u041f\u0456\u0434\u0441\u0443\u043c\u043e\u043a \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0439",
    "monitor.recentItems": "\u041e\u0441\u0442\u0430\u043d\u043d\u0456 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0438",
    "monitor.failedItems": "\u041d\u0435\u0432\u0434\u0430\u043b\u0456 \u0442\u0430 \u0441\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u0456",
    "monitor.openPlans": "\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0456 \u043f\u043b\u0430\u043d\u0438",

    "modal.plan": "\u041f\u043b\u0430\u043d",
    "modal.newPlan": "\u041d\u043e\u0432\u0438\u0439 \u043f\u043b\u0430\u043d",
    "modal.save": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    "modal.close": "\u0417\u0430\u043a\u0440\u0438\u0442\u0438",
    "modal.planName": "\u041d\u0430\u0437\u0432\u0430 \u043f\u043b\u0430\u043d\u0443",
    "modal.planNamePlaceholder": "\u0422\u0438\u0436\u043d\u0435\u0432\u0438\u0439 \u043f\u043b\u0430\u043d",
    "modal.planType": "\u0422\u0438\u043f \u043f\u043b\u0430\u043d\u0443",
    "modal.typeWeek": "\u0442\u0438\u0436\u0434\u0435\u043d\u044c",
    "modal.typeMonth": "\u043c\u0456\u0441\u044f\u0446\u044c",
    "modal.typeQuarter": "\u043a\u0432\u0430\u0440\u0442\u0430\u043b",
    "modal.startDate": "\u0414\u0430\u0442\u0430 \u043f\u043e\u0447\u0430\u0442\u043a\u0443",
    "modal.slots": "\u0421\u043b\u043e\u0442\u0438",
    "modal.addRow": "\u0414\u043e\u0434\u0430\u0442\u0438 \u0440\u044f\u0434\u043e\u043a",
    "modal.createPlan": "\u0421\u0442\u0432\u043e\u0440\u0438\u0442\u0438 \u043f\u043b\u0430\u043d",
    "modal.cancel": "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438",
    "modal.builderHint": "\u0414\u043e\u0434\u0430\u0439\u0442\u0435 \u043e\u0434\u0438\u043d \u0440\u044f\u0434\u043e\u043a \u043d\u0430 \u043a\u043e\u0436\u0435\u043d \u0441\u043b\u043e\u0442 \u043f\u043e\u0441\u0442\u0443. \u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0438 \u043c\u043e\u0436\u043d\u0430 \u0437\u043c\u0456\u043d\u0438\u0442\u0438 \u043f\u0456\u0437\u043d\u0456\u0448\u0435.",
    "modal.addSlot": "\u0414\u043e\u0434\u0430\u0442\u0438 \u0441\u043b\u043e\u0442",

    "planItem.dayLabel": "\u041c\u0456\u0442\u043a\u0430 \u0434\u043d\u044f",
    "planItem.dayPlaceholder": "\u043d\u0430\u043f\u0440. \u041f\u043e\u043d\u0435\u0434\u0456\u043b\u043e\u043a",
    "planItem.goesLive": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f",
    "planItem.expect": "\u041e\u0447\u0456\u043a\u0443\u0454\u0442\u044c\u0441\u044f",
    "planItem.platforms": "\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0438 ({n} \u043e\u0431\u0440\u0430\u043d\u043e)",
    "planItem.aiDraft": "\u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430 AI",
    "planItem.flowHint": "1) \u041f\u0435\u0440\u0435\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u0430\u0431\u043e \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u0444\u0430\u0439\u043b \u00b7 2) \u0414\u043e\u0434\u0430\u0439\u0442\u0435 \u0442\u0435\u0433\u0438 \u00b7 3) \u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0456\u0442\u044c",
    "planItem.dropZone": "\u041f\u0435\u0440\u0435\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043c\u0435\u0434\u0456\u0430-\u0444\u0430\u0439\u043b \u0441\u044e\u0434\u0438",
    "planItem.chooseFile": "\u041e\u0431\u0440\u0430\u0442\u0438 \u0444\u0430\u0439\u043b",
    "planItem.addTag": "\u0414\u043e\u0434\u0430\u0442\u0438 \u0442\u0435\u0433",
    "planItem.clearMedia": "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u043c\u0435\u0434\u0456\u0430",
    "planItem.approveQueue": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0434\u043e \u0447\u0435\u0440\u0433\u0438",
    "planItem.approveTitle": "\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0443\u0454, \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454 \u0442\u0430 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0456\u0437\u0443\u0454",
    "planItem.removeSlot": "\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0441\u043b\u043e\u0442",
    "planItem.noMedia": "\u041c\u0435\u0434\u0456\u0430 \u0432\u0456\u0434\u0441\u0443\u0442\u043d\u0454",
    "planItem.noMediaHint": "\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0444\u0430\u0439\u043b, \u0434\u043e\u0434\u0430\u0439\u0442\u0435 \u0442\u0435\u0433\u0438, \u043f\u043e\u0442\u0456\u043c \u0437\u0430\u0442\u0432\u0435\u0440\u0434\u0456\u0442\u044c.",
    "planItem.tags": "\u0422\u0435\u0433\u0438",
    "planItem.noTags": "\u0422\u0435\u0433\u0456\u0432 \u043d\u0435\u043c\u0430\u0454",
    "planItem.localOnly": "\u041b\u0438\u0448\u0435 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e",
    "planItem.slotPreview": "\u041f\u0440\u0435\u0432\u02bc\u044e \u0441\u043b\u043e\u0442\u0443",
    "planItem.day": "\u0414\u0435\u043d\u044c",
    "planItem.mediaType": "\u0422\u0438\u043f \u043c\u0435\u0434\u0456\u0430",
    "planItem.remove": "\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438",

    "status.new": "\u041d\u043e\u0432\u0438\u0439",
    "status.waiting_media": "\u041e\u0447\u0456\u043a\u0443\u0454 \u043c\u0435\u0434\u0456\u0430",
    "status.draft": "\u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430",
    "status.rethinking": "\u041f\u0435\u0440\u0435\u043e\u0441\u043c\u0438\u0441\u043b\u0435\u043d\u043d\u044f",
    "status.approved": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e",
    "status.canceled": "\u0421\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u043e",
    "status.posted": "\u041e\u043f\u0443\u0431\u043b\u0456\u043a\u043e\u0432\u0430\u043d\u043e",
    "status.preparing": "\u043f\u0456\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430",
    "status.open": "\u0432\u0456\u0434\u043a\u0440\u0438\u0442\u043e",
    "status.closed": "\u0437\u0430\u043a\u0440\u0438\u0442\u043e",

    "metric.scheduled": "\u0417\u0430\u043f\u043b\u0430\u043d\u043e\u0432\u0430\u043d\u043e",
    "metric.published": "\u041e\u043f\u0443\u0431\u043b\u0456\u043a\u043e\u0432\u0430\u043d\u043e",
    "metric.failed": "\u041d\u0435\u0432\u0434\u0430\u043b\u043e",
    "metric.approvedItems": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u0456",
    "metric.waitingSchedule": "\u041e\u0447\u0456\u043a\u0443\u0454 \u0440\u043e\u0437\u043a\u043b\u0430\u0434",
    "metric.upcoming": "\u041d\u0430\u0441\u0442\u0443\u043f\u043d\u0456",
    "metric.approved": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e",
    "metric.waiting": "\u041e\u0447\u0456\u043a\u0443\u0454",

    "btn.save": "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    "btn.open": "\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438",
    "btn.reopen": "\u041f\u0435\u0440\u0435\u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438",
    "btn.close": "\u0417\u0430\u043a\u0440\u0438\u0442\u0438",
    "btn.delete": "\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438",
    "btn.approve": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438",
    "btn.rethink": "\u041f\u0435\u0440\u0435\u0434\u0443\u043c\u0430\u0442\u0438",
    "btn.cancel": "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438",
    "btn.attachMedia": "\u041f\u0440\u0438\u043a\u0440\u0456\u043f\u0438\u0442\u0438",
    "btn.submitFeedback": "\u041d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438",
    "btn.add": "\u0414\u043e\u0434\u0430\u0442\u0438",
    "btn.retry": "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0438 {target}",

    "media.photo": "\u0444\u043e\u0442\u043e",
    "media.video": "\u0432\u0456\u0434\u0435\u043e",
    "media.any": "\u0431\u0443\u0434\u044c-\u044f\u043a\u0435",

    "ph.optionalCaption": "\u041d\u0435\u043e\u0431\u043e\u0432\u02bc\u044f\u0437\u043a\u043e\u0432\u0438\u0439 \u043f\u0456\u0434\u043f\u0438\u0441",
    "ph.whatShouldChange": "\u0429\u043e \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u043e \u0437\u043c\u0456\u043d\u0438\u0442\u0438?",
    "ph.tagName": "\u043d\u0430\u0437\u0432\u0430 \u0442\u0435\u0433\u0443",
    "ph.planName": "\u043d\u0430\u043f\u0440. \u041a\u0432\u0456\u0442\u043d\u0435\u0432\u0438\u0439 \u0442\u0438\u0436\u0434\u0435\u043d\u044c",

    "empty.noPlans": "\u041f\u043b\u0430\u043d\u0456\u0432 \u043f\u043e\u043a\u0438 \u043d\u0435\u043c\u0430\u0454.",
    "empty.noPlansHint": "\u0421\u0442\u0432\u043e\u0440\u0456\u0442\u044c \u043f\u043b\u0430\u043d \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0443 \u0434\u043b\u044f \u043f\u043b\u0430\u043d\u0443\u0432\u0430\u043d\u043d\u044f \u043f\u043e\u0441\u0442\u0456\u0432.",
    "empty.noQueueItems": "\u041d\u0435\u043c\u0430\u0454 \u0430\u043a\u0442\u0438\u0432\u043d\u0438\u0445 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432.",
    "empty.noQueueItemsHint": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0456\u0442\u044c \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0438 \u043f\u043b\u0430\u043d\u0443 \u0434\u043b\u044f \u0434\u043e\u0434\u0430\u043d\u043d\u044f \u0434\u043e \u0447\u0435\u0440\u0433\u0438.",
    "empty.noWaitingMedia": "\u041d\u0435\u043c\u0430\u0454 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432 \u0449\u043e \u043e\u0447\u0456\u043a\u0443\u044e\u0442\u044c \u043c\u0435\u0434\u0456\u0430.",
    "empty.noWaitingMediaHint": "\u0415\u043b\u0435\u043c\u0435\u043d\u0442\u0438 \u0437\u02bc\u044f\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u043f\u0456\u0441\u043b\u044f \u043e\u0431\u0440\u043e\u0431\u043a\u0438.",
    "empty.noDrafts": "\u041d\u0435\u043c\u0430\u0454 \u0447\u0435\u0440\u043d\u0435\u0442\u043e\u043a.",
    "empty.noDraftsHint": "\u041e\u0431\u0440\u043e\u0431\u0456\u0442\u044c \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0438 \u0447\u0435\u0440\u0433\u0438 \u0434\u043b\u044f \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u043d\u044f \u0447\u0435\u0440\u043d\u0435\u0442\u043e\u043a AI.",
    "empty.noTimeline": "\u041d\u0435\u043c\u0430\u0454 \u0437\u0430\u043f\u043b\u0430\u043d\u043e\u0432\u0430\u043d\u0438\u0445 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0439.",
    "empty.noTimelineHint": "\u0417\u0430\u0442\u0432\u0435\u0440\u0434\u0456\u0442\u044c \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0438 \u0437 \u0434\u0430\u0442\u043e\u044e \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457.",
    "empty.noCommands": "\u041d\u0435\u043c\u0430\u0454 \u043d\u0435\u0434\u0430\u0432\u043d\u0456\u0445 \u043a\u043e\u043c\u0430\u043d\u0434.",
    "empty.noErrors": "\u041d\u0435\u043c\u0430\u0454 \u043a\u0440\u0438\u0442\u0438\u0447\u043d\u0438\u0445 \u043f\u043e\u043c\u0438\u043b\u043e\u043a.",
    "empty.noRecentItems": "\u041d\u0435\u043c\u0430\u0454 \u043d\u0435\u0434\u0430\u0432\u043d\u0456\u0445 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432.",
    "empty.noFailedItems": "\u041d\u0435\u043c\u0430\u0454 \u043d\u0435\u0432\u0434\u0430\u043b\u0438\u0445 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432.",
    "empty.noOpenPlans": "\u041d\u0435\u043c\u0430\u0454 \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438\u0445 \u043f\u043b\u0430\u043d\u0456\u0432.",
    "empty.noMedia": "\u041d\u0435\u043c\u0430\u0454 \u043c\u0435\u0434\u0456\u0430",
    "empty.noCaption": "\u041d\u0435\u043c\u0430\u0454 \u043f\u0456\u0434\u043f\u0438\u0441\u0443",
    "empty.noCaptionContext": "\u041d\u0435\u043c\u0430\u0454 \u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442\u0443",
    "empty.noPreview": "\u041d\u0435\u043c\u0430\u0454 \u043f\u0440\u0435\u0432\u02bc\u044e",
    "empty.noGeneratedText": "\u0422\u0435\u043a\u0441\u0442 \u0449\u0435 \u043d\u0435 \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u043e.",
    "empty.noPublishJobs": "\u041d\u0435\u043c\u0430\u0454 \u0437\u0430\u0432\u0434\u0430\u043d\u044c \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457.",

    "toast.planSaved": "\u041f\u043b\u0430\u043d \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e.",
    "toast.planDeleted": "\u041f\u043b\u0430\u043d \u0432\u0438\u0434\u0430\u043b\u0435\u043d\u043e.",
    "toast.contextSaved": "\u041a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e.",
    "toast.processed": "\u0427\u0435\u0440\u0433\u0443 \u043e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e.",
    "toast.publishComplete": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e.",
    "toast.mediaAttached": "\u041c\u0435\u0434\u0456\u0430 \u043f\u0440\u0438\u043a\u0440\u0456\u043f\u043b\u0435\u043d\u043e \u0434\u043e {id}.",
    "toast.rethinkSubmitted": "\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0438\u0439 \u0437\u0432\u02bc\u044f\u0437\u043e\u043a \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u043d\u043e.",
    "toast.uploadComplete": "\u041f\u043b\u0430\u043d \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u2014 \u043c\u0435\u0434\u0456\u0430 \u0442\u0430 \u0442\u0435\u0433\u0438 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0456.",
    "toast.retryRequested": "\u041f\u043e\u0432\u0442\u043e\u0440 \u0437\u0430\u043f\u0438\u0442\u0430\u043d\u043e.",
    "toast.actionComplete": "{action} \u0432\u0438\u043a\u043e\u043d\u0430\u043d\u043e.",
    "toast.noSave": "\u041d\u0435\u043c\u0430\u0454 \u043f\u043b\u0430\u043d\u0443 \u0434\u043b\u044f \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f.",
    "toast.couldNotApprove": "\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0441\u043b\u043e\u0442",
    "toast.oneplatform": "\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0445\u043e\u0447\u0430 \u0431 \u043e\u0434\u043d\u0443 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0443.",
    "toast.processComplete": "\u041e\u0431\u0440\u043e\u0431\u043a\u0443 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e",
    "toast.processDetails": "\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e: {processed} \u00b7 \u0417 \u043c\u0435\u0434\u0456\u0430: {withMedia} \u00b7 \u041e\u0447\u0456\u043a\u0443\u044e\u0442\u044c: {waiting}",
    "toast.publishDetails": "\u041e\u043f\u0443\u0431\u043b\u0456\u043a\u043e\u0432\u0430\u043d\u043e: {published} \u00b7 \u041d\u0435\u0432\u0434\u0430\u043b\u043e: {failed}",
    "plans.noStartDate": "\u0414\u0430\u0442\u0443 \u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u043d\u0435 \u0432\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e",
    "plans.ready": "{approved}/{total} \u0433\u043e\u0442\u043e\u0432\u043e",
    "plans.pendingBanner": "{n} \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432 \u043f\u043b\u0430\u043d\u0443 \u043e\u0447\u0456\u043a\u0443\u044e\u0442\u044c \u043e\u0431\u0440\u043e\u0431\u043a\u0438 \u0430\u0431\u043e \u043c\u0435\u0434\u0456\u0430.",
    "planItem.nSlots": "{n} \u0441\u043b\u043e\u0442\u0456\u0432",

    "confirm.deletePlan": "\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0446\u0435\u0439 \u043f\u043b\u0430\u043d?",
    "confirm.cancelDraft": "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0446\u044e \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0443?",
    "confirm.cancelItem": "\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0446\u0435\u0439 \u0435\u043b\u0435\u043c\u0435\u043d\u0442?",

    "modal.reviewTitle": "\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u0434 \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0430 \u0447\u0435\u0440\u0433\u0438",

    "error.setStartDate": "\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0456\u0442\u044c \u0434\u0430\u0442\u0443 \u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0442\u0430 \u043c\u0456\u0442\u043a\u0443 \u0434\u043d\u044f.",
    "error.chooseMedia": "\u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u043c\u0435\u0434\u0456\u0430-\u0444\u0430\u0439\u043b.",

    "loading.uploading": "\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f\u2026",
    "loading.saving": "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f\u2026",
    "loading.loading": "\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f\u2026",
    "loading.processing": "\u041e\u0431\u0440\u043e\u0431\u043a\u0430\u2026",
    "loading.publishing": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f\u2026",
    "loading.approving": "\u0421\u0445\u0432\u0430\u043b\u0435\u043d\u043d\u044f\u2026",
    "loading.rethinking": "\u041f\u0435\u0440\u0435\u043e\u0441\u043c\u0438\u0441\u043b\u0435\u043d\u043d\u044f\u2026",

    "result.processComplete": "\u041e\u0431\u0440\u043e\u0431\u043a\u0443 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e",
    "result.processDetail": "\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e: {processed} \u00b7 \u0417 \u043c\u0435\u0434\u0456\u0430: {withMedia} \u00b7 \u041e\u0447\u0456\u043a\u0443\u0454: {waitingForMedia}",
    "result.publishComplete": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e",
    "result.publishDetail": "\u041e\u043f\u0443\u0431\u043b\u0456\u043a\u043e\u0432\u0430\u043d\u043e: {published} \u00b7 \u041d\u0435\u0432\u0434\u0430\u043b\u043e: {failed}",

    "fmt.nSlots": "{n} \u0441\u043b\u043e\u0442|\u0441\u043b\u043e\u0442\u0456\u0432",
    "fmt.nReady": "{approved}/{total} \u0433\u043e\u0442\u043e\u0432\u043e",
    "fmt.nItems": "{n} \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432",
    "fmt.startDateNotSet": "\u0414\u0430\u0442\u0443 \u043d\u0435 \u0432\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e",
    "fmt.pendingBanner": "{n} \u0435\u043b\u0435\u043c\u0435\u043d\u0442\u0456\u0432 \u043e\u0447\u0456\u043a\u0443\u044e\u0442\u044c \u043e\u0431\u0440\u043e\u0431\u043a\u0438 \u0430\u0431\u043e \u043c\u0435\u0434\u0456\u0430.",
    "fmt.hasText": "\u0454 \u0442\u0435\u043a\u0441\u0442",
    "fmt.noText": "\u043d\u0435\u043c\u0430\u0454 \u0442\u0435\u043a\u0441\u0442\u0443",
    "fmt.processed": "\u041e\u0431\u0440\u043e\u0431\u043b\u0435\u043d\u043e {date}",
    "fmt.publish": "\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f {date}",
    "fmt.failedTargets": "\u041d\u0435\u0432\u0434\u0430\u043b\u043e: {targets}",

    "type.week": "\u0442\u0438\u0436\u0434\u0435\u043d\u044c",
    "type.month": "\u043c\u0456\u0441\u044f\u0446\u044c",
    "type.quarter": "\u043a\u0432\u0430\u0440\u0442\u0430\u043b",

    "lang.label": "\u041c\u043e\u0432\u0430",
    "lang.en": "English",
    "lang.uk": "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    "lang.he": "\u05e2\u05d1\u05e8\u05d9\u05ea",
    "lang.ru": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  },

  he: {
    "nav.plans": "\u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea",
    "nav.queue": "\u05ea\u05d5\u05e8",
    "nav.publishing": "\u05e4\u05e8\u05e1\u05d5\u05dd",
    "nav.persona": "\u05e4\u05e8\u05e1\u05d5\u05e0\u05d4",
    "nav.help": "\u05e2\u05d6\u05e8\u05d4",
    "nav.monitor": "\u05e0\u05d9\u05d8\u05d5\u05e8",
    "app.subtitle": "\u05e1\u05d5\u05db\u05df \u05de\u05d3\u05d9\u05d4 \u05d7\u05d1\u05e8\u05ea\u05d9\u05ea",
    "sidebar.itemsBatch": "{n} \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd/\u05d0\u05e6\u05d5\u05d5\u05d4",
    "menuToggle": "\u05ea\u05e4\u05e8\u05d9\u05d8",

    "plans.eyebrow": "\u05ea\u05d5\u05db\u05df",
    "plans.title": "\u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea",
    "plans.newPlan": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05d7\u05d3\u05e9\u05d4",
    "plans.yourPlans": "\u05d4\u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea \u05e9\u05dc\u05da",
    "plans.yourPlansHint": "\u05e4\u05ea\u05d7 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05dc\u05e2\u05e8\u05d9\u05db\u05d4",

    "queue.eyebrow": "\u05ea\u05d5\u05e8",
    "queue.title": "\u05ea\u05d5\u05e8 \u05d5\u05e2\u05d9\u05d1\u05d5\u05d3",
    "queue.process": "\u05e2\u05d1\u05d3 \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd",
    "queue.refresh": "\u05e8\u05e2\u05e0\u05df",
    "queue.counts": "\u05de\u05d5\u05e0\u05d9 \u05ea\u05d5\u05e8",
    "queue.reviewEdit": "\u05e1\u05e7\u05d9\u05e8\u05d4 \u05d5\u05e2\u05e8\u05d9\u05db\u05d4",
    "queue.noTextYet": "\u05d8\u05e7\u05e1\u05d8 AI \u05dc\u05d0 \u05e0\u05d5\u05e6\u05e8 \u05e2\u05d3\u05d9\u05d9\u05df",
    "queue.editText": "\u05d8\u05e7\u05e1\u05d8 \u05e9\u05e0\u05d5\u05e6\u05e8 \u05e2\u05dc \u05d9\u05d3\u05d9 AI",
    "queue.rethinkFeedback": "\u05de\u05e9\u05d5\u05d1 \u05dc-AI",

    "pub.eyebrow": "\u05e4\u05e8\u05e1\u05d5\u05dd",
    "pub.title": "\u05e1\u05e7\u05d9\u05e8\u05ea \u05e4\u05e8\u05e1\u05d5\u05dd",
    "pub.publishDue": "\u05e4\u05e8\u05e1\u05dd \u05de\u05ea\u05d5\u05d6\u05de\u05e0\u05d9\u05dd",
    "pub.refresh": "\u05e8\u05e2\u05e0\u05df",
    "pub.metrics": "\u05de\u05d3\u05d3\u05d9 \u05e4\u05e8\u05e1\u05d5\u05dd",
    "pub.timeline": "\u05e4\u05e8\u05e1\u05d5\u05de\u05d9\u05dd \u05e7\u05e8\u05d5\u05d1\u05d9\u05dd \u05d5\u05e7\u05d5\u05d3\u05de\u05d9\u05dd",
    "pub.noTextPreview": "\u05d0\u05d9\u05df \u05d8\u05e7\u05e1\u05d8",
    "pub.viewDetails": "\u05e4\u05e8\u05d8\u05d9\u05dd",

    "persona.eyebrow": "\u05d4\u05e7\u05e9\u05e8",
    "persona.title": "\u05e2\u05d5\u05e8\u05da \u05e4\u05e8\u05e1\u05d5\u05e0\u05d4",
    "persona.reload": "\u05d8\u05e2\u05df \u05de\u05d7\u05d3\u05e9",
    "persona.save": "\u05e9\u05de\u05d5\u05e8",
    "persona.name": "\u05e9\u05dd",
    "persona.specialty": "\u05d4\u05ea\u05de\u05d7\u05d5\u05ea",
    "persona.location": "\u05de\u05d9\u05e7\u05d5\u05dd",
    "persona.philosophy": "\u05e4\u05d9\u05dc\u05d5\u05e1\u05d5\u05e4\u05d9\u05d4",
    "persona.targetAudience": "\u05e7\u05d4\u05dc \u05d9\u05e2\u05d3",
    "persona.voiceTone": "\u05d8\u05d5\u05df \u05e7\u05d5\u05dc",
    "persona.voiceStyle": "\u05e1\u05d2\u05e0\u05d5\u05df \u05e7\u05d5\u05dc",
    "persona.forbiddenWords": "\u05de\u05d9\u05dc\u05d9\u05dd \u05d0\u05e1\u05d5\u05e8\u05d5\u05ea (\u05d0\u05d7\u05ea \u05dc\u05e9\u05d5\u05e8\u05d4)",
    "persona.quotes": "\u05e6\u05d9\u05d8\u05d5\u05d8\u05d9\u05dd (\u05d0\u05d7\u05d3 \u05dc\u05e9\u05d5\u05e8\u05d4)",
    "persona.snapshot": "\u05ea\u05de\u05d5\u05e0\u05ea \u05e2\u05e1\u05e7\u05d9\u05ea",
    "persona.snapshotProfile": "\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc",
    "persona.snapshotAudience": "\u05e7\u05d4\u05dc \u05d9\u05e2\u05d3",
    "persona.snapshotVoice": "\u05e7\u05d5\u05dc",
    "persona.snapshotTone": "\u05d8\u05d5\u05df:",
    "persona.snapshotStyle": "\u05e1\u05d2\u05e0\u05d5\u05df:",
    "persona.snapshotForbidden": "\u05de\u05d9\u05dc\u05d9\u05dd \u05d0\u05e1\u05d5\u05e8\u05d5\u05ea",
    "persona.snapshotQuotes": "\u05e6\u05d9\u05d8\u05d5\u05d8\u05d9\u05dd",

    "help.eyebrow": "\u05e2\u05d6\u05e8\u05d4",
    "help.title": "\u05ea\u05d9\u05e2\u05d5\u05d3",
    "help.botCommands": "\u05e4\u05e7\u05d5\u05d3\u05d5\u05ea \u05d1\u05d5\u05d8",
    "help.workspaceDocs": "\u05de\u05e1\u05de\u05db\u05d9\u05dd",
    "help.noDoc": "\u05dc\u05d0 \u05e0\u05d1\u05d7\u05e8 \u05de\u05e1\u05de\u05da.",

    "monitor.eyebrow": "\u05e0\u05d9\u05d8\u05d5\u05e8",
    "monitor.title": "\u05e0\u05d9\u05d8\u05d5\u05e8 \u05de\u05e2\u05e8\u05db\u05ea",
    "monitor.refresh": "\u05e8\u05e2\u05e0\u05df",
    "monitor.queueHealth": "\u05de\u05e6\u05d1 \u05ea\u05d5\u05e8",
    "monitor.pubSummary": "\u05e1\u05d9\u05db\u05d5\u05dd \u05e4\u05e8\u05e1\u05d5\u05dd",
    "monitor.recentItems": "\u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05d0\u05d7\u05e8\u05d5\u05e0\u05d9\u05dd",
    "monitor.failedItems": "\u05e0\u05db\u05e9\u05dc\u05d5 \u05d5\u05d1\u05d5\u05d8\u05dc\u05d5",
    "monitor.openPlans": "\u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea \u05e4\u05ea\u05d5\u05d7\u05d5\u05ea",

    "modal.plan": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea",
    "modal.newPlan": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05d7\u05d3\u05e9\u05d4",
    "modal.save": "\u05e9\u05de\u05d5\u05e8",
    "modal.close": "\u05e1\u05d2\u05d5\u05e8",
    "modal.planName": "\u05e9\u05dd \u05ea\u05d5\u05db\u05e0\u05d9\u05ea",
    "modal.planNamePlaceholder": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05e9\u05d1\u05d5\u05e2\u05d9\u05ea",
    "modal.planType": "\u05e1\u05d5\u05d2 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea",
    "modal.typeWeek": "\u05e9\u05d1\u05d5\u05e2",
    "modal.typeMonth": "\u05d7\u05d5\u05d3\u05e9",
    "modal.typeQuarter": "\u05e8\u05d1\u05e2\u05d5\u05df",
    "modal.startDate": "\u05ea\u05d0\u05e8\u05d9\u05da \u05d4\u05ea\u05d7\u05dc\u05d4",
    "modal.slots": "\u05de\u05e9\u05d1\u05e6\u05d5\u05ea",
    "modal.addRow": "\u05d4\u05d5\u05e1\u05e3 \u05e9\u05d5\u05e8\u05d4",
    "modal.createPlan": "\u05e6\u05d5\u05e8 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea",
    "modal.cancel": "\u05d1\u05d9\u05d8\u05d5\u05dc",
    "modal.builderHint": "\u05d4\u05d5\u05e1\u05e3 \u05e9\u05d5\u05e8\u05d4 \u05dc\u05db\u05dc \u05e4\u05d5\u05e1\u05d8. \u05d0\u05e4\u05e9\u05e8 \u05dc\u05e9\u05e0\u05d5\u05ea \u05e4\u05dc\u05d8\u05e4\u05d5\u05e8\u05de\u05d5\u05ea \u05d0\u05d7\u05e8 \u05db\u05da.",
    "modal.addSlot": "\u05d4\u05d5\u05e1\u05e3 \u05de\u05e9\u05d1\u05e6\u05ea",

    "planItem.dayLabel": "\u05ea\u05d5\u05d5\u05d9\u05ea \u05d9\u05d5\u05dd",
    "planItem.dayPlaceholder": "\u05dc\u05de\u05e9\u05dc \u05d9\u05d5\u05dd \u05e9\u05e0\u05d9",
    "planItem.goesLive": "\u05e2\u05d5\u05dc\u05d4 \u05dc\u05d0\u05d5\u05d5\u05d9\u05e8",
    "planItem.expect": "\u05e6\u05e4\u05d5\u05d9",
    "planItem.platforms": "\u05e4\u05dc\u05d8\u05e4\u05d5\u05e8\u05de\u05d5\u05ea ({n} \u05e0\u05d1\u05d7\u05e8\u05d5)",
    "planItem.aiDraft": "\u05d8\u05d9\u05d5\u05d8\u05ea AI",
    "planItem.flowHint": "1) \u05d2\u05e8\u05d5\u05e8 \u05d0\u05d5 \u05d1\u05d7\u05e8 \u05e7\u05d5\u05d1\u05e5 \u00b7 2) \u05d4\u05d5\u05e1\u05e3 \u05ea\u05d2\u05d9\u05d5\u05ea \u00b7 3) \u05d0\u05e9\u05e8 \u05d4\u05e2\u05dc\u05d0\u05d4",
    "planItem.dropZone": "\u05d2\u05e8\u05d5\u05e8 \u05e7\u05d5\u05d1\u05e5 \u05de\u05d3\u05d9\u05d4 \u05dc\u05db\u05d0\u05df",
    "planItem.chooseFile": "\u05d1\u05d7\u05e8 \u05e7\u05d5\u05d1\u05e5",
    "planItem.addTag": "\u05d4\u05d5\u05e1\u05e3 \u05ea\u05d2",
    "planItem.clearMedia": "\u05e0\u05e7\u05d4 \u05de\u05d3\u05d9\u05d4",
    "planItem.approveQueue": "\u05d0\u05e9\u05e8 \u05dc\u05ea\u05d5\u05e8",
    "planItem.approveTitle": "\u05de\u05e2\u05dc\u05d4, \u05e9\u05d5\u05de\u05e8 \u05d5\u05de\u05e1\u05e0\u05db\u05e8\u05df",
    "planItem.removeSlot": "\u05d4\u05e1\u05e8 \u05de\u05e9\u05d1\u05e6\u05ea",
    "planItem.noMedia": "\u05d0\u05d9\u05df \u05de\u05d3\u05d9\u05d4",
    "planItem.noMediaHint": "\u05d1\u05d7\u05e8 \u05e7\u05d5\u05d1\u05e5, \u05d4\u05d5\u05e1\u05e3 \u05ea\u05d2\u05d9\u05d5\u05ea, \u05d0\u05e9\u05e8.",
    "planItem.tags": "\u05ea\u05d2\u05d9\u05d5\u05ea",
    "planItem.noTags": "\u05d0\u05d9\u05df \u05ea\u05d2\u05d9\u05d5\u05ea",
    "planItem.localOnly": "\u05de\u05e7\u05d5\u05de\u05d9 \u05d1\u05dc\u05d1\u05d3",
    "planItem.slotPreview": "\u05ea\u05e6\u05d5\u05d2\u05d4 \u05de\u05e7\u05d3\u05d9\u05de\u05d4",
    "planItem.day": "\u05d9\u05d5\u05dd",
    "planItem.mediaType": "\u05e1\u05d5\u05d2 \u05de\u05d3\u05d9\u05d4",
    "planItem.remove": "\u05d4\u05e1\u05e8",

    "status.new": "\u05d7\u05d3\u05e9",
    "status.waiting_media": "\u05de\u05de\u05ea\u05d9\u05df \u05dc\u05de\u05d3\u05d9\u05d4",
    "status.draft": "\u05d8\u05d9\u05d5\u05d8\u05d4",
    "status.rethinking": "\u05d7\u05e9\u05d9\u05d1\u05d4 \u05de\u05d7\u05d3\u05e9",
    "status.approved": "\u05d0\u05d5\u05e9\u05e8",
    "status.canceled": "\u05d1\u05d5\u05d8\u05dc",
    "status.posted": "\u05e4\u05d5\u05e8\u05e1\u05dd",
    "status.preparing": "\u05d1\u05d4\u05db\u05e0\u05d4",
    "status.open": "\u05e4\u05ea\u05d5\u05d7",
    "status.closed": "\u05e1\u05d2\u05d5\u05e8",

    "metric.scheduled": "\u05de\u05ea\u05d5\u05d6\u05de\u05df",
    "metric.published": "\u05e4\u05d5\u05e8\u05e1\u05dd",
    "metric.failed": "\u05e0\u05db\u05e9\u05dc",
    "metric.approvedItems": "\u05d0\u05d5\u05e9\u05e8\u05d5",
    "metric.waitingSchedule": "\u05de\u05de\u05ea\u05d9\u05df \u05dc\u05ea\u05d6\u05de\u05d5\u05df",
    "metric.upcoming": "\u05e7\u05e8\u05d5\u05d1\u05d9\u05dd",
    "metric.approved": "\u05d0\u05d5\u05e9\u05e8",
    "metric.waiting": "\u05de\u05de\u05ea\u05d9\u05df",

    "btn.save": "\u05e9\u05de\u05d5\u05e8",
    "btn.open": "\u05e4\u05ea\u05d7",
    "btn.reopen": "\u05e4\u05ea\u05d7 \u05de\u05d7\u05d3\u05e9",
    "btn.close": "\u05e1\u05d2\u05d5\u05e8",
    "btn.delete": "\u05de\u05d7\u05e7",
    "btn.approve": "\u05d0\u05e9\u05e8",
    "btn.rethink": "\u05d7\u05e9\u05d5\u05d1 \u05de\u05d7\u05d3\u05e9",
    "btn.cancel": "\u05d1\u05d8\u05dc",
    "btn.attachMedia": "\u05e6\u05e8\u05e3 \u05de\u05d3\u05d9\u05d4",
    "btn.submitFeedback": "\u05e9\u05dc\u05d7 \u05de\u05e9\u05d5\u05d1",
    "btn.add": "\u05d4\u05d5\u05e1\u05e3",
    "btn.retry": "\u05e0\u05e1\u05d4 \u05e9\u05d5\u05d1 {target}",

    "media.photo": "\u05ea\u05de\u05d5\u05e0\u05d4",
    "media.video": "\u05e1\u05e8\u05d8\u05d5\u05df",
    "media.any": "\u05db\u05dc \u05e1\u05d5\u05d2",

    "ph.optionalCaption": "\u05db\u05d9\u05ea\u05d5\u05d1 \u05d0\u05d5\u05e4\u05e6\u05d9\u05d5\u05e0\u05dc\u05d9",
    "ph.whatShouldChange": "\u05de\u05d4 \u05e6\u05e8\u05d9\u05da \u05dc\u05d4\u05e9\u05ea\u05e0\u05d5\u05ea?",
    "ph.tagName": "\u05e9\u05dd \u05ea\u05d2",
    "ph.planName": "\u05dc\u05de\u05e9\u05dc \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05d0\u05e4\u05e8\u05d9\u05dc",

    "empty.noPlans": "\u05d0\u05d9\u05df \u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea.",
    "empty.noPlansHint": "\u05e6\u05d5\u05e8 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05ea\u05d5\u05db\u05df \u05dc\u05ea\u05d6\u05de\u05d5\u05df \u05e4\u05d5\u05e1\u05d8\u05d9\u05dd.",
    "empty.noQueueItems": "\u05d0\u05d9\u05df \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05e4\u05e2\u05d9\u05dc\u05d9\u05dd.",
    "empty.noQueueItemsHint": "\u05d0\u05e9\u05e8 \u05e4\u05e8\u05d9\u05d8\u05d9 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05dc\u05d4\u05d5\u05e1\u05d9\u05e3 \u05dc\u05ea\u05d5\u05e8.",
    "empty.noWaitingMedia": "\u05d0\u05d9\u05df \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd \u05dc\u05de\u05d3\u05d9\u05d4.",
    "empty.noWaitingMediaHint": "\u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05d9\u05d5\u05e4\u05d9\u05e2\u05d5 \u05d0\u05d7\u05e8\u05d9 \u05e2\u05d9\u05d1\u05d5\u05d3.",
    "empty.noDrafts": "\u05d0\u05d9\u05df \u05d8\u05d9\u05d5\u05d8\u05d5\u05ea.",
    "empty.noDraftsHint": "\u05e2\u05d1\u05d3 \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05dc\u05d9\u05e6\u05d9\u05e8\u05ea \u05d8\u05d9\u05d5\u05d8\u05d5\u05ea AI.",
    "empty.noTimeline": "\u05d0\u05d9\u05df \u05e4\u05e8\u05e1\u05d5\u05de\u05d9\u05dd \u05de\u05ea\u05d5\u05d6\u05de\u05e0\u05d9\u05dd.",
    "empty.noTimelineHint": "\u05d0\u05e9\u05e8 \u05d8\u05d9\u05d5\u05d8\u05d5\u05ea \u05e2\u05dd \u05ea\u05d0\u05e8\u05d9\u05da \u05e4\u05e8\u05e1\u05d5\u05dd.",
    "empty.noCommands": "\u05d0\u05d9\u05df \u05e4\u05e7\u05d5\u05d3\u05d5\u05ea \u05d0\u05d7\u05e8\u05d5\u05e0\u05d5\u05ea.",
    "empty.noErrors": "\u05d0\u05d9\u05df \u05e9\u05d2\u05d9\u05d0\u05d5\u05ea.",
    "empty.noRecentItems": "\u05d0\u05d9\u05df \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05d0\u05d7\u05e8\u05d5\u05e0\u05d9\u05dd.",
    "empty.noFailedItems": "\u05d0\u05d9\u05df \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05e9\u05e0\u05db\u05e9\u05dc\u05d5.",
    "empty.noOpenPlans": "\u05d0\u05d9\u05df \u05ea\u05d5\u05db\u05e0\u05d9\u05d5\u05ea \u05e4\u05ea\u05d5\u05d7\u05d5\u05ea.",
    "empty.noMedia": "\u05d0\u05d9\u05df \u05de\u05d3\u05d9\u05d4",
    "empty.noCaption": "\u05d0\u05d9\u05df \u05db\u05d9\u05ea\u05d5\u05d1",
    "empty.noCaptionContext": "\u05d0\u05d9\u05df \u05d4\u05e7\u05e9\u05e8",
    "empty.noPreview": "\u05d0\u05d9\u05df \u05ea\u05e6\u05d5\u05d2\u05d4",
    "empty.noGeneratedText": "\u05d8\u05e7\u05e1\u05d8 \u05d8\u05e8\u05dd \u05e0\u05d5\u05e6\u05e8.",
    "empty.noPublishJobs": "\u05d0\u05d9\u05df \u05de\u05e9\u05d9\u05de\u05d5\u05ea \u05e4\u05e8\u05e1\u05d5\u05dd.",

    "toast.planSaved": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05e0\u05e9\u05de\u05e8\u05d4.",
    "toast.planDeleted": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05e0\u05de\u05d7\u05e7\u05d4.",
    "toast.contextSaved": "\u05d4\u05e7\u05e9\u05e8 \u05e0\u05e9\u05de\u05e8.",
    "toast.processed": "\u05ea\u05d5\u05e8 \u05e2\u05d5\u05d1\u05d3.",
    "toast.publishComplete": "\u05e4\u05e8\u05e1\u05d5\u05dd \u05d4\u05d5\u05e9\u05dc\u05dd.",
    "toast.mediaAttached": "\u05de\u05d3\u05d9\u05d4 \u05e6\u05d5\u05e8\u05e4\u05d4 \u05dc-{id}.",
    "toast.rethinkSubmitted": "\u05de\u05e9\u05d5\u05d1 \u05e0\u05e9\u05dc\u05d7.",
    "toast.uploadComplete": "\u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05e0\u05e9\u05de\u05e8\u05d4 \u2014 \u05de\u05d3\u05d9\u05d4 \u05d5\u05ea\u05d2\u05d9\u05d5\u05ea \u05d1\u05e9\u05e8\u05ea.",
    "toast.retryRequested": "\u05e0\u05d9\u05e1\u05d9\u05d5\u05df \u05d7\u05d5\u05d6\u05e8 \u05d4\u05ea\u05d1\u05e7\u05e9.",
    "toast.actionComplete": "{action} \u05d4\u05d5\u05e9\u05dc\u05dd.",
    "toast.noSave": "\u05d0\u05d9\u05df \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05dc\u05e9\u05de\u05d9\u05e8\u05d4.",
    "toast.couldNotApprove": "\u05dc\u05d0 \u05e0\u05d9\u05ea\u05df \u05dc\u05d0\u05e9\u05e8 \u05de\u05e9\u05d1\u05e6\u05ea",
    "toast.oneplatform": "\u05d1\u05d7\u05e8 \u05dc\u05e4\u05d7\u05d5\u05ea \u05e4\u05dc\u05d8\u05e4\u05d5\u05e8\u05de\u05d4 \u05d0\u05d7\u05ea.",
    "toast.processComplete": "\u05e2\u05d9\u05d1\u05d5\u05d3 \u05d4\u05d5\u05e9\u05dc\u05dd",
    "toast.processDetails": "\u05e2\u05d5\u05d1\u05d3\u05d5: {processed} \u00b7 \u05e2\u05dd \u05de\u05d3\u05d9\u05d4: {withMedia} \u00b7 \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd: {waiting}",
    "toast.publishDetails": "\u05e4\u05d5\u05e8\u05e1\u05dd: {published} \u00b7 \u05e0\u05db\u05e9\u05dc: {failed}",
    "plans.noStartDate": "\u05dc\u05d0 \u05e0\u05e7\u05d1\u05e2 \u05ea\u05d0\u05e8\u05d9\u05da \u05d4\u05ea\u05d7\u05dc\u05d4",
    "plans.ready": "{approved}/{total} \u05de\u05d5\u05db\u05e0\u05d9\u05dd",
    "plans.pendingBanner": "{n} \u05e4\u05e8\u05d9\u05d8\u05d9 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd \u05dc\u05e2\u05d9\u05d1\u05d5\u05d3 \u05d0\u05d5 \u05dc\u05de\u05d3\u05d9\u05d4.",
    "planItem.nSlots": "{n} \u05de\u05e9\u05d1\u05e6\u05d5\u05ea",

    "confirm.deletePlan": "\u05dc\u05de\u05d7\u05d5\u05e7 \u05ea\u05d5\u05db\u05e0\u05d9\u05ea \u05d6\u05d5?",
    "confirm.cancelDraft": "\u05dc\u05d1\u05d8\u05dc \u05d8\u05d9\u05d5\u05d8\u05d4 \u05d6\u05d5?",
    "confirm.cancelItem": "\u05dc\u05d1\u05d8\u05dc \u05e4\u05e8\u05d9\u05d8 \u05d6\u05d4?",

    "modal.reviewTitle": "\u05e1\u05e7\u05d9\u05e8\u05ea \u05e4\u05e8\u05d9\u05d8 \u05ea\u05d5\u05e8",

    "error.setStartDate": "\u05d4\u05d2\u05d3\u05e8 \u05ea\u05d0\u05e8\u05d9\u05da \u05d4\u05ea\u05d7\u05dc\u05d4 \u05d5\u05ea\u05d5\u05d5\u05d9\u05ea \u05d9\u05d5\u05dd.",
    "error.chooseMedia": "\u05d1\u05d7\u05e8 \u05e7\u05d5\u05d1\u05e5 \u05de\u05d3\u05d9\u05d4 \u05e7\u05d5\u05d3\u05dd.",

    "loading.uploading": "\u05de\u05e2\u05dc\u05d4\u2026",
    "loading.saving": "\u05e9\u05d5\u05de\u05e8\u2026",
    "loading.loading": "\u05d8\u05d5\u05e2\u05df\u2026",
    "loading.processing": "\u05de\u05e2\u05d1\u05d3\u2026",
    "loading.publishing": "\u05de\u05e4\u05e8\u05e1\u05dd\u2026",
    "loading.approving": "\u05de\u05d0\u05e9\u05e8\u2026",
    "loading.rethinking": "\u05d7\u05d5\u05e9\u05d1 \u05de\u05d7\u05d3\u05e9\u2026",

    "result.processComplete": "\u05e2\u05d9\u05d1\u05d5\u05d3 \u05d4\u05d5\u05e9\u05dc\u05dd",
    "result.processDetail": "\u05e2\u05d5\u05d1\u05d3\u05d5: {processed} \u00b7 \u05e2\u05dd \u05de\u05d3\u05d9\u05d4: {withMedia} \u00b7 \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd: {waitingForMedia}",
    "result.publishComplete": "\u05e4\u05e8\u05e1\u05d5\u05dd \u05d4\u05d5\u05e9\u05dc\u05dd",
    "result.publishDetail": "\u05e4\u05d5\u05e8\u05e1\u05de\u05d5: {published} \u00b7 \u05e0\u05db\u05e9\u05dc\u05d5: {failed}",

    "fmt.nSlots": "{n} \u05de\u05e9\u05d1\u05e6\u05ea|\u05de\u05e9\u05d1\u05e6\u05d5\u05ea",
    "fmt.nReady": "{approved}/{total} \u05de\u05d5\u05db\u05e0\u05d9\u05dd",
    "fmt.nItems": "{n} \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd",
    "fmt.startDateNotSet": "\u05ea\u05d0\u05e8\u05d9\u05da \u05dc\u05d0 \u05e0\u05e7\u05d1\u05e2",
    "fmt.pendingBanner": "{n} \u05e4\u05e8\u05d9\u05d8\u05d9\u05dd \u05de\u05de\u05ea\u05d9\u05e0\u05d9\u05dd \u05dc\u05e2\u05d9\u05d1\u05d5\u05d3 \u05d0\u05d5 \u05de\u05d3\u05d9\u05d4.",
    "fmt.hasText": "\u05d9\u05e9 \u05d8\u05e7\u05e1\u05d8",
    "fmt.noText": "\u05d0\u05d9\u05df \u05d8\u05e7\u05e1\u05d8",
    "fmt.processed": "\u05e2\u05d5\u05d1\u05d3 {date}",
    "fmt.publish": "\u05e4\u05e8\u05e1\u05d5\u05dd {date}",
    "fmt.failedTargets": "\u05e0\u05db\u05e9\u05dc: {targets}",

    "type.week": "\u05e9\u05d1\u05d5\u05e2",
    "type.month": "\u05d7\u05d5\u05d3\u05e9",
    "type.quarter": "\u05e8\u05d1\u05e2\u05d5\u05df",

    "lang.label": "\u05e9\u05e4\u05d4",
    "lang.en": "English",
    "lang.uk": "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    "lang.he": "\u05e2\u05d1\u05e8\u05d9\u05ea",
    "lang.ru": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  },

  ru: {
    "nav.plans": "\u041f\u043b\u0430\u043d\u044b",
    "nav.queue": "\u041e\u0447\u0435\u0440\u0435\u0434\u044c",
    "nav.publishing": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f",
    "nav.persona": "\u041f\u0435\u0440\u0441\u043e\u043d\u0430",
    "nav.help": "\u041f\u043e\u043c\u043e\u0449\u044c",
    "nav.monitor": "\u041c\u043e\u043d\u0438\u0442\u043e\u0440",
    "app.subtitle": "\u0410\u0433\u0435\u043d\u0442 \u0441\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0445 \u0441\u0435\u0442\u0435\u0439",
    "sidebar.itemsBatch": "{n} \u044d\u043b\u0435\u043c/\u043f\u0430\u043a\u0435\u0442",
    "menuToggle": "\u041c\u0435\u043d\u044e",

    "plans.eyebrow": "\u041a\u043e\u043d\u0442\u0435\u043d\u0442",
    "plans.title": "\u041f\u043b\u0430\u043d\u044b",
    "plans.newPlan": "\u041d\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u043d",
    "plans.yourPlans": "\u0412\u0430\u0448\u0438 \u043f\u043b\u0430\u043d\u044b",
    "plans.yourPlansHint": "\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u043f\u043b\u0430\u043d \u0434\u043b\u044f \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f",

    "queue.eyebrow": "\u041e\u0447\u0435\u0440\u0435\u0434\u044c",
    "queue.title": "\u041e\u0447\u0435\u0440\u0435\u0434\u044c \u0438 \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430",
    "queue.process": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u043d\u043e\u0432\u044b\u0435",
    "queue.refresh": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c",
    "queue.counts": "\u0421\u0447\u0451\u0442\u0447\u0438\u043a\u0438 \u043e\u0447\u0435\u0440\u0435\u0434\u0438",
    "queue.reviewEdit": "\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0438 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
    "queue.noTextYet": "\u0422\u0435\u043a\u0441\u0442 AI \u0435\u0449\u0451 \u043d\u0435 \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d",
    "queue.editText": "\u0422\u0435\u043a\u0441\u0442, \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 AI",
    "queue.rethinkFeedback": "\u041e\u0442\u0437\u044b\u0432 \u0434\u043b\u044f AI",

    "pub.eyebrow": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f",
    "pub.title": "\u041e\u0431\u0437\u043e\u0440 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0439",
    "pub.publishDue": "\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c \u0437\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435",
    "pub.refresh": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c",
    "pub.metrics": "\u041c\u0435\u0442\u0440\u0438\u043a\u0438 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0439",
    "pub.timeline": "\u041f\u0440\u0435\u0434\u0441\u0442\u043e\u044f\u0449\u0438\u0435 \u0438 \u043f\u0440\u043e\u0448\u043b\u044b\u0435 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438",
    "pub.noTextPreview": "\u0411\u0435\u0437 \u0442\u0435\u043a\u0441\u0442\u0430",
    "pub.viewDetails": "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435",

    "persona.eyebrow": "\u041a\u043e\u043d\u0442\u0435\u043a\u0441\u0442",
    "persona.title": "\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440 \u043f\u0435\u0440\u0441\u043e\u043d\u044b",
    "persona.reload": "\u041f\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c",
    "persona.save": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
    "persona.name": "\u0418\u043c\u044f",
    "persona.specialty": "\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c",
    "persona.location": "\u041c\u0435\u0441\u0442\u043e",
    "persona.philosophy": "\u0424\u0438\u043b\u043e\u0441\u043e\u0444\u0438\u044f",
    "persona.targetAudience": "\u0426\u0435\u043b\u0435\u0432\u0430\u044f \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f",
    "persona.voiceTone": "\u0422\u043e\u043d \u0433\u043e\u043b\u043e\u0441\u0430",
    "persona.voiceStyle": "\u0421\u0442\u0438\u043b\u044c \u0433\u043e\u043b\u043e\u0441\u0430",
    "persona.forbiddenWords": "\u0417\u0430\u043f\u0440\u0435\u0449\u0451\u043d\u043d\u044b\u0435 \u0441\u043b\u043e\u0432\u0430 (\u043f\u043e \u043e\u0434\u043d\u043e\u043c\u0443 \u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0443)",
    "persona.quotes": "\u0426\u0438\u0442\u0430\u0442\u044b (\u043f\u043e \u043e\u0434\u043d\u043e\u0439 \u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0443)",
    "persona.snapshot": "\u041e\u0431\u0437\u043e\u0440 \u0431\u0438\u0437\u043d\u0435\u0441\u0430",
    "persona.snapshotProfile": "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
    "persona.snapshotAudience": "\u0426\u0435\u043b\u0435\u0432\u0430\u044f \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f",
    "persona.snapshotVoice": "\u0413\u043e\u043b\u043e\u0441",
    "persona.snapshotTone": "\u0422\u043e\u043d:",
    "persona.snapshotStyle": "\u0421\u0442\u0438\u043b\u044c:",
    "persona.snapshotForbidden": "\u0417\u0430\u043f\u0440\u0435\u0449\u0451\u043d\u043d\u044b\u0435 \u0441\u043b\u043e\u0432\u0430",
    "persona.snapshotQuotes": "\u0426\u0438\u0442\u0430\u0442\u044b",

    "help.eyebrow": "\u041f\u043e\u043c\u043e\u0449\u044c",
    "help.title": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u044f",
    "help.botCommands": "\u041a\u043e\u043c\u0430\u043d\u0434\u044b \u0431\u043e\u0442\u0430",
    "help.workspaceDocs": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b",
    "help.noDoc": "\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u043d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d.",

    "monitor.eyebrow": "\u041c\u043e\u043d\u0438\u0442\u043e\u0440",
    "monitor.title": "\u041c\u043e\u043d\u0438\u0442\u043e\u0440 \u043f\u0430\u043d\u0435\u043b\u0438",
    "monitor.refresh": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c",
    "monitor.queueHealth": "\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043e\u0447\u0435\u0440\u0435\u0434\u0438",
    "monitor.pubSummary": "\u0418\u0442\u043e\u0433\u0438 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0439",
    "monitor.recentItems": "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b",
    "monitor.failedItems": "\u041d\u0435\u0443\u0434\u0430\u0447\u043d\u044b\u0435 \u0438 \u043e\u0442\u043c\u0435\u043d\u0451\u043d\u043d\u044b\u0435",
    "monitor.openPlans": "\u041e\u0442\u043a\u0440\u044b\u0442\u044b\u0435 \u043f\u043b\u0430\u043d\u044b",

    "modal.plan": "\u041f\u043b\u0430\u043d",
    "modal.newPlan": "\u041d\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u043d",
    "modal.save": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
    "modal.close": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
    "modal.planName": "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u043b\u0430\u043d\u0430",
    "modal.planNamePlaceholder": "\u041d\u0435\u0434\u0435\u043b\u044c\u043d\u044b\u0439 \u043f\u043b\u0430\u043d",
    "modal.planType": "\u0422\u0438\u043f \u043f\u043b\u0430\u043d\u0430",
    "modal.typeWeek": "\u043d\u0435\u0434\u0435\u043b\u044f",
    "modal.typeMonth": "\u043c\u0435\u0441\u044f\u0446",
    "modal.typeQuarter": "\u043a\u0432\u0430\u0440\u0442\u0430\u043b",
    "modal.startDate": "\u0414\u0430\u0442\u0430 \u043d\u0430\u0447\u0430\u043b\u0430",
    "modal.slots": "\u0421\u043b\u043e\u0442\u044b",
    "modal.addRow": "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0440\u044f\u0434",
    "modal.createPlan": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u043b\u0430\u043d",
    "modal.cancel": "\u041e\u0442\u043c\u0435\u043d\u0430",
    "modal.builderHint": "\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043e\u0434\u0438\u043d \u0440\u044f\u0434 \u043d\u0430 \u043a\u0430\u0436\u0434\u044b\u0439 \u0441\u043b\u043e\u0442. \u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b \u043c\u043e\u0436\u043d\u043e \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0437\u0436\u0435.",
    "modal.addSlot": "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0441\u043b\u043e\u0442",

    "planItem.dayLabel": "\u041c\u0435\u0442\u043a\u0430 \u0434\u043d\u044f",
    "planItem.dayPlaceholder": "\u043d\u0430\u043f\u0440. \u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a",
    "planItem.goesLive": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f",
    "planItem.expect": "\u041e\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044f",
    "planItem.platforms": "\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b ({n} \u0432\u044b\u0431\u0440\u0430\u043d\u043e)",
    "planItem.aiDraft": "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a AI",
    "planItem.flowHint": "1) \u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0438\u043b\u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043b \u00b7 2) \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0442\u0435\u0433\u0438 \u00b7 3) \u0423\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435",
    "planItem.dropZone": "\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043c\u0435\u0434\u0438\u0430-\u0444\u0430\u0439\u043b \u0441\u044e\u0434\u0430",
    "planItem.chooseFile": "\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0444\u0430\u0439\u043b",
    "planItem.addTag": "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0442\u0435\u0433",
    "planItem.clearMedia": "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043c\u0435\u0434\u0438\u0430",
    "planItem.approveQueue": "\u0423\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432 \u043e\u0447\u0435\u0440\u0435\u0434\u044c",
    "planItem.approveTitle": "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442, \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442 \u0438 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u0443\u0435\u0442",
    "planItem.removeSlot": "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0441\u043b\u043e\u0442",
    "planItem.noMedia": "\u041d\u0435\u0442 \u043c\u0435\u0434\u0438\u0430",
    "planItem.noMediaHint": "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043b, \u0434\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0442\u0435\u0433\u0438, \u0443\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435.",
    "planItem.tags": "\u0422\u0435\u0433\u0438",
    "planItem.noTags": "\u041d\u0435\u0442 \u0442\u0435\u0433\u043e\u0432",
    "planItem.localOnly": "\u0422\u043e\u043b\u044c\u043a\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e",
    "planItem.slotPreview": "\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0441\u043b\u043e\u0442\u0430",
    "planItem.day": "\u0414\u0435\u043d\u044c",
    "planItem.mediaType": "\u0422\u0438\u043f \u043c\u0435\u0434\u0438\u0430",
    "planItem.remove": "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",

    "status.new": "\u041d\u043e\u0432\u044b\u0439",
    "status.waiting_media": "\u041e\u0436\u0438\u0434\u0430\u0435\u0442 \u043c\u0435\u0434\u0438\u0430",
    "status.draft": "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a",
    "status.rethinking": "\u041f\u0435\u0440\u0435\u043e\u0441\u043c\u044b\u0441\u043b\u0435\u043d\u0438\u0435",
    "status.approved": "\u0423\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e",
    "status.canceled": "\u041e\u0442\u043c\u0435\u043d\u0435\u043d\u043e",
    "status.posted": "\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043e",
    "status.preparing": "\u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430",
    "status.open": "\u043e\u0442\u043a\u0440\u044b\u0442",
    "status.closed": "\u0437\u0430\u043a\u0440\u044b\u0442",

    "metric.scheduled": "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043e",
    "metric.published": "\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043e",
    "metric.failed": "\u041d\u0435\u0443\u0434\u0430\u0447\u0430",
    "metric.approvedItems": "\u0423\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d\u043d\u044b\u0435",
    "metric.waitingSchedule": "\u041e\u0436\u0438\u0434\u0430\u0435\u0442 \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435",
    "metric.upcoming": "\u041f\u0440\u0435\u0434\u0441\u0442\u043e\u044f\u0449\u0438\u0435",
    "metric.approved": "\u0423\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e",
    "metric.waiting": "\u041e\u0436\u0438\u0434\u0430\u0435\u0442",

    "btn.save": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
    "btn.open": "\u041e\u0442\u043a\u0440\u044b\u0442\u044c",
    "btn.reopen": "\u041f\u0435\u0440\u0435\u043e\u0442\u043a\u0440\u044b\u0442\u044c",
    "btn.close": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
    "btn.delete": "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
    "btn.approve": "\u0423\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c",
    "btn.rethink": "\u041f\u0435\u0440\u0435\u0434\u0443\u043c\u0430\u0442\u044c",
    "btn.cancel": "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c",
    "btn.attachMedia": "\u041f\u0440\u0438\u043a\u0440\u0435\u043f\u0438\u0442\u044c",
    "btn.submitFeedback": "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
    "btn.add": "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
    "btn.retry": "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c {target}",

    "media.photo": "\u0444\u043e\u0442\u043e",
    "media.video": "\u0432\u0438\u0434\u0435\u043e",
    "media.any": "\u043b\u044e\u0431\u043e\u0435",

    "ph.optionalCaption": "\u041d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f \u043f\u043e\u0434\u043f\u0438\u0441\u044c",
    "ph.whatShouldChange": "\u0427\u0442\u043e \u043d\u0443\u0436\u043d\u043e \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c?",
    "ph.tagName": "\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0435\u0433\u0430",
    "ph.planName": "\u043d\u0430\u043f\u0440. \u0410\u043f\u0440\u0435\u043b\u044c\u0441\u043a\u0430\u044f \u043d\u0435\u0434\u0435\u043b\u044f",

    "empty.noPlans": "\u041f\u043b\u0430\u043d\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
    "empty.noPlansHint": "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043f\u043b\u0430\u043d \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430 \u0434\u043b\u044f \u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u043f\u043e\u0441\u0442\u043e\u0432.",
    "empty.noQueueItems": "\u041d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432.",
    "empty.noQueueItemsHint": "\u0423\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b \u043f\u043b\u0430\u043d\u0430 \u0434\u043b\u044f \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0432 \u043e\u0447\u0435\u0440\u0435\u0434\u044c.",
    "empty.noWaitingMedia": "\u041d\u0435\u0442 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432 \u043e\u0436\u0438\u0434\u0430\u044e\u0449\u0438\u0445 \u043c\u0435\u0434\u0438\u0430.",
    "empty.noWaitingMediaHint": "\u042d\u043b\u0435\u043c\u0435\u043d\u0442\u044b \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0438.",
    "empty.noDrafts": "\u041d\u0435\u0442 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a\u043e\u0432.",
    "empty.noDraftsHint": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u0439\u0442\u0435 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u044b \u0434\u043b\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a\u043e\u0432 AI.",
    "empty.noTimeline": "\u041d\u0435\u0442 \u0437\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0439.",
    "empty.noTimelineHint": "\u0423\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a\u0438 \u0441 \u0434\u0430\u0442\u043e\u0439 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438.",
    "empty.noCommands": "\u041d\u0435\u0442 \u043d\u0435\u0434\u0430\u0432\u043d\u0438\u0445 \u043a\u043e\u043c\u0430\u043d\u0434.",
    "empty.noErrors": "\u041d\u0435\u0442 \u043a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0445 \u043e\u0448\u0438\u0431\u043e\u043a.",
    "empty.noRecentItems": "\u041d\u0435\u0442 \u043d\u0435\u0434\u0430\u0432\u043d\u0438\u0445 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432.",
    "empty.noFailedItems": "\u041d\u0435\u0442 \u043d\u0435\u0443\u0434\u0430\u0447\u043d\u044b\u0445 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432.",
    "empty.noOpenPlans": "\u041d\u0435\u0442 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0445 \u043f\u043b\u0430\u043d\u043e\u0432.",
    "empty.noMedia": "\u041d\u0435\u0442 \u043c\u0435\u0434\u0438\u0430",
    "empty.noCaption": "\u041d\u0435\u0442 \u043f\u043e\u0434\u043f\u0438\u0441\u0438",
    "empty.noCaptionContext": "\u041d\u0435\u0442 \u043a\u043e\u043d\u0442\u0435\u043a\u0441\u0442\u0430",
    "empty.noPreview": "\u041d\u0435\u0442 \u043f\u0440\u0435\u0432\u044c\u044e",
    "empty.noGeneratedText": "\u0422\u0435\u043a\u0441\u0442 \u0435\u0449\u0451 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d.",
    "empty.noPublishJobs": "\u041d\u0435\u0442 \u0437\u0430\u0434\u0430\u043d\u0438\u0439 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438.",

    "toast.planSaved": "\u041f\u043b\u0430\u043d \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d.",
    "toast.planDeleted": "\u041f\u043b\u0430\u043d \u0443\u0434\u0430\u043b\u0451\u043d.",
    "toast.contextSaved": "\u041a\u043e\u043d\u0442\u0435\u043a\u0441\u0442 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d.",
    "toast.processed": "\u041e\u0447\u0435\u0440\u0435\u0434\u044c \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u0430.",
    "toast.publishComplete": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430.",
    "toast.mediaAttached": "\u041c\u0435\u0434\u0438\u0430 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0435\u043d\u043e \u043a {id}.",
    "toast.rethinkSubmitted": "\u041e\u0442\u0437\u044b\u0432 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d.",
    "toast.uploadComplete": "\u041f\u043b\u0430\u043d \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d \u2014 \u043c\u0435\u0434\u0438\u0430 \u0438 \u0442\u0435\u0433\u0438 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.",
    "toast.retryRequested": "\u041f\u043e\u0432\u0442\u043e\u0440 \u0437\u0430\u043f\u0440\u043e\u0448\u0435\u043d.",
    "toast.actionComplete": "{action} \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e.",
    "toast.noSave": "\u041d\u0435\u0442 \u043f\u043b\u0430\u043d\u0430 \u0434\u043b\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f.",
    "toast.couldNotApprove": "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0441\u043b\u043e\u0442",
    "toast.oneplatform": "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u043d\u0443 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0443.",
    "toast.processComplete": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430",
    "toast.processDetails": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u043e: {processed} \u00b7 \u0421 \u043c\u0435\u0434\u0438\u0430: {withMedia} \u00b7 \u041e\u0436\u0438\u0434\u0430\u044e\u0442: {waiting}",
    "toast.publishDetails": "\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043e: {published} \u00b7 \u041d\u0435\u0443\u0434\u0430\u0447\u043d\u043e: {failed}",
    "plans.noStartDate": "\u0414\u0430\u0442\u0430 \u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u0435 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0430",
    "plans.ready": "{approved}/{total} \u0433\u043e\u0442\u043e\u0432\u043e",
    "plans.pendingBanner": "{n} \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432 \u043f\u043b\u0430\u043d\u0430 \u043e\u0436\u0438\u0434\u0430\u044e\u0442 \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u0438\u043b\u0438 \u043c\u0435\u0434\u0438\u0430.",
    "planItem.nSlots": "{n} \u0441\u043b\u043e\u0442\u043e\u0432",

    "confirm.deletePlan": "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u043f\u043b\u0430\u043d?",
    "confirm.cancelDraft": "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a?",
    "confirm.cancelItem": "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u044d\u043b\u0435\u043c\u0435\u043d\u0442?",

    "modal.reviewTitle": "\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u0438",

    "error.setStartDate": "\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0435 \u0434\u0430\u0442\u0443 \u043d\u0430\u0447\u0430\u043b\u0430 \u0438 \u043c\u0435\u0442\u043a\u0443 \u0434\u043d\u044f.",
    "error.chooseMedia": "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0434\u0438\u0430-\u0444\u0430\u0439\u043b.",

    "loading.uploading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026",
    "loading.saving": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435\u2026",
    "loading.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026",
    "loading.processing": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430\u2026",
    "loading.publishing": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f\u2026",
    "loading.approving": "\u041e\u0434\u043e\u0431\u0440\u0435\u043d\u0438\u0435\u2026",
    "loading.rethinking": "\u041f\u0435\u0440\u0435\u043e\u0441\u043c\u044b\u0441\u043b\u0435\u043d\u0438\u0435\u2026",

    "result.processComplete": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430",
    "result.processDetail": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u043e: {processed} \u00b7 \u0421 \u043c\u0435\u0434\u0438\u0430: {withMedia} \u00b7 \u041e\u0436\u0438\u0434\u0430\u0435\u0442: {waitingForMedia}",
    "result.publishComplete": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430",
    "result.publishDetail": "\u041e\u043f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u043d\u043e: {published} \u00b7 \u041d\u0435\u0443\u0434\u0430\u0447\u0430: {failed}",

    "fmt.nSlots": "{n} \u0441\u043b\u043e\u0442|\u0441\u043b\u043e\u0442\u043e\u0432",
    "fmt.nReady": "{approved}/{total} \u0433\u043e\u0442\u043e\u0432\u043e",
    "fmt.nItems": "{n} \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432",
    "fmt.startDateNotSet": "\u0414\u0430\u0442\u0430 \u043d\u0435 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0430",
    "fmt.pendingBanner": "{n} \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432 \u043e\u0436\u0438\u0434\u0430\u044e\u0442 \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0438 \u0438\u043b\u0438 \u043c\u0435\u0434\u0438\u0430.",
    "fmt.hasText": "\u0435\u0441\u0442\u044c \u0442\u0435\u043a\u0441\u0442",
    "fmt.noText": "\u043d\u0435\u0442 \u0442\u0435\u043a\u0441\u0442\u0430",
    "fmt.processed": "\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u043e {date}",
    "fmt.publish": "\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f {date}",
    "fmt.failedTargets": "\u041d\u0435\u0443\u0434\u0430\u0447\u0430: {targets}",

    "type.week": "\u043d\u0435\u0434\u0435\u043b\u044f",
    "type.month": "\u043c\u0435\u0441\u044f\u0446",
    "type.quarter": "\u043a\u0432\u0430\u0440\u0442\u0430\u043b",

    "lang.label": "\u042f\u0437\u044b\u043a",
    "lang.en": "English",
    "lang.uk": "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    "lang.he": "\u05e2\u05d1\u05e8\u05d9\u05ea",
    "lang.ru": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  },
};

/* ── i18n engine ── */
let _locale = "en";

function getLocale() {
  if (typeof localStorage !== "undefined") {
    let saved = localStorage.getItem("ui_locale");
    if (saved === "uk") { saved = "ua"; localStorage.setItem("ui_locale", "ua"); }
    if (saved && translations[saved]) _locale = saved;
  }
  return _locale;
}

function setLocale(lang) {
  if (!translations[lang]) return;
  _locale = lang;
  if (typeof localStorage !== "undefined") localStorage.setItem("ui_locale", lang);
  const dir = RTL_LOCALES.includes(lang) ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  translateStaticElements();
  if (typeof refreshAll === "function") refreshAll();
  if (typeof renderPlans === "function") renderPlans();
  if (typeof renderContext === "function") renderContext();
  if (typeof renderStrategy === "function") renderStrategy();
  if (typeof loadQueuePage === "function" && typeof state !== "undefined" && state.activePage === "queue") loadQueuePage();
  if (typeof loadPublishingPage === "function" && typeof state !== "undefined" && state.activePage === "publishing") loadPublishingPage();
  if (typeof loadMonitorPage === "function" && typeof state !== "undefined" && state.activePage === "monitor") loadMonitorPage();
  if (typeof loadHelpDocs === "function") loadHelpDocs();
  updateLangSelector();
}

function t(key, vars) {
  const dict = translations[_locale] || translations.en;
  let str = dict[key] ?? translations.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, String(v));
    });
  }
  return str;
}

function tPlural(key, n) {
  const raw = t(key, { n });
  const parts = raw.split("|");
  return n === 1 ? parts[0] : (parts[1] || parts[0]);
}

function translateStaticElements() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined;
    el.textContent = t(el.dataset.i18n, vars);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
}

const LOCALE_FLAGS = { en: "\ud83c\uddec\ud83c\udde7", ua: "\ud83c\uddfa\ud83c\udde6", he: "\ud83c\uddee\ud83c\uddf1", ru: "\ud83c\uddf7\ud83c\uddfa" };

function updateLangSelector() {
  const flag = document.getElementById("langCurrentFlag");
  if (flag) flag.textContent = LOCALE_FLAGS[_locale] || "";
  document.querySelectorAll(".lang-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === _locale);
  });
}

// Initialize locale on load
getLocale();
document.addEventListener("DOMContentLoaded", () => {
  updateLangSelector();
  translateStaticElements();

  const toggle = document.getElementById("langToggle");
  const menu = document.getElementById("langMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    menu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (btn) {
        setLocale(btn.dataset.lang);
        menu.classList.remove("open");
      }
    });
    document.addEventListener("click", () => menu.classList.remove("open"));
  }
});
