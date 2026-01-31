class JourneyView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.activeTab = 'hero';
        this.elderMode = 'guide'; // 'guide' or 'storyteller'
        this.aiChatInput = '';
        this.aiChatMessages = [];
        this.isAiLoading = false;
        // Adventure section states (for collapsible sections)
        this.adventureSections = {
            rest: true,      // Rest & Recovery (open by default - check in first)
            journal: false,  // Journal
            arena: false,    // Boss Fights
            quests: true,    // Quests (open by default)
            habits: true,    // Daily Habits (open by default)
            badhabits: false // Bad Habits
        };
    }

    getViewType() { return VIEW_TYPE_HERO; }
    getDisplayText() { return "The Journey"; }
    getIcon() { return "compass"; }

    async onOpen() { this.render(); }
    async onClose() {}

    render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('the-journey-container');

        const s = this.plugin.settings;
        const xpToNextLevel = s.level * 100;
        const hpPercent = Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100));
        const xpPercent = Math.max(0, Math.min(100, (s.xp / xpToNextLevel) * 100));

        // --- HEADER & MAIN STATS ---
        const header = container.createDiv({ cls: 'journey-header' });
        const profile = header.createDiv({ cls: "journey-profile" });

        const avatarText = s.characterProfile?.name
            ? getCharacterTitle(s.level).split(' ')[0]
            : "🧙‍♂️";
        profile.createEl("div", { cls: "journey-avatar", text: avatarText });

        const nameText = s.characterProfile?.name || `Level ${s.level}`;
        profile.createEl("h2", { text: nameText });
        if (s.characterProfile?.name) {
            const devLevel = getDevelopmentLevel(s.level);
            const devInfo = DEVELOPMENT_LEVELS[devLevel];
            const tierProgress = getTierProgress(s.level);

            profile.createEl("div", { cls: "journey-level-badge", text: `Level ${s.level} ${getCharacterTitle(s.level).split(' ').slice(1).join(' ')}` });
            profile.createEl("div", {
                cls: `journey-human-tier-badge tier-${devLevel.replace('.', '-')}`,
                text: `${devInfo.icon} HUMAN ${devLevel} • ${tierProgress}%`
            });
        }

        const statBox = container.createDiv({ cls: "journey-stat-box" });
        statBox.createDiv({ text: `❤️ HP: ${s.hp} / ${s.maxHp}` });
        statBox.createDiv({ cls: "journey-bar-bg" }).createDiv({ cls: "journey-bar-fill hp", attr: { style: `width: ${hpPercent}%` } });
        statBox.createDiv({ text: `✨ XP: ${s.xp} / ${xpToNextLevel}` });
        statBox.createDiv({ cls: "journey-bar-bg" }).createDiv({ cls: "journey-bar-fill xp", attr: { style: `width: ${xpPercent}%` } });
        statBox.createDiv({ cls: "journey-gold", text: `💰 Gold: ${s.gold}` });

        // --- TAB NAVIGATION (4 tabs) ---
        const tabNav = container.createDiv({ cls: 'journey-tab-nav' });
        const tabs = [
            { id: 'hero', label: '🧙 Hero' },
            { id: 'adventure', label: '⚔️ Adventure' },
            { id: 'elder', label: '🔮 The Elder' },
            { id: 'chronicle', label: '📜 Chronicle' }
        ];

        tabs.forEach(tab => {
            const tabBtn = tabNav.createEl('button', {
                text: tab.label,
                cls: `journey-tab-btn ${this.activeTab === tab.id ? 'active' : ''}`
            });
            tabBtn.onclick = () => { this.activeTab = tab.id; this.render(); };
        });

        // --- TAB CONTENT ---
        const tabContent = container.createDiv({ cls: 'journey-tab-content' });

        if (this.activeTab === 'hero') this.renderHero(tabContent);
        else if (this.activeTab === 'adventure') this.renderAdventure(tabContent);
        else if (this.activeTab === 'elder') this.renderElder(tabContent);
        else if (this.activeTab === 'chronicle') this.renderChronicle(tabContent);
    }

    // ============================================================================
    // HERO TAB - Unified Character + Skills (no sub-tabs)
    // ============================================================================
    renderHero(container) {
        const s = this.plugin.settings;

        // No character created yet
        if (!s.characterProfile?.name) {
            container.createEl("h3", { text: "🧙 Begin Your Journey" });
            const emptyState = container.createDiv({ cls: 'journey-empty-character' });
            emptyState.createEl('p', { text: "Welcome, traveler!" });
            emptyState.createEl('p', { text: "Create your character to begin your Journey." });

            const createBtn = container.createEl('button', {
                text: '✨ Create Your Character',
                cls: 'journey-full-width-btn primary'
            });
            createBtn.onclick = () => {
                new CharacterCreationModal(this.app, this.plugin, () => this.render()).open();
            };
            return;
        }

        // --- CHARACTER SECTION ---
        container.createEl("h3", { text: "🎭 Character Profile" });

        // Dynamic Wisdom - changes every time tab opens, based on HUMAN 3.0 state
        const wisdom = getHuman30Wisdom(s);
        if (wisdom) {
            const wisdomSection = container.createDiv({ cls: 'journey-wisdom-section standalone' });
            wisdomSection.createDiv({ cls: 'journey-wisdom-label', text: `💡 ${wisdom.category}` });
            wisdomSection.createDiv({ cls: 'journey-wisdom-quote', text: `"${wisdom.text}"` });
            if (wisdom.source) {
                wisdomSection.createDiv({ cls: 'journey-wisdom-source', text: `— ${wisdom.source}` });
            }
        }

        // HUMAN 3.0 Framework State
        this.renderHumanState(container);

        // Gradual Quadrant Discovery - shows only discovered domains
        this.renderGradualQuadrants(container);

        // --- SKILLS SECTION ---
        container.createEl("h3", { text: "🎯 Skills", cls: 'journey-section-divider' });

        const skillService = new SkillService(this.plugin);
        const skills = skillService.getSkills();

        // Action Buttons Row
        const actionRow = container.createDiv({ cls: 'journey-skill-actions' });

        const addSkillBtn = actionRow.createEl('button', {
            text: '➕ Add Skill',
            cls: 'journey-mini-btn'
        });
        addSkillBtn.onclick = () => {
            new AddSkillModal(this.app, this.plugin, () => this.render()).open();
        };

        // Skills by Category (expanded with details)
        Object.entries(SKILL_CATEGORIES).forEach(([catId, catInfo]) => {
            const categorySkills = skills.filter(s => s.category === catId);
            if (categorySkills.length === 0) return;

            const categorySection = container.createDiv({ cls: 'journey-skill-category' });
            categorySection.createDiv({ cls: 'journey-skill-category-header', text: `${catInfo.icon} ${catInfo.name} (${categorySkills.length})` });

            const skillsList = categorySection.createDiv({ cls: 'journey-skills-list' });
            categorySkills.forEach(skill => {
                const xpPercent = Math.round((skill.xp / skill.xpToNextLevel) * 100);
                const practiceQuote = this.getSkillQuote(skill);

                const skillCard = skillsList.createDiv({ cls: 'journey-skill-card expanded' });

                // Header row with name, level, and actions
                const headerRow = skillCard.createDiv({ cls: 'journey-skill-header-row' });
                headerRow.innerHTML = `
                    <div class="journey-skill-info">
                        <span class="journey-skill-name">${skill.name}</span>
                        <span class="journey-skill-level-badge">Lv. ${skill.level}</span>
                    </div>
                `;

                // Action buttons container
                const actionBtns = headerRow.createDiv({ cls: 'journey-skill-actions-row' });

                // Check if skill can evolve (level 5+)
                const evolvedName = skillService.checkSkillEvolution(skill);
                if (evolvedName && skill.name !== evolvedName) {
                    const evolveBtn = actionBtns.createEl('button', {
                        text: '🌟 Evolve',
                        cls: 'journey-skill-evolve-btn'
                    });
                    evolveBtn.title = `Evolve to ${evolvedName}`;
                    evolveBtn.onclick = async () => {
                        if (confirm(`Evolve "${skill.name}" to "${evolvedName}"?`)) {
                            skill.name = evolvedName;
                            await this.plugin.saveSettings();
                            new Notice(`🌟 ${skill.name} has evolved!`);
                            this.render();
                        }
                    };
                }

                // Practice button
                const practiceBtn = actionBtns.createEl('button', {
                    text: '⚡ Practice',
                    cls: 'journey-skill-practice-btn'
                });
                practiceBtn.onclick = async () => {
                    await this.practiceSkill(skill, skillService);
                };

                // Merge button (combine with similar skill)
                const otherSkills = skills.filter(s => s.id !== skill.id && s.category === skill.category);
                if (otherSkills.length > 0) {
                    const mergeBtn = actionBtns.createEl('button', {
                        text: '🔗',
                        cls: 'journey-skill-merge-btn'
                    });
                    mergeBtn.title = 'Merge with another skill';
                    mergeBtn.onclick = () => {
                        this.showMergeSkillModal(skill, otherSkills, skillService);
                    };
                }

                // Delete button
                const deleteBtn = actionBtns.createEl('button', {
                    text: '🗑️',
                    cls: 'journey-skill-delete-btn'
                });
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete skill: ${skill.name}?`)) {
                        skillService.deleteSkill(skill.id);
                        await this.plugin.saveSettings();
                        this.render();
                    }
                };

                // XP Progress bar with details
                const xpSection = skillCard.createDiv({ cls: 'journey-skill-xp-section' });
                xpSection.innerHTML = `
                    <div class="journey-skill-xp-info">
                        <span class="journey-skill-xp-text">XP: ${skill.xp} / ${skill.xpToNextLevel}</span>
                        <span class="journey-skill-practice-count">🏋️ ${skill.totalPracticeCount || 0} practices</span>
                    </div>
                    <div class="journey-skill-bar">
                        <div class="journey-skill-bar-fill" style="width: ${xpPercent}%"></div>
                    </div>
                `;

                // Motivational quote/suggestion
                const quoteSection = skillCard.createDiv({ cls: 'journey-skill-quote' });
                quoteSection.innerHTML = `<span class="quote-icon">💡</span> <span class="quote-text">${practiceQuote}</span>`;
            });
        });

        // --- DISCOVERY QUESTION SECTION (at bottom) ---
        this.renderDiscoveryQuestion(container);
    }

    // Render quadrants with scores and domains - only show discovered ones
    renderGradualQuadrants(container) {
        const s = this.plugin.settings;
        const discoveryService = new DiscoveryService(this.plugin);
        const discoveredDomains = discoveryService.getDiscoveredDomains();

        // If no domains discovered yet, don't show anything
        if (discoveredDomains.length === 0) return;

        const quadrantsSection = container.createDiv({ cls: 'journey-quadrants-section' });
        quadrantsSection.createEl('h4', { text: '📊 Your Discovery' });

        const quadrantsGrid = quadrantsSection.createDiv({ cls: 'journey-quadrants-grid' });

        QUADRANTS.forEach(quadrant => {
            // Get domains for this quadrant that are discovered
            const quadrantDomainIds = Object.entries(DOMAIN_TO_QUADRANT)
                .filter(([_, q]) => q === quadrant.id)
                .map(([domainId, _]) => domainId);

            // Only get discovered domains for this quadrant
            const discoveredQuadrantDomains = s.domains.filter(d =>
                quadrantDomainIds.includes(d.id) && discoveredDomains.includes(d.id)
            );

            // Skip this quadrant if no domains discovered in it
            if (discoveredQuadrantDomains.length === 0) return;

            // Calculate score only from discovered domains
            const scores = discoveredQuadrantDomains.map(d => d.score);
            const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            const card = quadrantsGrid.createDiv({ cls: 'journey-quadrant-card' });

            const header = card.createDiv({
                cls: 'journey-quadrant-header',
                attr: { style: `background: ${quadrant.color}20` }
            });
            header.innerHTML = `
                <span class="journey-quadrant-icon">${quadrant.icon}</span>
                <span class="journey-quadrant-name">${quadrant.name}</span>
                <span class="journey-quadrant-score">${score}%</span>
            `;

            const barContainer = card.createDiv({ cls: 'journey-quadrant-bar-container' });
            barContainer.createDiv({
                cls: 'journey-quadrant-bar',
                attr: { style: `width: ${score}%; background-color: ${quadrant.color}` }
            });

            // Show only discovered domains inside the quadrant card
            const domainsContainer = card.createDiv({ cls: 'journey-quadrant-domains' });
            discoveredQuadrantDomains.forEach(domain => {
                const domainRow = domainsContainer.createDiv({ cls: 'journey-quadrant-domain-row' });
                domainRow.innerHTML = `
                    <span class="journey-domain-icon-small">${domain.icon}</span>
                    <span class="journey-domain-name-small">${domain.name}</span>
                    <div class="journey-domain-bar-mini">
                        <div class="journey-domain-fill-mini" style="width: ${domain.score}%; background: ${quadrant.color}"></div>
                    </div>
                    <span class="journey-domain-score-small">${domain.score}%</span>
                `;
            });
        });
    }

    // Render HUMAN 3.0 Framework state
    renderHumanState(container) {
        const s = this.plugin.settings;

        // Get HUMAN 3.0 data
        const devLevel = getDevelopmentLevel(s.level);
        const devInfo = DEVELOPMENT_LEVELS[devLevel];
        const currentPhase = determinePhase(s);
        const phaseInfo = PHASES[currentPhase];
        const tierProgress = getTierProgress(s.level);

        const stateSection = container.createDiv({ cls: 'journey-human-state' });

        // HUMAN Tier Card
        const tierCard = stateSection.createDiv({ cls: 'journey-human-tier-card' });
        tierCard.innerHTML = `
            <div class="journey-tier-header">
                <span class="journey-tier-icon">${devInfo.icon}</span>
                <div class="journey-tier-info">
                    <span class="journey-tier-level">HUMAN ${devLevel}</span>
                    <span class="journey-tier-name">${devInfo.name}</span>
                </div>
            </div>
            <div class="journey-tier-desc">${devInfo.desc}</div>
            <div class="journey-tier-journey">🎯 ${devInfo.journey}</div>
            <div class="journey-tier-progress">
                <div class="journey-tier-progress-bar">
                    <div class="journey-tier-progress-fill" style="width: ${tierProgress}%"></div>
                </div>
                <span class="journey-tier-progress-text">${tierProgress}% to next tier</span>
            </div>
        `;

        // Current Phase Card
        const phaseCard = stateSection.createDiv({ cls: 'journey-phase-card' });
        phaseCard.innerHTML = `
            <div class="journey-phase-header">
                <span class="journey-phase-icon">${phaseInfo.icon}</span>
                <span class="journey-phase-name">${phaseInfo.name} Phase</span>
                <span class="journey-phase-multiplier">×${phaseInfo.xpMultiplier} XP</span>
            </div>
            <div class="journey-phase-desc">${phaseInfo.desc}</div>
        `;
    }

    // Render discovery question at bottom of Hero tab
    renderDiscoveryQuestion(container) {
        const s = this.plugin.settings;
        const discoveryService = new DiscoveryService(this.plugin);

        // Get current question (core or AI-generated)
        let currentQuestion = discoveryService.getCurrentQuestion(QUESTION_BANK, DOMAIN_ORDER);

        // If core questions done, need to generate AI question
        if (currentQuestion && currentQuestion.needsAiGeneration) {
            // Show loading state while generating
            const loadingBox = container.createDiv({ cls: 'journey-discovery-question ai-generating' });
            loadingBox.createEl('h4', { text: '🤖 Generating New Question...' });

            const totalAnswered = discoveryService.getTotalAnsweredQuestions();
            loadingBox.createEl('p', {
                text: `You've completed ${totalAnswered} questions! Generating a personalized question for deeper discovery...`,
                cls: 'journey-discovery-message'
            });

            // Generate AI question
            this.generateAndShowAiQuestion(container, discoveryService);
            return;
        }

        if (!currentQuestion) {
            // Fallback - should not happen normally
            const completeBox = container.createDiv({ cls: 'journey-discovery-question complete' });
            completeBox.createEl('h4', { text: '✨ Keep Exploring!' });
            completeBox.createEl('p', {
                text: 'Your journey of self-discovery continues. Check back soon for more questions!',
                cls: 'journey-discovery-message'
            });
            return;
        }

        // Show the question
        const isAiQuestion = currentQuestion.isAiGenerated || currentQuestion.isFallback;
        const questionBox = container.createDiv({
            cls: `journey-discovery-question ${isAiQuestion ? 'ai-question' : ''}`
        });

        // Header based on question type
        const totalAnswered = discoveryService.getTotalAnsweredQuestions();
        if (isAiQuestion) {
            questionBox.createEl('h4', { text: '🤖 Personalized Discovery' });
            questionBox.createDiv({
                cls: 'journey-discovery-progress',
                text: `Question ${totalAnswered + 1} • Exploring your growth areas`
            });
        } else {
            questionBox.createEl('h4', { text: '✨ Discovery Question' });
            questionBox.createDiv({
                cls: 'journey-discovery-progress',
                text: `Question ${totalAnswered + 1} of 37+ • Core Assessment`
            });
        }

        // Question domain hint (subtle)
        const domain = DEFAULT_DOMAINS.find(d => d.id === currentQuestion.domain);
        if (domain) {
            questionBox.createDiv({
                cls: 'journey-discovery-domain-hint',
                text: `${domain.icon} ${domain.name}`
            });
        }

        questionBox.createEl('p', {
            text: `"${currentQuestion.text}"`,
            cls: 'journey-discovery-question-text'
        });

        if (currentQuestion.hint) {
            questionBox.createDiv({
                cls: 'journey-discovery-hint',
                text: `💡 ${currentQuestion.hint}`
            });
        }

        // Likert scale buttons
        const likertContainer = questionBox.createDiv({ cls: 'journey-discovery-likert' });
        const labels = [
            { value: 1, emoji: '😟', label: 'Strongly Disagree' },
            { value: 2, emoji: '😕', label: 'Disagree' },
            { value: 3, emoji: '😐', label: 'Neutral' },
            { value: 4, emoji: '🙂', label: 'Agree' },
            { value: 5, emoji: '😊', label: 'Strongly Agree' }
        ];

        labels.forEach(opt => {
            const btn = likertContainer.createEl('button', {
                cls: 'journey-likert-btn',
                text: opt.emoji
            });
            btn.createDiv({ cls: 'journey-likert-value', text: opt.value.toString() });

            btn.onclick = async () => {
                // Disable all buttons
                likertContainer.querySelectorAll('button').forEach(b => b.disabled = true);
                btn.classList.add('selected');

                // Answer the question (pass currentQuestion for AI questions)
                const result = await discoveryService.answerQuestion(
                    currentQuestion.id,
                    opt.value,
                    QUESTION_BANK,
                    currentQuestion
                );

                if (result.success && result.domainDiscovered) {
                    // Show domain discovery celebration
                    const domainInfo = DEFAULT_DOMAINS.find(d => d.id === result.domainId);
                    if (domainInfo) {
                        new Notice(`🎉 New domain discovered: ${domainInfo.icon} ${domainInfo.name}!`);
                    }
                }

                // Refresh the view
                this.render();
            };
        });

        // Skip button (only for core questions)
        if (!isAiQuestion) {
            const skipRow = questionBox.createDiv({ cls: 'journey-discovery-skip' });
            const skipBtn = skipRow.createEl('button', {
                text: 'Skip for now',
                cls: 'journey-mini-btn secondary'
            });
            skipBtn.onclick = async () => {
                await discoveryService.skipQuestion(currentQuestion.id);
                this.render();
            };
        }
    }

    // Get motivational quote/suggestion for skill improvement
    getSkillQuote(skill) {
        const quotes = {
            vocation: [
                "Every expert was once a beginner. Keep practicing!",
                "Your craft improves with each hour invested.",
                "Small daily improvements lead to mastery.",
                "The professional practices even when they don't feel like it.",
                "Excellence is not an act, but a habit."
            ],
            mind: [
                "A curious mind is always learning.",
                "Challenge your brain - it grows stronger with use.",
                "Knowledge compounds over time.",
                "The more you learn, the more connections you make.",
                "Every new skill opens new doors."
            ],
            body: [
                "Your body adapts to what you ask of it.",
                "Consistency beats intensity over time.",
                "Movement is medicine for the mind and body.",
                "Progress, not perfection.",
                "Small steps lead to big transformations."
            ],
            spirit: [
                "Connection is the currency of life.",
                "Teaching others deepens your own understanding.",
                "Community amplifies individual efforts.",
                "Sharing knowledge multiplies it.",
                "Together we go further."
            ]
        };

        const categoryQuotes = quotes[skill.category] || quotes.vocation;
        const index = (skill.level + skill.totalPracticeCount) % categoryQuotes.length;
        return categoryQuotes[index];
    }

    // Practice a skill - add XP to skill and hero
    async practiceSkill(skill, skillService) {
        const practiceXP = 15; // XP gained per practice
        const heroXP = 5; // XP for hero profile
        const goldReward = 2;

        // Add XP to skill
        const result = skillService.addSkillXp(skill.id, practiceXP);

        // Add XP to hero
        this.plugin.gainXp(heroXP, goldReward, skill.category === 'vocation' ? 'livingStandards' :
            skill.category === 'mind' ? 'education' :
            skill.category === 'body' ? 'health' : 'communityVitality');

        // Log the activity
        this.plugin.logActivity('skill_practice', `Practiced ${skill.name}`, {
            skill: skill.name,
            xp: practiceXP,
            heroXp: heroXP
        });

        // Show feedback
        if (result.levelsGained > 0) {
            new Notice(`🎉 ${skill.name} leveled up to Lv. ${result.skill.level}! +${practiceXP} Skill XP | +${heroXP} Hero XP`);
        } else {
            new Notice(`⚡ Practiced ${skill.name}! +${practiceXP} Skill XP | +${heroXP} Hero XP`);
        }

        await this.plugin.saveSettings();
        this.render();
    }

    // Show modal to merge/combine skills
    showMergeSkillModal(sourceSkill, targetSkills, skillService) {
        const modal = new Modal(this.app);
        modal.titleEl.setText(`🔗 Merge ${sourceSkill.name}`);

        const content = modal.contentEl;
        content.createEl('p', {
            text: `Select a skill to merge "${sourceSkill.name}" into. The source skill's XP will be transferred.`,
            cls: 'journey-modal-desc'
        });

        const skillList = content.createDiv({ cls: 'journey-merge-skill-list' });

        targetSkills.forEach(targetSkill => {
            const skillOption = skillList.createDiv({ cls: 'journey-merge-skill-option' });
            skillOption.innerHTML = `
                <span class="journey-merge-skill-name">${targetSkill.name}</span>
                <span class="journey-merge-skill-level">Lv. ${targetSkill.level}</span>
            `;
            skillOption.onclick = async () => {
                if (confirm(`Merge "${sourceSkill.name}" into "${targetSkill.name}"?\n\nThis will delete ${sourceSkill.name} and transfer its XP.`)) {
                    const result = skillService.mergeSkills(sourceSkill.id, targetSkill.id);
                    if (result.success) {
                        await this.plugin.saveSettings();
                        new Notice(`🔗 Merged into ${result.mergedSkill.name} (now Lv. ${result.mergedSkill.level})!`);
                        modal.close();
                        this.render();
                    }
                }
            };
        });

        const cancelBtn = content.createEl('button', {
            text: 'Cancel',
            cls: 'journey-modal-cancel-btn'
        });
        cancelBtn.onclick = () => modal.close();

        modal.open();
    }

    // Generate AI question and update the view
    async generateAndShowAiQuestion(container, discoveryService) {
        try {
            const s = this.plugin.settings;
            const aiQuestion = await discoveryService.generateAiQuestion(DOMAIN_ORDER, s.domains);

            if (aiQuestion) {
                // Store the generated question
                discoveryService.setPendingAiQuestion(aiQuestion);
                await this.plugin.saveSettings();
            }

            // Re-render to show the question
            this.render();
        } catch (e) {
            console.error('AI question generation failed:', e);
            new Notice('Could not generate question. Using fallback.');
            this.render();
        }
    }

    // ============================================================================
    // ADVENTURE TAB - Reorganized Sections
    // ============================================================================
    renderAdventure(container) {
        container.createEl('h3', { text: '⚔️ Your Adventure' });

        // 1. Rest & Recovery (Top - check in first)
        this.renderCollapsibleSection(container, 'rest', '🏨 Rest & Recovery', () => this.renderRestSection(container));

        // 2. Journal Section
        this.renderCollapsibleSection(container, 'journal', '📓 Journal', () => this.renderJournalSection(container));

        // 3. Boss Fights
        this.renderCollapsibleSection(container, 'arena', '🐉 Boss Fights', () => this.renderBossFightsSection(container));

        // 4. Quests (to help defeat bosses)
        this.renderCollapsibleSection(container, 'quests', '📜 Quests', () => this.renderQuestsSection(container));

        // 5. Daily Habits
        this.renderCollapsibleSection(container, 'habits', '✅ Daily Habits', () => this.renderHabitsSection(container));

        // 6. Bad Habits (to track and reduce)
        this.renderCollapsibleSection(container, 'badhabits', '⚠️ Bad Habits', () => this.renderBadHabitsSection(container));
    }

    renderCollapsibleSection(container, sectionId, title, renderContent) {
        const section = container.createEl('details', {
            cls: 'journey-collapsible-section',
            attr: { open: this.adventureSections[sectionId] ? 'open' : null }
        });

        const summary = section.createEl('summary', { text: title });
        summary.onclick = (e) => {
            // Toggle state after click
            setTimeout(() => {
                this.adventureSections[sectionId] = section.open;
            }, 0);
        };

        const content = section.createDiv({ cls: 'journey-section-content' });
        renderContent.call(this, content);
    }

    renderJournalSection(container) {
        const s = this.plugin.settings;
        const js = s.journalSettings || {};

        const statusCard = container.createDiv({ cls: 'journey-journal-status' });
        const lastSync = js.lastSyncDate ? new Date(js.lastSyncDate).toLocaleString() : 'Never';
        statusCard.innerHTML = `
            <div class="journey-journal-stat">
                <span class="label">Last Sync:</span>
                <span class="value">${lastSync}</span>
            </div>
        `;

        const syncBtn = container.createEl('button', {
            text: '🔄 Sync Journals',
            cls: 'journey-full-width-btn primary'
        });
        syncBtn.onclick = async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Syncing...';
            try {
                await this.plugin.syncJournals();
                this.render();
            } catch (e) {
                new Notice(`❌ Sync failed: ${e.message}`);
            }
        };

        // Recent Analysis
        if (js.recentAnalysis && js.recentAnalysis.length > 0) {
            container.createEl('h5', { text: '📊 Recent' });
            const analysisList = container.createDiv({ cls: 'journey-analysis-list' });
            js.recentAnalysis.slice(0, 3).forEach(a => {
                const item = analysisList.createDiv({ cls: 'journey-analysis-item' });
                item.innerHTML = `<span>${a.fileName}</span><span>+${a.xp || 0} XP</span>`;
            });
        }
    }

    // Boss Fights Section with Fight and Run Away Buttons
    renderBossFightsSection(container) {
        const s = this.plugin.settings;
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);

        if (activeBosses.length === 0) {
            container.createDiv({ cls: 'journey-empty-state' });
            container.querySelector('.journey-empty-state').innerHTML = `
                <p>No active boss fights</p>
                <p class="journey-empty-hint">Create a boss to represent a challenge you want to overcome!</p>
            `;
        } else {
            activeBosses.forEach(boss => {
                const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
                const bossCard = container.createDiv({ cls: 'journey-boss-card' });

                // Boss Header
                const bossHeader = bossCard.createDiv({ cls: 'journey-boss-header' });
                bossHeader.innerHTML = `
                    <span class="journey-boss-icon-large">${boss.icon || '🐉'}</span>
                    <div class="journey-boss-info">
                        <span class="journey-boss-name-large">${boss.name}</span>
                        <span class="journey-boss-desc">${boss.description || 'A formidable challenge'}</span>
                    </div>
                `;

                // Boss HP Bar
                const hpBar = bossCard.createDiv({ cls: 'journey-boss-hp-section' });
                hpBar.innerHTML = `
                    <div class="journey-boss-hp-bar">
                        <div class="journey-boss-hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                    <span class="journey-boss-hp-text">${boss.currentHp} / ${boss.maxHp} HP</span>
                `;

                // Action Buttons Row
                const actionRow = bossCard.createDiv({ cls: 'journey-boss-action-row' });

                // Fight Button
                const fightBtn = actionRow.createEl('button', {
                    text: '⚔️ Fight!',
                    cls: 'journey-boss-fight-btn'
                });
                fightBtn.onclick = async () => {
                    await this.fightBoss(boss);
                };

                // Run Away Button (increases boss HP)
                const runBtn = actionRow.createEl('button', {
                    text: '🏃 Run Away',
                    cls: 'journey-boss-run-btn'
                });
                runBtn.onclick = async () => {
                    const hpGain = 5 + Math.floor(Math.random() * 10); // 5-15 HP gain
                    boss.currentHp = Math.min(boss.maxHp, boss.currentHp + hpGain);
                    await this.plugin.saveSettings();
                    this.plugin.logActivity('boss_runaway', `Ran away from ${boss.name}`, { bossHpGained: hpGain });
                    new Notice(`🏃 You ran away! ${boss.name} recovers +${hpGain} HP (${boss.currentHp}/${boss.maxHp})`);
                    this.render();
                };

                // Count related quests
                const bossQuests = (s.quests || []).filter(q => !q.completed && q.bossId === boss.id);
                if (bossQuests.length > 0) {
                    const questHint = bossCard.createDiv({ cls: 'journey-boss-quest-hint' });
                    questHint.innerHTML = `<span>📜 ${bossQuests.length} quest${bossQuests.length > 1 ? 's' : ''} to help defeat this boss</span>`;
                }
            });
        }

        // Create New Boss Button
        const createBossBtn = container.createEl('button', {
            text: '+ Create New Boss',
            cls: 'journey-full-width-btn'
        });
        createBossBtn.onclick = () => new NewBossFightModal(this.app, this.plugin, () => this.render()).open();
    }

    // Quests Section - Separate from Boss Fights
    renderQuestsSection(container) {
        const s = this.plugin.settings;
        const quests = s.quests || [];
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);
        const activeQuests = quests.filter(q => !q.completed);

        container.createEl('p', {
            text: 'Complete quests to damage bosses and earn rewards!',
            cls: 'journey-section-desc'
        });

        if (activeQuests.length === 0) {
            container.createDiv({ cls: 'journey-empty', text: 'No active quests. Add quests to help defeat bosses!' });
        } else {
            // Group quests by boss
            const questsByBoss = {};
            const questsNoBoss = [];

            activeQuests.forEach(quest => {
                if (quest.bossId) {
                    if (!questsByBoss[quest.bossId]) questsByBoss[quest.bossId] = [];
                    questsByBoss[quest.bossId].push(quest);
                } else {
                    questsNoBoss.push(quest);
                }
            });

            // Render quests grouped by boss
            activeBosses.forEach(boss => {
                const bossQuests = questsByBoss[boss.id] || [];
                if (bossQuests.length === 0) return;

                const bossGroup = container.createDiv({ cls: 'journey-quest-group' });
                bossGroup.createDiv({
                    cls: 'journey-quest-group-header',
                    text: `${boss.icon || '🐉'} For: ${boss.name}`
                });

                const questList = bossGroup.createDiv({ cls: 'journey-quest-list' });
                bossQuests.forEach(quest => {
                    this.renderQuestRow(questList, quest, boss);
                });
            });

            // Render quests without boss
            if (questsNoBoss.length > 0) {
                const generalGroup = container.createDiv({ cls: 'journey-quest-group' });
                generalGroup.createDiv({
                    cls: 'journey-quest-group-header',
                    text: '🎯 General Quests'
                });

                const questList = generalGroup.createDiv({ cls: 'journey-quest-list' });
                questsNoBoss.forEach(quest => {
                    this.renderQuestRow(questList, quest, null);
                });
            }
        }

        // Add Quest Buttons
        const addBtnRow = container.createDiv({ cls: 'journey-quest-add-row' });

        // If there are bosses, show option to add quest for specific boss
        if (activeBosses.length > 0) {
            const addForBossBtn = addBtnRow.createEl('button', {
                text: '+ Quest for Boss',
                cls: 'journey-mini-btn'
            });
            addForBossBtn.onclick = () => {
                this.showSelectBossForQuestModal(activeBosses);
            };
        }

        const addGeneralBtn = addBtnRow.createEl('button', {
            text: '+ General Quest',
            cls: 'journey-mini-btn'
        });
        addGeneralBtn.onclick = () => {
            new NewQuestModal(this.app, this.plugin, () => this.render()).open();
        };

        // Generate Quest Button (AI or random)
        const generateBtn = container.createEl('button', {
            text: '✨ Generate Quest Ideas',
            cls: 'journey-full-width-btn secondary'
        });
        generateBtn.onclick = () => {
            this.generateQuestIdeas(activeBosses);
        };
    }

    // Render single quest row
    renderQuestRow(container, quest, boss) {
        const s = this.plugin.settings;
        const questRow = container.createDiv({ cls: 'journey-quest-row' });

        // Quest rewards (default based on difficulty or explicit)
        const xpReward = quest.xpReward || (quest.difficulty === 'hard' ? 30 : quest.difficulty === 'easy' ? 10 : 20);
        const goldReward = quest.goldReward || (quest.difficulty === 'hard' ? 15 : quest.difficulty === 'easy' ? 5 : 10);

        const completeBtn = questRow.createEl('button', { cls: 'journey-complete-btn', text: '✓' });
        completeBtn.onclick = async () => {
            const realIndex = s.quests.indexOf(quest);

            // Give hero rewards
            this.plugin.gainXp(xpReward, goldReward);
            this.plugin.logActivity('quest_complete', `Completed: ${quest.name}`, {
                xp: xpReward,
                gold: goldReward,
                bossDamage: quest.bossDamage || 0
            });

            // Mark quest as completed
            quest.completed = true;
            quest.completedAt = new Date().toISOString();

            // Damage the boss when quest completed
            if (boss) {
                const damage = quest.bossDamage || 20;
                boss.currentHp = Math.max(0, boss.currentHp - damage);
                if (boss.currentHp <= 0) {
                    boss.defeated = true;
                    // Bonus for defeating boss
                    const bossXp = 50;
                    const bossGold = 25;
                    this.plugin.gainXp(bossXp, bossGold);
                    this.plugin.logActivity('boss_defeated', `Defeated ${boss.name}!`, { xp: bossXp, gold: bossGold });
                    new Notice(`🎉 ${boss.name} DEFEATED!\n+${xpReward + bossXp} XP, +${goldReward + bossGold} Gold`);
                } else {
                    new Notice(`⚔️ Quest done! +${xpReward} XP, +${goldReward} Gold\n${boss.name} takes ${damage} damage (${boss.currentHp}/${boss.maxHp} HP)`);
                }
            } else {
                new Notice(`✅ Quest done! +${xpReward} XP, +${goldReward} Gold`);
            }

            await this.plugin.saveSettings();
            this.render();
        };

        const questInfo = questRow.createDiv({ cls: 'journey-quest-info' });
        questInfo.innerHTML = `
            <span class="journey-quest-name">${quest.name}</span>
            <span class="journey-quest-rewards">
                <span class="journey-quest-xp">+${xpReward} XP</span>
                <span class="journey-quest-gold">+${goldReward} 💰</span>
                ${quest.bossDamage ? `<span class="journey-quest-damage">⚔️ ${quest.bossDamage} dmg</span>` : ''}
            </span>
        `;

        const deleteBtn = questRow.createEl('button', { cls: 'journey-quest-delete', text: '×' });
        deleteBtn.onclick = async () => {
            if (confirm(`Delete quest: ${quest.name}?`)) {
                const realIndex = s.quests.indexOf(quest);
                s.quests.splice(realIndex, 1);
                await this.plugin.saveSettings();
                this.render();
            }
        };
    }

    // Show modal to select boss for new quest
    showSelectBossForQuestModal(bosses) {
        const modal = new Modal(this.app);
        modal.titleEl.setText('📜 Add Quest for Boss');

        const content = modal.contentEl;
        content.createEl('p', { text: 'Select a boss to create a quest for:', cls: 'journey-modal-desc' });

        const bossList = content.createDiv({ cls: 'journey-boss-select-list' });
        bosses.forEach(boss => {
            const bossOption = bossList.createDiv({ cls: 'journey-boss-select-option' });
            bossOption.innerHTML = `
                <span class="journey-boss-select-icon">${boss.icon || '🐉'}</span>
                <span class="journey-boss-select-name">${boss.name}</span>
                <span class="journey-boss-select-hp">${boss.currentHp}/${boss.maxHp} HP</span>
            `;
            bossOption.onclick = () => {
                modal.close();
                new NewQuestModal(this.app, this.plugin, () => this.render(), boss.id).open();
            };
        });

        modal.open();
    }

    // Generate quest ideas - AI-enhanced or template-based
    async generateQuestIdeas(bosses) {
        const s = this.plugin.settings;
        const hasApiKey = !!s.ai?.openRouterApiKey;

        // Show modal first
        const modal = new Modal(this.app);
        modal.titleEl.setText('✨ Quest Ideas');
        const content = modal.contentEl;

        if (bosses.length === 0) {
            content.createEl('p', { text: 'Create a boss first to generate related quests!' });
            const closeBtn = content.createEl('button', { text: 'Close', cls: 'journey-modal-cancel-btn' });
            closeBtn.onclick = () => modal.close();
            modal.open();
            return;
        }

        // If AI is available, use AI generation
        if (hasApiKey) {
            content.createDiv({ cls: 'journey-quest-loading', text: '🤖 AI is generating personalized quests...' });
            modal.open();

            try {
                const questIdeas = await this.generateAIQuests(bosses);
                content.empty();
                this.renderQuestIdeasModal(content, modal, questIdeas);
            } catch (e) {
                console.error('AI quest generation failed:', e);
                content.empty();
                content.createEl('p', { text: '⚠️ AI generation failed. Using templates instead.', cls: 'journey-warning' });
                const templateQuests = this.getTemplateQuests(bosses);
                this.renderQuestIdeasModal(content, modal, templateQuests);
            }
        } else {
            // Use template-based generation
            const templateQuests = this.getTemplateQuests(bosses);
            this.renderQuestIdeasModal(content, modal, templateQuests);
            modal.open();
        }
    }

    // Generate quests using AI
    async generateAIQuests(bosses) {
        const s = this.plugin.settings;
        const aiService = new AIService(this.plugin);

        // Build context about bosses and user
        const bossContext = bosses.map(b =>
            `- ${b.icon || '🐉'} "${b.name}": ${b.description || 'A challenge to overcome'} (${b.currentHp}/${b.maxHp} HP remaining)`
        ).join('\n');

        const userContext = s.characterProfile?.name
            ? `The hero "${s.characterProfile.name}" (Level ${s.level})`
            : `A Level ${s.level} hero`;

        const prompt = `You are a quest designer for a personal development game. ${userContext} is facing these bosses (challenges):

${bossContext}

Generate 2-3 specific, actionable quests for EACH boss. Each quest should be:
1. A clear, concrete action (not vague like "work on it")
2. Completable in one session (30 min to 2 hours)
3. Directly related to defeating that specific boss/challenge
4. Varied in approach (research, action, reflection, planning)

Format your response as JSON array:
[
  {"bossId": "boss_id_here", "bossName": "Boss Name", "name": "Quest description", "bossDamage": 15, "xpReward": 20, "goldReward": 10, "difficulty": "easy|medium|hard"},
  ...
]

Rewards by difficulty:
- easy: bossDamage=10, xpReward=10, goldReward=5
- medium: bossDamage=20, xpReward=20, goldReward=10
- hard: bossDamage=30, xpReward=30, goldReward=15

Only output the JSON array, no other text.`;

        const response = await aiService.chat(prompt, false, false);

        // Parse JSON from response
        try {
            // Extract JSON from response (might have markdown code blocks)
            let jsonStr = response;
            if (response.includes('```')) {
                const match = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match) jsonStr = match[1];
            }

            const quests = JSON.parse(jsonStr.trim());

            // Map bossId to actual boss and ensure rewards
            return quests.map(q => {
                const boss = bosses.find(b => b.name === q.bossName || b.id === q.bossId);
                const difficulty = q.difficulty || 'medium';
                return {
                    name: q.name,
                    bossId: boss?.id || bosses[0]?.id,
                    bossName: q.bossName || boss?.name || 'Unknown',
                    bossDamage: q.bossDamage || (difficulty === 'hard' ? 30 : difficulty === 'easy' ? 10 : 20),
                    xpReward: q.xpReward || (difficulty === 'hard' ? 30 : difficulty === 'easy' ? 10 : 20),
                    goldReward: q.goldReward || (difficulty === 'hard' ? 15 : difficulty === 'easy' ? 5 : 10),
                    difficulty: difficulty,
                    isAI: true
                };
            });
        } catch (parseError) {
            console.error('Failed to parse AI quest response:', parseError);
            throw new Error('Could not parse AI response');
        }
    }

    // Get template-based quests (fallback)
    getTemplateQuests(bosses) {
        const questIdeas = [];

        bosses.forEach(boss => {
            const bossRelatedQuests = [
                { name: `Research ${boss.name}'s weakness`, bossDamage: 15, xpReward: 10, goldReward: 5, difficulty: 'easy' },
                { name: `Create a detailed plan to defeat ${boss.name}`, bossDamage: 20, xpReward: 20, goldReward: 10, difficulty: 'medium' },
                { name: `Take one small action toward defeating ${boss.name}`, bossDamage: 10, xpReward: 10, goldReward: 5, difficulty: 'easy' },
                { name: `Spend 30 min focused session on ${boss.name}`, bossDamage: 25, xpReward: 25, goldReward: 12, difficulty: 'medium' },
                { name: `Break ${boss.name} into 3 smaller tasks`, bossDamage: 15, xpReward: 15, goldReward: 8, difficulty: 'easy' },
                { name: `Ask someone for advice about ${boss.name}`, bossDamage: 20, xpReward: 20, goldReward: 10, difficulty: 'medium' },
                { name: `Complete the hardest part of ${boss.name}`, bossDamage: 30, xpReward: 35, goldReward: 18, difficulty: 'hard' },
                { name: `Set a deadline for defeating ${boss.name}`, bossDamage: 10, xpReward: 10, goldReward: 5, difficulty: 'easy' },
                { name: `Work on ${boss.name} for 1 hour without distractions`, bossDamage: 30, xpReward: 30, goldReward: 15, difficulty: 'hard' },
                { name: `Identify 3 obstacles blocking ${boss.name}`, bossDamage: 15, xpReward: 15, goldReward: 8, difficulty: 'easy' }
            ];

            // Pick 3 random quests for each boss
            const shuffled = bossRelatedQuests.sort(() => 0.5 - Math.random());
            shuffled.slice(0, 3).forEach(q => {
                questIdeas.push({ ...q, bossId: boss.id, bossName: boss.name, isAI: false });
            });
        });

        return questIdeas;
    }

    // Render quest ideas in modal
    renderQuestIdeasModal(content, modal, questIdeas) {
        const s = this.plugin.settings;

        if (questIdeas.length === 0) {
            content.createEl('p', { text: 'No quest ideas generated. Try again!' });
        } else {
            const isAI = questIdeas.some(q => q.isAI);
            content.createEl('p', {
                text: isAI ? '🤖 AI-generated quests based on your challenges:' : 'Click to add quest:',
                cls: 'journey-modal-desc'
            });

            const ideaList = content.createDiv({ cls: 'journey-quest-idea-list' });

            // Group by boss
            const groupedByBoss = {};
            questIdeas.forEach(idea => {
                if (!groupedByBoss[idea.bossName]) groupedByBoss[idea.bossName] = [];
                groupedByBoss[idea.bossName].push(idea);
            });

            Object.entries(groupedByBoss).forEach(([bossName, ideas]) => {
                const bossGroup = ideaList.createDiv({ cls: 'journey-quest-idea-group' });
                bossGroup.createDiv({ cls: 'journey-quest-idea-boss', text: `🐉 ${bossName}` });

                ideas.forEach(idea => {
                    const ideaRow = bossGroup.createDiv({ cls: 'journey-quest-idea-row' });
                    const difficultyColor = idea.difficulty === 'easy' ? '#27ae60' :
                                           idea.difficulty === 'hard' ? '#e74c3c' : '#f39c12';
                    ideaRow.innerHTML = `
                        <span class="journey-quest-idea-name">${idea.name}</span>
                        <span class="journey-quest-idea-meta">
                            <span style="color: ${difficultyColor}">${idea.difficulty || 'medium'}</span> •
                            <span class="journey-quest-idea-rewards">+${idea.xpReward} XP, +${idea.goldReward} 💰</span> •
                            ⚔️ ${idea.bossDamage} dmg
                        </span>
                    `;
                    ideaRow.onclick = async () => {
                        s.quests = s.quests || [];
                        s.quests.push({
                            id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            name: idea.name,
                            bossId: idea.bossId,
                            bossDamage: idea.bossDamage,
                            xpReward: idea.xpReward,
                            goldReward: idea.goldReward,
                            difficulty: idea.difficulty,
                            completed: false,
                            isAIGenerated: idea.isAI,
                            createdAt: new Date().toISOString()
                        });
                        await this.plugin.saveSettings();
                        new Notice(`📜 Added quest: ${idea.name}`);
                        ideaRow.classList.add('added');
                        ideaRow.innerHTML += '<span class="journey-quest-added-badge">✓ Added</span>';
                        ideaRow.onclick = null;
                    };
                });
            });

            // Add all button
            const addAllBtn = content.createEl('button', {
                text: `➕ Add All ${questIdeas.length} Quests`,
                cls: 'journey-full-width-btn primary'
            });
            addAllBtn.onclick = async () => {
                s.quests = s.quests || [];
                questIdeas.forEach(idea => {
                    s.quests.push({
                        id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: idea.name,
                        bossId: idea.bossId,
                        bossDamage: idea.bossDamage,
                        xpReward: idea.xpReward,
                        goldReward: idea.goldReward,
                        difficulty: idea.difficulty,
                        completed: false,
                        isAIGenerated: idea.isAI,
                        createdAt: new Date().toISOString()
                    });
                });
                await this.plugin.saveSettings();
                new Notice(`📜 Added ${questIdeas.length} quests!`);
                modal.close();
                this.render();
            };
        }

        const closeBtn = content.createEl('button', { text: 'Close', cls: 'journey-modal-cancel-btn' });
        closeBtn.onclick = () => { modal.close(); this.render(); };
    }

    // Fight boss directly (small damage)
    async fightBoss(boss) {
        const damage = 10 + Math.floor(Math.random() * 10); // 10-20 damage
        boss.currentHp = Math.max(0, boss.currentHp - damage);

        if (boss.currentHp <= 0) {
            boss.defeated = true;
            new Notice(`🎉 ${boss.name} DEFEATED! +50 XP, +25 Gold`);
            this.plugin.gainXp(50, 25);
            this.plugin.logActivity('boss_defeated', `Defeated ${boss.name}!`, { xp: 50, gold: 25 });
        } else {
            new Notice(`⚔️ Hit ${boss.name} for ${damage} damage! (${boss.currentHp}/${boss.maxHp} HP left)`);
            this.plugin.gainXp(5, 2);
        }

        await this.plugin.saveSettings();
        this.render();
    }

    // Daily Habits Section (Good habits - increase HP/XP)
    renderHabitsSection(container) {
        const s = this.plugin.settings;

        if (s.habits.length === 0) {
            container.createDiv({ cls: 'journey-empty', text: 'No habits yet. Add habits to build streaks!' });
        } else {
            const habitsList = container.createDiv({ cls: 'journey-habits-list' });

            s.habits.forEach((habit, index) => {
                const habitCard = habitsList.createDiv({
                    cls: `journey-habit-card ${habit.completed ? 'completed' : ''}`
                });

                const checkbox = habitCard.createEl('input', { type: 'checkbox' });
                checkbox.checked = habit.completed;
                checkbox.disabled = habit.completed;
                checkbox.onclick = async () => {
                    if (!habit.completed) {
                        await this.plugin.completeHabit(index);
                        this.render();
                    }
                };

                const habitInfo = habitCard.createDiv({ cls: 'journey-habit-info' });
                habitInfo.innerHTML = `
                    <span class="journey-habit-name">${habit.name}</span>
                    <span class="journey-habit-reward">+${habit.xp || 10} XP, +${habit.hp || 5} HP</span>
                `;

                if (habit.streak > 0) {
                    habitCard.createSpan({ cls: 'journey-habit-streak', text: `🔥 ${habit.streak}` });
                }

                // Delete button
                const deleteBtn = habitCard.createEl('button', { cls: 'journey-habit-delete', text: '×' });
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete habit: ${habit.name}?`)) {
                        await this.plugin.removeHabit(index);
                        this.render();
                    }
                };
            });
        }

        const addHabitBtn = container.createEl('button', {
            text: '+ Add Good Habit',
            cls: 'journey-full-width-btn primary'
        });
        addHabitBtn.onclick = () => new NewHabitModal(this.app, this.plugin, () => this.render()).open();
    }

    // Bad Habits Section (Track and reduce - decreases HP/XP when done)
    renderBadHabitsSection(container) {
        const s = this.plugin.settings;
        s.badHabits = s.badHabits || [];

        container.createEl('p', {
            text: 'Track bad habits you want to reduce. Be honest - logging helps awareness.',
            cls: 'journey-section-desc'
        });

        if (s.badHabits.length === 0) {
            container.createDiv({ cls: 'journey-empty', text: 'No bad habits tracked. Add ones you want to reduce!' });
        } else {
            const badHabitsList = container.createDiv({ cls: 'journey-bad-habits-list' });

            s.badHabits.forEach((habit, index) => {
                const habitCard = badHabitsList.createDiv({
                    cls: `journey-bad-habit-card ${habit.doneToday ? 'done-today' : ''}`
                });

                // Top row: info and delete button
                const topRow = habitCard.createDiv({ cls: 'journey-bad-habit-top-row' });

                const habitInfo = topRow.createDiv({ cls: 'journey-bad-habit-info' });
                habitInfo.innerHTML = `
                    <span class="journey-bad-habit-icon">⚠️</span>
                    <div class="journey-bad-habit-details">
                        <span class="journey-bad-habit-name">${habit.name}</span>
                        <span class="journey-bad-habit-penalty">-${habit.hpLoss || 10} HP, -${habit.xpLoss || 5} XP</span>
                    </div>
                `;

                // Stats and delete in top row
                const topActions = topRow.createDiv({ cls: 'journey-bad-habit-top-actions' });
                if (habit.count > 0) {
                    topActions.createSpan({ cls: 'journey-bad-habit-count', text: `${habit.count}×` });
                }

                const deleteBtn = topActions.createEl('button', { cls: 'journey-habit-delete', text: '×' });
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete bad habit: ${habit.name}?`)) {
                        s.badHabits.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.render();
                    }
                };

                // Bottom row: Big "I did it" button or logged status
                const bottomRow = habitCard.createDiv({ cls: 'journey-bad-habit-bottom-row' });

                if (!habit.doneToday) {
                    const didItBtn = bottomRow.createEl('button', {
                        text: '😔 I did it today...',
                        cls: 'journey-bad-habit-btn'
                    });
                    didItBtn.onclick = async () => {
                        habit.doneToday = true;
                        habit.count = (habit.count || 0) + 1;
                        s.hp = Math.max(1, s.hp - (habit.hpLoss || 10));
                        s.xp = Math.max(0, s.xp - (habit.xpLoss || 5));
                        await this.plugin.saveSettings();
                        this.plugin.logActivity('bad_habit', `Did bad habit: ${habit.name}`, {
                            hpLost: habit.hpLoss || 10,
                            xpLost: habit.xpLoss || 5
                        });
                        new Notice(`😔 ${habit.name} - Lost ${habit.hpLoss || 10} HP, ${habit.xpLoss || 5} XP`);
                        this.render();
                    };
                } else {
                    bottomRow.createDiv({
                        cls: 'journey-bad-habit-done',
                        text: '✓ Logged today - Stay strong tomorrow!'
                    });
                }
            });
        }

        const addBadHabitBtn = container.createEl('button', {
            text: '+ Add Bad Habit to Track',
            cls: 'journey-full-width-btn warning'
        });
        addBadHabitBtn.onclick = () => {
            this.showAddBadHabitModal();
        };
    }

    // Modal to add bad habit
    showAddBadHabitModal() {
        const modal = new Modal(this.app);
        modal.titleEl.setText('⚠️ Add Bad Habit to Track');

        const content = modal.contentEl;

        const nameInput = content.createEl('input', {
            type: 'text',
            placeholder: 'Bad habit name (e.g., "Junk food", "Social media")',
            cls: 'journey-modal-input'
        });

        const hpLabel = content.createEl('label', { text: 'HP Loss:' });
        const hpInput = content.createEl('input', {
            type: 'number',
            value: '10',
            cls: 'journey-modal-input-small'
        });

        const xpLabel = content.createEl('label', { text: 'XP Loss:' });
        const xpInput = content.createEl('input', {
            type: 'number',
            value: '5',
            cls: 'journey-modal-input-small'
        });

        const saveBtn = content.createEl('button', {
            text: 'Add Bad Habit',
            cls: 'journey-modal-btn primary'
        });
        saveBtn.onclick = async () => {
            const name = nameInput.value.trim();
            if (!name) {
                new Notice('Please enter a habit name');
                return;
            }

            const s = this.plugin.settings;
            s.badHabits = s.badHabits || [];
            s.badHabits.push({
                id: `bad_${Date.now()}`,
                name: name,
                hpLoss: parseInt(hpInput.value) || 10,
                xpLoss: parseInt(xpInput.value) || 5,
                count: 0,
                doneToday: false,
                createdAt: new Date().toISOString()
            });

            await this.plugin.saveSettings();
            modal.close();
            this.render();
            new Notice(`⚠️ Added bad habit: ${name}`);
        };

        modal.open();
    }

    renderRestSection(container) {
        const s = this.plugin.settings;

        // Quick Stats
        const statsRow = container.createDiv({ cls: 'journey-rest-stats' });
        statsRow.innerHTML = `
            <span>❤️ ${s.hp}/${s.maxHp}</span>
            <span>⚡ ${s.energy || 100}/${s.maxEnergy || 100}</span>
        `;

        // Mood Check-in Question
        container.createEl('h5', { text: '😊 How are you feeling right now?' });
        const moodQuestion = container.createDiv({ cls: 'journey-mood-question' });
        const moodOptions = [
            { icon: '😊', label: 'Great', energy: 10, hp: 5 },
            { icon: '🙂', label: 'Good', energy: 5, hp: 2 },
            { icon: '😐', label: 'Okay', energy: 0, hp: 0 },
            { icon: '😔', label: 'Low', energy: -5, hp: -2 },
            { icon: '😫', label: 'Exhausted', energy: -10, hp: -5 }
        ];

        const moodGrid = moodQuestion.createDiv({ cls: 'journey-mood-grid-expanded' });
        moodOptions.forEach(mood => {
            const moodBtn = moodGrid.createEl('button', { cls: 'journey-mood-btn-large' });
            moodBtn.innerHTML = `<span class="mood-icon">${mood.icon}</span><span class="mood-label">${mood.label}</span>`;
            moodBtn.onclick = async () => {
                s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + mood.energy));
                s.hp = Math.max(1, Math.min(s.maxHp, s.hp + mood.hp));
                s.lastMoodCheck = new Date().toISOString();
                s.moodLog = s.moodLog || [];
                s.moodLog.push({ mood: mood.label, timestamp: new Date().toISOString() });
                if (s.moodLog.length > 30) s.moodLog = s.moodLog.slice(-30);
                await this.plugin.saveSettings();
                new Notice(`${mood.icon} Feeling ${mood.label}! Energy ${mood.energy >= 0 ? '+' : ''}${mood.energy}`);
                this.render();
            };
        });

        // Sleep Log
        container.createEl('h5', { text: '😴 How did you sleep last night?' });
        const sleepQuestion = container.createDiv({ cls: 'journey-sleep-question' });
        const sleepOptions = [
            { icon: '😴', label: '8+ hours', hours: 8, energy: 20, hp: 10 },
            { icon: '🛏️', label: '6-7 hours', hours: 7, energy: 10, hp: 5 },
            { icon: '😪', label: '4-5 hours', hours: 5, energy: -5, hp: 0 },
            { icon: '🥱', label: 'Less than 4', hours: 3, energy: -15, hp: -5 }
        ];

        const sleepGrid = sleepQuestion.createDiv({ cls: 'journey-sleep-grid' });
        sleepOptions.forEach(sleep => {
            const sleepBtn = sleepGrid.createEl('button', { cls: 'journey-sleep-btn' });
            sleepBtn.innerHTML = `<span class="sleep-icon">${sleep.icon}</span><span class="sleep-label">${sleep.label}</span>`;
            sleepBtn.onclick = async () => {
                s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + sleep.energy));
                s.hp = Math.max(1, Math.min(s.maxHp, s.hp + sleep.hp));
                s.sleepLog = s.sleepLog || [];
                s.sleepLog.push({ hours: sleep.hours, label: sleep.label, timestamp: new Date().toISOString() });
                if (s.sleepLog.length > 30) s.sleepLog = s.sleepLog.slice(-30);
                await this.plugin.saveSettings();
                new Notice(`${sleep.icon} Logged ${sleep.label} sleep! Energy ${sleep.energy >= 0 ? '+' : ''}${sleep.energy}`);
                this.render();
            };
        });

        // Recovery Actions
        container.createEl('h5', { text: '🧘 Recovery Actions' });
        const recoveryGrid = container.createDiv({ cls: 'journey-recovery-grid' });
        const recoveryOptions = [
            { icon: '🧘', label: 'Meditation', energy: 15, desc: '10 min mindfulness' },
            { icon: '🚶', label: 'Walk', energy: 10, desc: 'Short walk outside' },
            { icon: '☕', label: 'Break', energy: 5, desc: 'Take a rest' },
            { icon: '💧', label: 'Hydrate', energy: 3, desc: 'Drink water' }
        ];

        recoveryOptions.forEach(action => {
            const actionBtn = recoveryGrid.createEl('button', { cls: 'journey-recovery-btn' });
            actionBtn.innerHTML = `<span class="recovery-icon">${action.icon}</span><span class="recovery-label">${action.label}</span><span class="recovery-desc">${action.desc}</span>`;
            actionBtn.onclick = async () => {
                s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + action.energy));
                await this.plugin.saveSettings();
                this.plugin.logActivity('recovery', `${action.label}`, { energy: action.energy });
                new Notice(`${action.icon} ${action.label}! +${action.energy} Energy`);
                this.render();
            };
        });
    }

    async startDungeon(minutes, tier) {
        const s = this.plugin.settings;
        s.activeDungeon = {
            active: true,
            startTime: Date.now(),
            targetMinutes: minutes,
            tier: tier,
            tasks: [],
            monstersSlain: 0
        };
        await this.plugin.saveSettings();
        this.render();
        new Notice(`🏰 Entering ${tier} dungeon! ${minutes} minutes of focused work begins.`);
    }

    async completeDungeon() {
        const s = this.plugin.settings;
        const dungeon = s.activeDungeon;
        if (!dungeon) return;

        const elapsed = Math.floor((Date.now() - dungeon.startTime) / 1000 / 60);
        const reward = DUNGEON_REWARDS[dungeon.tier];
        const difficulty = GAME_DIFFICULTY[s.gameDifficulty || 'normal'];

        const baseXP = Math.floor(elapsed * reward.xpPerMinute);
        const goldBonus = elapsed >= dungeon.targetMinutes ? reward.goldBonus : Math.floor(reward.goldBonus / 2);

        const finalXP = Math.round(baseXP * difficulty.xpMultiplier);
        const finalGold = Math.round(goldBonus * difficulty.goldMultiplier);

        s.xp += finalXP;
        s.gold += finalGold;
        s.totalFocusMinutes = (s.totalFocusMinutes || 0) + elapsed;
        s.totalDungeonsCleared = (s.totalDungeonsCleared || 0) + 1;

        this.plugin.logActivity('dungeon_complete', `Cleared ${dungeon.tier} dungeon`, {
            xp: finalXP,
            gold: finalGold,
            minutes: elapsed
        });

        s.activeDungeon = null;
        await this.plugin.saveSettings();

        new Notice(`🏰 Dungeon Cleared! +${finalXP} XP | +${finalGold}g`);
        this.render();
    }

    // ============================================================================
    // ELDER TAB - Guide Mode + Storyteller Mode Toggle
    // ============================================================================
    renderElder(container) {
        const s = this.plugin.settings;
        const ai = s.ai || {};
        const hasApiKey = !!ai.openRouterApiKey;

        // Get current mode config
        const modeConfig = ELDER_MODES[this.elderMode] || ELDER_MODES.guide;
        const persona = ai.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;

        // Mode Toggle at top
        const modeToggle = container.createDiv({ cls: 'journey-elder-mode-toggle' });
        modeToggle.innerHTML = `
            <button class="journey-mode-btn ${this.elderMode === 'guide' ? 'active' : ''}" data-mode="guide">
                🔮 Guide
            </button>
            <button class="journey-mode-btn ${this.elderMode === 'storyteller' ? 'active' : ''}" data-mode="storyteller">
                📖 Storyteller
            </button>
        `;

        modeToggle.querySelectorAll('.journey-mode-btn').forEach(btn => {
            btn.onclick = () => {
                this.elderMode = btn.dataset.mode;
                this.render();
            };
        });

        // Elder Header
        const elderHeader = container.createDiv({ cls: 'journey-elder-header' });
        elderHeader.innerHTML = `
            <div class="journey-elder-avatar">🧙</div>
            <div class="journey-elder-info">
                <h3 class="journey-elder-name">${this.elderMode === 'storyteller' ? 'The Elder' : persona.name}</h3>
                <span class="journey-elder-title">${modeConfig.title}</span>
            </div>
            <button class="journey-elder-settings-btn" title="Customize Elder">⚙️</button>
        `;

        elderHeader.querySelector('.journey-elder-settings-btn').onclick = () => {
            new ElderSettingsModal(this.app, this.plugin, () => this.render()).open();
        };

        // Connection Status
        const statusBadge = container.createDiv({ cls: `journey-elder-status ${hasApiKey ? 'connected' : 'offline'}` });
        statusBadge.innerHTML = hasApiKey
            ? '✨ <span>Connected to the Ethereal Realm</span>'
            : '📜 <span>Wisdom from Ancient Scrolls</span>';

        if (!hasApiKey) {
            this.renderElderOfflineMode(container, persona, modeConfig);
            return;
        }

        // Elder's Greeting
        const greetingBox = container.createDiv({ cls: 'journey-elder-greeting' });
        greetingBox.innerHTML = `
            <div class="journey-elder-speech-bubble">
                <p>"${modeConfig.greeting}"</p>
            </div>
        `;

        // Quick Actions based on mode
        const wisdomSection = container.createDiv({ cls: 'journey-elder-wisdom-section' });
        wisdomSection.createEl('h4', { text: this.elderMode === 'storyteller' ? '📖 Storyteller Actions' : '🌟 Seek Wisdom' });

        const wisdomGrid = wisdomSection.createDiv({ cls: 'journey-elder-wisdom-grid' });

        modeConfig.actions.forEach(action => {
            const btn = wisdomGrid.createDiv({ cls: 'journey-elder-wisdom-btn' });
            btn.innerHTML = `
                <span class="icon">${action.icon}</span>
                <span class="label">${action.label}</span>
                <span class="desc">${action.desc}</span>
            `;
            btn.onclick = async () => {
                const prompt = this.elderMode === 'storyteller'
                    ? this.getStorytellerPrompt(action.id)
                    : (ai.elderPrompts?.[action.id] || DEFAULT_AI_SETTINGS.elderPrompts[action.id]);
                await this.sendElderMessage(prompt, true, action.display);
            };
        });

        // Chat Container
        this.renderElderChat(container);
    }

    getStorytellerPrompt(actionId) {
        const s = this.plugin.settings;
        const prompts = {
            narrate_today: `As the Storyteller, narrate my day today as an epic tale. Look at my recent activity, habits completed, and any journal entries. Turn it into an engaging narrative chapter with dramatic flair, while staying true to what actually happened.`,
            tell_legend: `As the Storyteller, weave the complete legend of my journey so far. Look at my character profile, level (${s.level}), skills, achievements, and progress. Tell the epic tale of the hero I am becoming - my strengths, my growth, my victories over challenges.`,
            find_patterns: `As the Storyteller who sees all threads of fate, examine my journey - my habits, journal entries, skill progression, and activities. What recurring themes and patterns do you see? What story is my life telling? Reveal the hidden narratives.`,
            name_chapter: `As the Storyteller, consider where I am in my journey right now. Looking at my current level (${s.level}), recent activities, active quests, and life situation - if this were a chapter in my epic, what would you name it? Explain why this title fits.`
        };
        return prompts[actionId] || prompts.narrate_today;
    }

    renderElderOfflineMode(container, persona, modeConfig) {
        const offlineSection = container.createDiv({ cls: 'journey-elder-offline' });

        offlineSection.innerHTML = `
            <div class="journey-elder-speech-bubble offline">
                <p>"I sense your presence, traveler, but the ethereal connection is not established.
                To hear my voice directly, you must forge a link to the mystical realm..."</p>
            </div>

            <div class="journey-elder-upgrade-box">
                <h4>🔮 Unlock the Elder's Voice</h4>
                <p>Connect to OpenRouter to enable direct conversations:</p>
                <ul>
                    <li>💬 Meaningful conversations about your journey</li>
                    <li>📖 ${this.elderMode === 'storyteller' ? 'Epic narration of your story' : 'Personalized guidance'}</li>
                    <li>🎯 Tailored wisdom for your unique path</li>
                </ul>
            </div>
        `;

        const connectBtn = offlineSection.createEl('button', {
            text: '🔗 Establish Connection (Settings)',
            cls: 'journey-full-width-btn primary'
        });
        connectBtn.onclick = () => {
            this.app.setting.open();
            this.app.setting.openTabById('the-journey');
        };

        offlineSection.createEl('hr');
        offlineSection.createEl('h4', { text: '📜 Wisdom from the Scrolls' });
        this.renderDailyTip(offlineSection);
    }

    renderElderChat(container) {
        const s = this.plugin.settings;
        const persona = s.ai?.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;

        const chatSection = container.createDiv({ cls: 'journey-elder-chat-section' });
        chatSection.createEl('h4', { text: '💬 Converse with the Elder' });

        const chatContainer = chatSection.createDiv({ cls: 'journey-elder-chat-container' });

        if (this.aiChatMessages.length === 0 && s.ai?.chatHistory?.length > 0) {
            this.aiChatMessages = s.ai.chatHistory.slice(-10);
        }

        const messagesEl = chatContainer.createDiv({ cls: 'journey-elder-messages' });

        if (this.aiChatMessages.length === 0) {
            const welcomeText = this.elderMode === 'storyteller'
                ? `The Storyteller awaits to narrate your tale. What story shall we tell?`
                : `${persona.name} awaits your questions. What weighs on your mind, traveler?`;
            messagesEl.createDiv({ cls: 'journey-elder-welcome', text: welcomeText });
        } else {
            this.aiChatMessages.forEach(msg => {
                const msgEl = messagesEl.createDiv({ cls: `journey-elder-message ${msg.role}` });
                const avatar = msgEl.createDiv({ cls: 'journey-elder-msg-avatar' });
                avatar.textContent = msg.role === 'assistant' ? '🧙' : '🧑';

                const contentEl = msgEl.createDiv({ cls: 'journey-elder-msg-content' });
                if (msg.role === 'assistant') {
                    contentEl.innerHTML = renderMarkdownToHtml(msg.content);
                } else {
                    contentEl.textContent = msg.content;
                }
            });
        }

        if (this.isAiLoading) {
            const loadingEl = messagesEl.createDiv({ cls: 'journey-elder-loading' });
            loadingEl.innerHTML = '<span class="journey-elder-loading-icon">🧙</span> The Elder ponders...';
        }

        setTimeout(() => messagesEl.scrollTop = messagesEl.scrollHeight, 0);

        // Chat Input
        const inputSection = chatSection.createDiv({ cls: 'journey-elder-input-section' });

        const inputWrapper = inputSection.createDiv({ cls: 'journey-elder-input-wrapper' });
        const chatInput = inputWrapper.createEl('textarea', {
            placeholder: this.elderMode === 'storyteller' ? 'Ask for a tale...' : 'Speak your mind, traveler...',
            cls: 'journey-elder-input'
        });
        chatInput.value = this.aiChatInput;
        chatInput.addEventListener('input', (e) => this.aiChatInput = e.target.value);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendElderMessage(this.aiChatInput);
            }
        });

        const sendBtn = inputWrapper.createEl('button', { cls: 'journey-elder-send-btn', text: '📤' });
        sendBtn.onclick = () => this.sendElderMessage(this.aiChatInput);

        // Action buttons
        const actionBtns = inputSection.createDiv({ cls: 'journey-elder-action-btns' });

        const clearBtn = actionBtns.createEl('button', { text: '🗑️ Clear', cls: 'journey-mini-btn secondary' });
        clearBtn.onclick = async () => {
            this.aiChatMessages = [];
            if (s.ai) s.ai.chatHistory = [];
            await this.plugin.saveSettings();
            this.render();
        };

        const questBtn = actionBtns.createEl('button', { text: '✨ Quests', cls: 'journey-mini-btn' });
        questBtn.onclick = () => new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
    }

    async sendElderMessage(message, isQuickAction = false, displayMessage = null) {
        if (!message || !message.trim()) return;

        this.isAiLoading = true;
        if (!isQuickAction) {
            this.aiChatMessages.push({ role: 'user', content: message });
            this.aiChatInput = '';
        }
        this.render();

        try {
            const aiService = new AIService(this.plugin);

            // Build enhanced message with memories
            let enhancedMessage = message;
            if (this.plugin.settings.ai?.elderMemoryEnabled &&
                this.plugin.settings.ai?.embeddingEnabled &&
                this.plugin.settings.journalSettings?.embeddings?.length > 0) {
                try {
                    const embeddingService = new EmbeddingService(this.plugin);
                    const memoryCount = this.plugin.settings.ai?.elderMemoryCount || 3;
                    const memories = await embeddingService.getRelevantMemories(message, memoryCount);

                    if (memories.length > 0) {
                        const memoryContext = memories.map(m =>
                            `- From "${m.fileName}" (${m.date?.split('T')[0] || 'unknown date'}): ${m.summary}`
                        ).join('\n');
                        enhancedMessage = `${message}\n\n[The Elder recalls relevant memories...]\n${memoryContext}`;
                    }
                } catch (memErr) {
                    console.log('Memory retrieval skipped:', memErr.message);
                }
            }

            // Use storyteller system prompt if in storyteller mode
            const useStoryteller = this.elderMode === 'storyteller';
            const response = await aiService.chat(enhancedMessage, true, useStoryteller);

            if (isQuickAction) {
                this.aiChatMessages.push(
                    { role: 'user', content: displayMessage || 'I seek your wisdom...' },
                    { role: 'assistant', content: response }
                );
            } else {
                this.aiChatMessages.push({ role: 'assistant', content: response });
            }

            if (this.aiChatMessages.length > 20) {
                this.aiChatMessages = this.aiChatMessages.slice(-20);
            }

        } catch (error) {
            this.aiChatMessages.push({
                role: 'assistant',
                content: `*The Elder's voice fades momentarily...* \n\n⚠️ ${error.message}`
            });
        }

        this.isAiLoading = false;
        this.render();
    }

    renderDailyTip(container) {
        const s = this.plugin.settings;
        const tipSection = container.createDiv({ cls: 'journey-coach-section' });

        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const focusDomain = sortedDomains[0];

        const domainTips = COACHING_TIPS[focusDomain.id] || COACHING_TIPS.psychologicalWellbeing;
        const todayIndex = new Date().getDate() % domainTips.length;
        const todayTip = domainTips[todayIndex];

        const tipCard = tipSection.createDiv({ cls: 'journey-tip-card' });
        tipCard.createDiv({ cls: 'journey-tip-domain', text: `For ${focusDomain.icon} ${focusDomain.name}:` });
        tipCard.createDiv({ cls: 'journey-tip-text', text: todayTip.tip });
        tipCard.createDiv({ cls: 'journey-tip-action', text: `💪 ${todayTip.action}` });
    }

    // ============================================================================
    // CHRONICLE TAB - Activity History
    // ============================================================================
    renderChronicle(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "📜 Chronicle" });
        container.createEl("p", { cls: 'journey-subtitle', text: "The record of your journey" });

        const log = s.activityLog || [];

        if (log.length === 0) {
            container.createDiv({ cls: 'journey-empty', text: 'Your chronicle is empty. Begin your journey!' });
            return;
        }

        const logList = container.createDiv({ cls: 'journey-activity-log' });

        // Group by date
        const groupedByDate = {};
        log.forEach(activity => {
            const date = new Date(activity.timestamp).toLocaleDateString();
            if (!groupedByDate[date]) groupedByDate[date] = [];
            groupedByDate[date].push(activity);
        });

        Object.entries(groupedByDate).slice(0, 7).forEach(([date, activities]) => {
            const dateHeader = logList.createDiv({ cls: 'journey-log-date-header' });
            dateHeader.createSpan({ text: date === new Date().toLocaleDateString() ? '📅 Today' : `📅 ${date}` });

            activities.forEach(activity => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.id === activity.category) || { icon: '📝', label: 'Activity', color: '#888' };

                const logItem = logList.createDiv({ cls: 'journey-log-item' });

                logItem.createDiv({
                    cls: 'journey-log-icon',
                    text: cat.icon,
                    attr: { style: `background-color: ${cat.color}20; color: ${cat.color}` }
                });

                const logContent = logItem.createDiv({ cls: 'journey-log-content' });
                logContent.createDiv({ cls: 'journey-log-desc', text: activity.description });

                if (activity.details) {
                    const detailsStr = Object.entries(activity.details)
                        .filter(([k, v]) => v !== undefined && v !== null)
                        .map(([k, v]) => {
                            if (k === 'xp') return `+${v} XP`;
                            if (k === 'gold') return `+${v}g`;
                            if (k === 'hpRecovered') return `+${v} HP`;
                            if (k === 'hpLost') return `-${v} HP`;
                            if (k === 'streak') return `🔥${v}`;
                            return null;
                        })
                        .filter(Boolean)
                        .join(' • ');

                    if (detailsStr) {
                        logContent.createDiv({ cls: 'journey-log-details', text: detailsStr });
                    }
                }

                const time = new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                logItem.createDiv({ cls: 'journey-log-time', text: time });
            });
        });

        // Clear button
        const clearBtn = container.createEl('button', {
            text: '🗑️ Clear Chronicle',
            cls: 'journey-full-width-btn secondary'
        });
        clearBtn.onclick = async () => {
            if (confirm('Clear all activity history?')) {
                s.activityLog = [];
                await this.plugin.saveSettings();
                this.render();
            }
        };
    }
}

module.exports = { JourneyView };
