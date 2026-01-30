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
            journal: true,
            quests: true,
            arena: false,
            rest: false
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

        // Discovery Journey prompt if not completed
        if (!s.characterProfile.assessmentComplete) {
            const journeyBox = container.createDiv({ cls: 'journey-journey-prompt' });
            journeyBox.createEl('h4', { text: '🧭 Discovery Journey' });
            journeyBox.createEl('p', {
                text: 'Answer 37 questions to discover your true strengths and unlock your full potential!',
                cls: 'journey-journey-desc'
            });

            const journeyBtn = journeyBox.createEl('button', {
                text: '🧭 Start Discovery Journey',
                cls: 'journey-full-width-btn journey'
            });
            journeyBtn.onclick = () => {
                const modal = new CharacterCreationModal(this.app, this.plugin, () => this.render());
                modal.characterName = s.characterProfile.name;
                modal.currentStep = 'domain_intro';
                modal.open();
            };
        }

        // Daily Wisdom
        const today = new Date().toDateString();
        if (s.lastWisdomDate !== today || !s.dailyWisdom) {
            s.dailyWisdom = getContextualWisdom(s);
            s.lastWisdomDate = today;
            this.plugin.saveSettings();
        }

        if (s.dailyWisdom) {
            const wisdomSection = container.createDiv({ cls: 'journey-wisdom-section standalone' });
            wisdomSection.createDiv({ cls: 'journey-wisdom-label', text: '💡 Daily Wisdom' });
            wisdomSection.createDiv({ cls: 'journey-wisdom-quote', text: `"${s.dailyWisdom.text}"` });
            if (s.dailyWisdom.source) {
                wisdomSection.createDiv({ cls: 'journey-wisdom-source', text: `— ${s.dailyWisdom.source}` });
            }
        }

        // Quadrant Scores
        if (s.characterProfile.assessmentComplete) {
            const quadrantsSection = container.createDiv({ cls: 'journey-quadrants-section' });
            quadrantsSection.createEl('h4', { text: '📊 Four Quadrants' });

            const quadrantScores = calculateQuadrantScores(s.domains);
            const quadrantsGrid = quadrantsSection.createDiv({ cls: 'journey-quadrants-grid' });

            QUADRANTS.forEach(quadrant => {
                const score = Math.round(quadrantScores[quadrant.id]);
                const card = quadrantsGrid.createDiv({ cls: 'journey-quadrant-card' });

                const header = card.createDiv({ cls: 'journey-quadrant-header', attr: { style: `background: ${quadrant.color}20` } });
                header.innerHTML = `
                    <span class="journey-quadrant-icon">${quadrant.icon}</span>
                    <span class="journey-quadrant-name">${quadrant.name}</span>
                `;

                const barContainer = card.createDiv({ cls: 'journey-quadrant-bar-container' });
                barContainer.createDiv({
                    cls: 'journey-quadrant-bar',
                    attr: { style: `width: ${score}%; background-color: ${quadrant.color}` }
                });
                card.createDiv({ cls: 'journey-quadrant-score', text: `${score}%` });
            });
        }

        // --- SKILLS SECTION ---
        container.createEl("h3", { text: "🎯 Skills", cls: 'journey-section-divider' });

        const skillService = new SkillService(this.plugin);
        const skills = skillService.getSkills();
        const ss = s.skillsSettings || {};

        // Skill Points Banner
        const skillPointsBanner = container.createDiv({ cls: 'journey-skill-points-banner' });
        skillPointsBanner.innerHTML = `
            <div class="journey-skill-points-icon">⭐</div>
            <div class="journey-skill-points-info">
                <div class="journey-skill-points-count">${ss.availableSkillPoints || 0}</div>
                <div class="journey-skill-points-label">Skill Points</div>
            </div>
        `;

        // Skills Summary
        const summary = skillService.getSkillSummary();
        const summaryCard = container.createDiv({ cls: 'journey-skills-summary' });
        summaryCard.innerHTML = `
            <div class="journey-skills-stat">
                <span class="journey-skills-stat-value">${summary.total}</span>
                <span class="journey-skills-stat-label">Total</span>
            </div>
            <div class="journey-skills-stat">
                <span class="journey-skills-stat-value">${summary.byCategory.mind || 0}</span>
                <span class="journey-skills-stat-label">🧠</span>
            </div>
            <div class="journey-skills-stat">
                <span class="journey-skills-stat-value">${summary.byCategory.body || 0}</span>
                <span class="journey-skills-stat-label">💪</span>
            </div>
            <div class="journey-skills-stat">
                <span class="journey-skills-stat-value">${summary.byCategory.spirit || 0}</span>
                <span class="journey-skills-stat-label">✨</span>
            </div>
            <div class="journey-skills-stat">
                <span class="journey-skills-stat-value">${summary.byCategory.vocation || 0}</span>
                <span class="journey-skills-stat-label">⚔️</span>
            </div>
        `;

        // Action Buttons Row
        const actionRow = container.createDiv({ cls: 'journey-skill-actions' });

        const addSkillBtn = actionRow.createEl('button', {
            text: '➕ Add Skill',
            cls: 'journey-mini-btn'
        });
        addSkillBtn.onclick = () => {
            new AddSkillModal(this.app, this.plugin, () => this.render()).open();
        };

        const apiKey = getActiveApiKey(s);
        if (apiKey) {
            const discoverBtn = actionRow.createEl('button', {
                text: '🔍 Discover from Journals',
                cls: 'journey-mini-btn primary'
            });
            discoverBtn.onclick = async () => {
                discoverBtn.disabled = true;
                discoverBtn.textContent = '🔍 Discovering...';
                await this.plugin.manualDiscoverSkills();
                this.render();
            };
        }

        // Skills by Category (compact)
        Object.entries(SKILL_CATEGORIES).forEach(([catId, catInfo]) => {
            const categorySkills = skills.filter(s => s.category === catId);
            if (categorySkills.length === 0) return;

            const categorySection = container.createDiv({ cls: 'journey-skill-category' });
            categorySection.createDiv({ cls: 'journey-skill-category-header', text: `${catInfo.icon} ${catInfo.name} (${categorySkills.length})` });

            const skillsList = categorySection.createDiv({ cls: 'journey-skills-list' });
            categorySkills.forEach(skill => {
                const xpPercent = Math.round((skill.xp / skill.xpToNextLevel) * 100);
                const skillCard = skillsList.createDiv({ cls: 'journey-skill-card' });
                skillCard.innerHTML = `
                    <div class="journey-skill-header">
                        <span class="journey-skill-name">${skill.name}</span>
                        <span class="journey-skill-level">Lv. ${skill.level}</span>
                    </div>
                    <div class="journey-skill-bar">
                        <div class="journey-skill-bar-fill" style="width: ${xpPercent}%"></div>
                    </div>
                `;

                // Delete button
                const deleteBtn = skillCard.createEl('button', { text: '🗑️', cls: 'journey-skill-delete-btn' });
                deleteBtn.onclick = async () => {
                    if (confirm(`Delete skill: ${skill.name}?`)) {
                        skillService.deleteSkill(skill.id);
                        await this.plugin.saveSettings();
                        this.render();
                    }
                };
            });
        });

        // Retake Assessment button
        if (s.characterProfile.assessmentComplete) {
            const retakeBtn = container.createEl('button', {
                text: '🔄 Retake Assessment',
                cls: 'journey-full-width-btn secondary'
            });
            retakeBtn.onclick = () => {
                if (confirm('Retaking the assessment will update your domain scores. Continue?')) {
                    new CharacterCreationModal(this.app, this.plugin, () => this.render()).open();
                }
            };
        }
    }

    // ============================================================================
    // ADVENTURE TAB - Collapsible Sections (Journal, Quests, Arena, Rest)
    // ============================================================================
    renderAdventure(container) {
        container.createEl('h3', { text: '⚔️ Your Adventure' });

        // Journal Section
        this.renderCollapsibleSection(container, 'journal', '📓 Journal', () => this.renderJournalSection(container));

        // Quests & Habits Section
        this.renderCollapsibleSection(container, 'quests', '⚔️ Quests & Habits', () => this.renderQuestsSection(container));

        // Arena Section
        this.renderCollapsibleSection(container, 'arena', '🐉 Arena', () => this.renderArenaSection(container));

        // Rest & Recovery Section
        this.renderCollapsibleSection(container, 'rest', '🏨 Rest & Recovery', () => this.renderRestSection(container));
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

    renderQuestsSection(container) {
        const s = this.plugin.settings;

        // Habits subsection
        container.createEl('h5', { text: '📅 Daily Habits' });
        const habitsList = container.createDiv({ cls: 'journey-list' });

        if (s.habits.length === 0) {
            habitsList.createDiv({ cls: 'journey-empty', text: 'No habits yet' });
        } else {
            s.habits.slice(0, 5).forEach((habit, index) => {
                const row = habitsList.createDiv({ cls: `journey-list-item ${habit.completed ? 'completed' : ''}` });
                const cb = row.createEl("input", { type: "checkbox" });
                cb.checked = habit.completed;
                cb.disabled = habit.completed;
                cb.onclick = async () => {
                    if (!habit.completed) {
                        await this.plugin.completeHabit(index);
                        this.render();
                    }
                };
                row.createSpan({ text: habit.name });
                if (habit.streak > 0) {
                    row.createSpan({ cls: 'journey-streak', text: `🔥${habit.streak}` });
                }
            });
        }

        const addHabitBtn = container.createEl('button', { text: '+ Add Habit', cls: 'journey-mini-btn' });
        addHabitBtn.onclick = () => new NewHabitModal(this.app, this.plugin, () => this.render()).open();

        // Quests subsection
        container.createEl('h5', { text: '🗡️ Active Quests' });
        const questsList = container.createDiv({ cls: 'journey-list' });
        const activeQuests = s.quests.filter(q => !q.completed);

        if (activeQuests.length === 0) {
            questsList.createDiv({ cls: 'journey-empty', text: 'No active quests' });
        } else {
            activeQuests.slice(0, 5).forEach((quest, idx) => {
                const realIndex = s.quests.indexOf(quest);
                const row = questsList.createDiv({ cls: 'journey-list-item quest' });
                const completeBtn = row.createEl("button", { cls: 'journey-complete-btn', text: "✓" });
                completeBtn.onclick = async () => {
                    await this.plugin.completeQuest(realIndex);
                    this.render();
                };
                row.createSpan({ text: quest.name });
            });
        }

        const addQuestBtn = container.createEl('button', { text: '+ New Quest', cls: 'journey-mini-btn' });
        addQuestBtn.onclick = () => new NewQuestModal(this.app, this.plugin, () => this.render()).open();

        // AI Quest Generator
        if (s.ai?.openRouterApiKey) {
            const aiBtn = container.createEl('button', {
                text: '✨ AI Generate Quests',
                cls: 'journey-mini-btn ai'
            });
            aiBtn.onclick = () => new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
        }
    }

    renderArenaSection(container) {
        const s = this.plugin.settings;

        // Boss Fights
        container.createEl('h5', { text: '🐉 Boss Fights' });
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);

        if (activeBosses.length === 0) {
            container.createDiv({ cls: 'journey-empty', text: 'No active boss fights' });
        } else {
            activeBosses.forEach(boss => {
                const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
                const bossCard = container.createDiv({ cls: 'journey-boss-mini' });
                bossCard.innerHTML = `
                    <span class="journey-boss-icon">${boss.icon || '🐉'}</span>
                    <span class="journey-boss-name">${boss.name}</span>
                    <span class="journey-boss-hp">${boss.currentHp}/${boss.maxHp}</span>
                `;
            });
        }

        const createBossBtn = container.createEl('button', { text: '+ Create Boss', cls: 'journey-mini-btn' });
        createBossBtn.onclick = () => new NewBossFightModal(this.app, this.plugin, () => this.render()).open();

        // Deep Work Dungeon
        container.createEl('h5', { text: '🏰 Deep Work' });
        if (s.activeDungeon && s.activeDungeon.active) {
            const elapsed = Math.floor((Date.now() - s.activeDungeon.startTime) / 1000 / 60);
            const remaining = Math.max(0, s.activeDungeon.targetMinutes - elapsed);
            container.createDiv({ cls: 'journey-dungeon-active', text: `⏳ ${remaining} min remaining` });

            const completeBtn = container.createEl('button', { text: '✅ Complete', cls: 'journey-mini-btn primary' });
            completeBtn.onclick = () => this.completeDungeon();
        } else {
            const startBtn = container.createEl('button', { text: '🏰 Enter Dungeon (25 min)', cls: 'journey-mini-btn' });
            startBtn.onclick = () => this.startDungeon(25, 'bronze');
        }
    }

    renderRestSection(container) {
        const s = this.plugin.settings;

        // Quick Stats
        const statsRow = container.createDiv({ cls: 'journey-rest-stats' });
        statsRow.innerHTML = `
            <span>❤️ ${s.hp}/${s.maxHp}</span>
            <span>⚡ ${s.energy || 100}/${s.maxEnergy || 100}</span>
            <span>💰 ${s.gold}g</span>
        `;

        // Mood Check-in
        container.createEl('h5', { text: '😊 How are you feeling?' });
        const moodGrid = container.createDiv({ cls: 'journey-mood-grid' });
        MOOD_OPTIONS.slice(0, 4).forEach(mood => {
            const moodBtn = moodGrid.createEl('button', { cls: 'journey-mood-btn', text: mood.icon });
            moodBtn.title = mood.label;
            moodBtn.onclick = async () => {
                s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + mood.energyBonus));
                await this.plugin.saveSettings();
                new Notice(`${mood.icon} ${mood.label} logged`);
                this.render();
            };
        });

        // Inn options
        container.createEl('h5', { text: '🏨 Rest at Inn' });
        const innGrid = container.createDiv({ cls: 'journey-inn-mini-grid' });
        INN_TIERS.slice(0, 2).forEach(inn => {
            const innBtn = innGrid.createEl('button', { cls: 'journey-inn-mini-btn' });
            innBtn.innerHTML = `${inn.name}<br><small>+${inn.hpRecover} HP (${inn.cost}g)</small>`;
            innBtn.disabled = s.gold < inn.cost || s.hp >= s.maxHp;
            innBtn.onclick = async () => {
                const success = await this.plugin.restAtInn(inn.id);
                if (success) this.render();
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
