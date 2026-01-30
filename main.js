/* The Journey Plugin v0.10 - Enhanced Edition */
const { Plugin, ItemView, Notice, Modal, Setting, PluginSettingTab, requestUrl, MarkdownRenderer } = require('obsidian');


// ============================================================================
// DEV/SRC/CONSTANTS.JS
// ============================================================================

/* The Journey Constants */

// Note: VIEW_TYPE_HERO is already defined in main-core.js
// This file provides config that's referenced by multiple modules

// ============================================================================
// MULTI-PROVIDER AI CONFIGURATION
// ============================================================================

const AI_PROVIDERS = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Access 100+ models with one API key',
        chatEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        embeddingEndpoint: 'https://openrouter.ai/api/v1/embeddings',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        extraHeaders: {
            'HTTP-Referer': 'https://obsidian.md',
            'X-Title': 'The Journey Plugin'
        },
        supportsEmbeddings: true
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT models directly from OpenAI',
        chatEndpoint: 'https://api.openai.com/v1/chat/completions',
        embeddingEndpoint: 'https://api.openai.com/v1/embeddings',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        extraHeaders: {},
        supportsEmbeddings: true
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models directly from Anthropic',
        chatEndpoint: 'https://api.anthropic.com/v1/messages',
        embeddingEndpoint: null,
        authHeader: 'x-api-key',
        authPrefix: '',
        extraHeaders: {
            'anthropic-version': '2023-06-01'
        },
        supportsEmbeddings: false
    },
    google: {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini models from Google AI Studio',
        chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        embeddingEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent',
        authHeader: null,
        authPrefix: '',
        extraHeaders: {},
        supportsEmbeddings: true
    }
};

const MODELS_BY_PROVIDER = {
    openrouter: [
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Recommended)', type: 'chat' },
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5 (Most Capable)', type: 'chat' },
        { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5 (Fast & Cheap)', type: 'chat' },
        { id: 'openai/gpt-5.2', name: 'GPT-5.2', type: 'chat' },
        { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', type: 'chat' },
        { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano (Fast & Cheap)', type: 'chat' },
        { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', type: 'chat' },
        { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Fast)', type: 'chat' },
        { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2 (Cheap)', type: 'chat' },
        { id: 'x-ai/grok-4', name: 'Grok 4', type: 'chat' },
        { id: 'qwen/qwen3-max', name: 'Qwen3 Max', type: 'chat' },
        { id: 'qwen/qwen3-vl-32b-instruct', name: 'Qwen3 VL 32B (Vision)', type: 'chat' },
        { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', type: 'chat' },
        { id: 'zhipu/glm-4.7', name: 'GLM-4.7', type: 'chat' },
        { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small', type: 'embedding', dimensions: 1536 },
        { id: 'openai/text-embedding-3-large', name: 'Text Embedding 3 Large', type: 'embedding', dimensions: 3072 }
    ],
    openai: [
        { id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2 (Recommended)', type: 'chat' },
        { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', type: 'chat' },
        { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano (Fast & Cheap)', type: 'chat' },
        { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small', type: 'embedding', dimensions: 1536 },
        { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large', type: 'embedding', dimensions: 3072 }
    ],
    anthropic: [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Recommended)', type: 'chat' },
        { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5 (Most Capable)', type: 'chat' },
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (Fast)', type: 'chat' }
    ],
    google: [
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (Recommended)', type: 'chat' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Fast)', type: 'chat' },
        { id: 'text-embedding-004', name: 'Text Embedding 004', type: 'embedding', dimensions: 768 }
    ]
};

// ============================================================================
// SKILL SYSTEM
// ============================================================================

const SKILL_CATEGORIES = {
    mind: {
        name: 'Mind Skills',
        icon: '🧠',
        examples: ['Meditation', 'Critical Thinking', 'Emotional Intelligence', 'Memory', 'Focus', 'Problem Solving', 'Creativity', 'Self-Awareness']
    },
    body: {
        name: 'Body Skills',
        icon: '💪',
        examples: ['Running', 'Strength Training', 'Yoga', 'Swimming', 'Martial Arts', 'Dancing', 'Cooking', 'Sleep Optimization']
    },
    spirit: {
        name: 'Spirit Skills',
        icon: '✨',
        examples: ['Communication', 'Empathy', 'Leadership', 'Networking', 'Teaching', 'Volunteering', 'Environmental Awareness', 'Cultural Appreciation']
    },
    vocation: {
        name: 'Vocation Skills',
        icon: '⚔️',
        examples: ['Programming', 'Writing', 'Design', 'Photography', 'Marketing', 'Finance', 'Project Management', 'Public Speaking']
    }
};

const DEFAULT_SKILL = {
    id: '',
    name: '',
    category: 'vocation',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    description: '',
    discoveredFrom: '',
    discoveredDate: null,
    lastPracticed: null,
    totalPracticeCount: 0
};

const DEFAULT_SKILLS_SETTINGS = {
    skills: [],
    autoDiscovery: true,
    skillPointsPerLevel: 1,
    availableSkillPoints: 0,
    totalSkillsDiscovered: 0,
    analyzedJournals: [] // Track journals that have been analyzed for skills { path, mtime }
};

// ============================================================================
// ELDER MODE - Guide and Storyteller
// ============================================================================

const ELDER_GUIDE_ACTIONS = [
    { id: 'guidance', icon: '🔮', label: 'Guidance', desc: 'Seek direction', display: 'Elder, I seek your guidance on my path forward.' },
    { id: 'challenge', icon: '⚔️', label: 'Challenge', desc: 'Request a quest', display: 'Elder, I am ready for a new challenge. What quest would you suggest?' },
    { id: 'reflection', icon: '🪞', label: 'Reflection', desc: 'Review journey', display: 'Elder, help me reflect on my journey so far.' },
    { id: 'motivation', icon: '🔥', label: 'Courage', desc: 'Find strength', display: 'Elder, I need encouragement. Remind me of my strength.' }
];

const STORYTELLER_QUICK_ACTIONS = [
    { id: 'narrate_today', icon: '📖', label: 'Narrate Today', desc: 'Tell my day as story', display: 'Storyteller, narrate my day as if it were a chapter in my epic journey.' },
    { id: 'tell_legend', icon: '📜', label: 'Tell My Legend', desc: 'Epic summary', display: 'Storyteller, tell me the legend of my journey so far - the hero I am becoming.' },
    { id: 'find_patterns', icon: '🔍', label: 'Find Patterns', desc: 'Discover themes', display: 'Storyteller, what recurring themes and patterns do you see in my story?' },
    { id: 'name_chapter', icon: '✨', label: 'Name This Chapter', desc: 'Current arc name', display: 'Storyteller, if this were a chapter in my life story, what would you name it?' }
];

const ELDER_MODES = {
    guide: {
        id: 'guide',
        name: 'Guide Mode',
        title: 'Keeper of Wisdom',
        greeting: 'Greetings, traveler. I have watched many journeys unfold. What wisdom do you seek today?',
        actions: ELDER_GUIDE_ACTIONS
    },
    storyteller: {
        id: 'storyteller',
        name: 'Storyteller Mode',
        title: 'Weaver of Tales',
        greeting: 'Ah, traveler... every life is a story waiting to be told. Shall I narrate yours?',
        actions: STORYTELLER_QUICK_ACTIONS
    }
};

// Helper to get chat models for a provider
function getChatModels(providerId) {
    return (MODELS_BY_PROVIDER[providerId] || []).filter(m => m.type === 'chat');
}

// Helper to get embedding models for a provider
function getEmbeddingModels(providerId) {
    return (MODELS_BY_PROVIDER[providerId] || []).filter(m => m.type === 'embedding');
}

// Helper to get current API key
function getActiveApiKey(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    return settings.ai?.apiKeys?.[provider] || settings.ai?.openRouterApiKey || '';
}

// Helper to get current chat model
function getActiveChatModel(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedModels?.[provider] || settings.ai?.selectedModel || 'gpt-4o-mini';
}

// Helper to get current embedding model
function getActiveEmbeddingModel(settings) {
    const provider = settings.ai?.embeddingProvider || settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedEmbeddingModels?.[provider] || settings.ai?.embeddingModel || 'text-embedding-3-small';
}

// Note: These become global in the built main.js
// No need for module.exports in final build, but kept for IDE support

// ============================================================================
// DEV/SRC/SERVICES/SKILLSERVICE.JS
// ============================================================================

/* SkillService - Skill Discovery, Evolution & Management */

// Helper function - XP required for each skill level (exponential growth)
function getSkillXpRequired(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

class SkillService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Initialize skills settings if not present
    ensureSkillsSettings() {
        if (!this.plugin.settings.skillsSettings) {
            this.plugin.settings.skillsSettings = JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS));
        }
        if (!this.plugin.settings.skillsSettings.skills) {
            this.plugin.settings.skillsSettings.skills = [];
        }
    }

    // Get all skills
    getSkills() {
        this.ensureSkillsSettings();
        return this.plugin.settings.skillsSettings.skills;
    }

    // Get skill by ID
    getSkill(skillId) {
        return this.getSkills().find(s => s.id === skillId);
    }

    // Get skills by category
    getSkillsByCategory(category) {
        return this.getSkills().filter(s => s.category === category);
    }

    // Create a new skill
    createSkill(name, category, discoveredFrom = 'manual', description = '') {
        this.ensureSkillsSettings();

        // Check if skill already exists
        const existingSkill = this.getSkills().find(s =>
            s.name.toLowerCase() === name.toLowerCase()
        );
        if (existingSkill) {
            return existingSkill;
        }

        const newSkill = {
            ...JSON.parse(JSON.stringify(DEFAULT_SKILL)),
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            category: category,
            description: description,
            discoveredFrom: discoveredFrom,
            discoveredDate: new Date().toISOString(),
            xpToNextLevel: getSkillXpRequired(1)
        };

        this.plugin.settings.skillsSettings.skills.push(newSkill);
        this.plugin.settings.skillsSettings.totalSkillsDiscovered++;

        return newSkill;
    }

    // Add XP to a skill
    addSkillXp(skillId, xpAmount) {
        const skill = this.getSkill(skillId);
        if (!skill) return null;

        skill.xp += xpAmount;
        skill.lastPracticed = new Date().toISOString();
        skill.totalPracticeCount++;

        // Check for level up
        let levelsGained = 0;
        while (skill.xp >= skill.xpToNextLevel) {
            skill.xp -= skill.xpToNextLevel;
            skill.level++;
            skill.xpToNextLevel = getSkillXpRequired(skill.level);
            levelsGained++;
        }

        return { skill, levelsGained };
    }

    // Level up a skill using skill points
    levelUpSkill(skillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;

        if (ss.availableSkillPoints <= 0) {
            return { success: false, message: 'No skill points available' };
        }

        const skill = this.getSkill(skillId);
        if (!skill) {
            return { success: false, message: 'Skill not found' };
        }

        // Use skill point to level up
        ss.availableSkillPoints--;
        skill.level++;
        skill.xp = 0;
        skill.xpToNextLevel = getSkillXpRequired(skill.level);

        return { success: true, skill };
    }

    // Delete a skill
    deleteSkill(skillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;
        const index = ss.skills.findIndex(s => s.id === skillId);

        if (index >= 0) {
            ss.skills.splice(index, 1);
            return { success: true };
        }
        return { success: false, message: 'Skill not found' };
    }

    // Merge two skills together
    mergeSkills(sourceSkillId, targetSkillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;

        const sourceSkill = this.getSkill(sourceSkillId);
        const targetSkill = this.getSkill(targetSkillId);

        if (!sourceSkill || !targetSkill) {
            return { success: false, message: 'Skills not found' };
        }

        // Transfer XP to target skill
        targetSkill.xp += sourceSkill.xp + (sourceSkill.level * 50);

        // Check for level ups
        while (targetSkill.xp >= targetSkill.xpToNextLevel) {
            targetSkill.xp -= targetSkill.xpToNextLevel;
            targetSkill.level++;
            targetSkill.xpToNextLevel = getSkillXpRequired(targetSkill.level);
        }

        // Update practice count
        targetSkill.totalPracticeCount += sourceSkill.totalPracticeCount;

        // Remove source skill
        const index = ss.skills.findIndex(s => s.id === sourceSkillId);
        if (index >= 0) {
            ss.skills.splice(index, 1);
        }

        return { success: true, mergedSkill: targetSkill };
    }

    // AI discovers skills from journal content
    async discoverSkillsFromJournal(content, fileName) {
        const apiKey = getActiveApiKey(this.plugin.settings);
        if (!apiKey) return [];

        const aiService = new AIService(this.plugin);

        // Get existing skills to avoid duplicates and suggest combinations
        const existingSkills = this.getSkills().map(s => s.name);
        const existingList = existingSkills.length > 0
            ? `\n\nEXISTING SKILLS (don't create duplicates):\n${existingSkills.join(', ')}`
            : '';

        const prompt = `You are a skill discovery AI for an RPG life game. Extract BROAD, GENERAL skills from this journal entry.

RULES:
- Use SHORT, SIMPLE names (1-2 words max): "Writing", "Photography", "Cooking", "Running"
- Create BROAD categories, not specific variants
- Combine similar activities into ONE skill (e.g., "blog writing" + "article writing" = "Writing")
- Look for main activities only, ignore minor mentions
- Maximum 3 skills per journal entry${existingList}

CATEGORIES:
VOCATION: Writing, Design, Photography, Programming, Business, Marketing, Sales
MIND: Learning, Meditation, Planning, Problem-Solving
BODY: Running, Gym, Yoga, Cooking, Sports
SPIRIT: Networking, Teaching, Mentoring, Communication

Journal entry from "${fileName}":
---
${content.substring(0, 2000)}
---

Return ONLY valid JSON array with 0-3 skills:
[{"name": "Skill", "category": "vocation|mind|body|spirit", "xp": 20}]

Empty if nothing: []`;

        let response = '';
        try {
            response = await aiService.callProvider(
                [{ role: 'user', content: prompt }],
                this.plugin.settings.ai?.provider || 'openrouter',
                apiKey,
                getActiveChatModel(this.plugin.settings),
                0.3, // Low temperature for consistent parsing
                800  // More tokens for multiple skills
            );

            console.log('Skill discovery raw response:', response);

            // Parse JSON from response - handle various formats
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1].trim();
            }

            // Try to find JSON array in response
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            const discoveredSkills = JSON.parse(jsonStr);
            console.log('Skills discovered:', discoveredSkills);
            return Array.isArray(discoveredSkills) ? discoveredSkills : [];
        } catch (error) {
            console.error('Skill discovery error:', error);
            console.error('Raw response was:', response);
            return [];
        }
    }

    // Check if skill name is similar to an existing skill
    findSimilarSkill(newName) {
        const skills = this.getSkills();
        const newLower = newName.toLowerCase();

        // Check for exact match first
        let exact = skills.find(s => s.name.toLowerCase() === newLower);
        if (exact) return { skill: exact, similarity: 'exact' };

        // Check for partial matches
        for (const skill of skills) {
            const skillLower = skill.name.toLowerCase();

            // If one contains the other
            if (newLower.includes(skillLower) || skillLower.includes(newLower)) {
                return { skill, similarity: 'partial' };
            }

            // Check for similar words
            const newWords = newLower.split(/\s+/);
            const skillWords = skillLower.split(/\s+/);
            const commonWords = newWords.filter(w => skillWords.includes(w));
            if (commonWords.length > 0 && (commonWords.length / newWords.length) > 0.5) {
                return { skill, similarity: 'similar' };
            }
        }

        return null;
    }

    // Check if skill can evolve to advanced version
    checkSkillEvolution(skill) {
        if (skill.level < 5) return null; // Need level 5 to evolve

        // Skill evolution rules
        const evolutions = {
            'Writing': { level: 5, evolvedName: 'Professional Writing' },
            'Photography': { level: 5, evolvedName: 'Professional Photography' },
            'Cooking': { level: 5, evolvedName: 'Culinary Arts' },
            'Programming': { level: 5, evolvedName: 'Software Engineering' },
            'Design': { level: 5, evolvedName: 'Creative Design' },
            'Running': { level: 5, evolvedName: 'Athletic Running' },
            'Gym': { level: 5, evolvedName: 'Strength Training' },
            'Business': { level: 5, evolvedName: 'Business Management' },
            'Marketing': { level: 5, evolvedName: 'Digital Marketing' },
            'Teaching': { level: 5, evolvedName: 'Master Teaching' },
            'Meditation': { level: 5, evolvedName: 'Mindfulness Practice' },
            'Learning': { level: 5, evolvedName: 'Fast Learning' }
        };

        const evolution = evolutions[skill.name];
        if (evolution && skill.level >= evolution.level) {
            return evolution.evolvedName;
        }

        return null;
    }

    // Process discovered skills - create or update
    async processDiscoveredSkills(discoveredSkills) {
        const results = [];

        for (const discovered of discoveredSkills) {
            if (!discovered.name || !discovered.category) continue;

            // Check for similar existing skill
            const similar = this.findSimilarSkill(discovered.name);

            if (similar) {
                // Use existing skill instead of creating duplicate
                const skill = similar.skill;
                const result = this.addSkillXp(skill.id, discovered.xp || 20);

                // Check for evolution
                const evolvedName = this.checkSkillEvolution(skill);
                if (evolvedName && skill.name !== evolvedName) {
                    skill.name = evolvedName;
                    results.push({
                        action: 'evolved',
                        skill: skill,
                        oldName: discovered.name,
                        levelsGained: result.levelsGained
                    });
                } else {
                    results.push({
                        action: 'xp_added',
                        skill: result.skill,
                        xpAdded: discovered.xp || 20,
                        levelsGained: result.levelsGained
                    });
                }
            } else {
                // New skill discovered
                const skill = this.createSkill(
                    discovered.name,
                    discovered.category,
                    'journal',
                    discovered.description || ''
                );
                // Add initial XP
                if (discovered.xp > 0) {
                    this.addSkillXp(skill.id, discovered.xp);
                }
                results.push({
                    action: 'discovered',
                    skill: skill,
                    xpAdded: discovered.xp || 0
                });
            }
        }

        return results;
    }

    // Get skill summary for display
    getSkillSummary() {
        const skills = this.getSkills();
        const summary = {
            total: skills.length,
            byCategory: {},
            topSkills: [],
            recentlyPracticed: []
        };

        // Count by category
        Object.keys(SKILL_CATEGORIES).forEach(cat => {
            summary.byCategory[cat] = skills.filter(s => s.category === cat).length;
        });

        // Top skills by level
        summary.topSkills = [...skills]
            .sort((a, b) => b.level - a.level || b.xp - a.xp)
            .slice(0, 5);

        // Recently practiced
        summary.recentlyPracticed = [...skills]
            .filter(s => s.lastPracticed)
            .sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed))
            .slice(0, 5);

        return summary;
    }
}

// ============================================================================
// DEV/SRC/VIEWS/JOURNEYVIEW.JS
// ============================================================================

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

        // HUMAN 3.0 Framework Section
        if (s.characterProfile.assessmentComplete) {
            const human3Section = container.createDiv({ cls: 'journey-human3-section' });
            human3Section.createEl('h4', { text: '🎯 HUMAN 3.0 Framework' });

            // Calculate development level and tier progress
            const quadrantScores = calculateQuadrantScores(s.domains);
            const devLevel = getDevelopmentLevel(s.level);
            const devInfo = DEVELOPMENT_LEVELS[devLevel];
            const tierProgress = getTierProgress(s.level);
            const levelsToNext = getLevelsToNextTier(s.level);

            // Development Level Display
            const devLevelSection = human3Section.createDiv({ cls: 'journey-dev-level' });
            devLevelSection.innerHTML = `
                <div class="journey-dev-level-badge level-${devLevel.replace('.', '-')}">${devInfo.icon} HUMAN ${devLevel}</div>
                <div class="journey-dev-level-title">${devInfo.name} - ${devInfo.title}</div>
                <div class="journey-dev-level-journey">${devInfo.journey}</div>
                <div class="journey-dev-level-desc">${devInfo.desc}</div>
            `;

            // Tier Progress Bar
            const tierProgressSection = human3Section.createDiv({ cls: 'journey-tier-progress' });
            tierProgressSection.innerHTML = `
                <div class="journey-tier-progress-label">Tier Progress: ${tierProgress}%</div>
                <div class="journey-tier-progress-bar">
                    <div class="journey-tier-progress-fill" style="width: ${tierProgress}%"></div>
                </div>
                ${levelsToNext > 0
                    ? `<div class="journey-tier-next">${levelsToNext} levels to HUMAN ${devLevel === '1.0' ? '2.0' : '3.0'}</div>`
                    : `<div class="journey-tier-max">🌟 Maximum HUMAN tier achieved!</div>`
                }
            `;
        }

        // Enhanced Four Quadrants Section
        if (s.characterProfile.assessmentComplete) {
            const quadrantsSection = container.createDiv({ cls: 'journey-quadrants-section' });
            quadrantsSection.createEl('h4', { text: '📊 Four Quadrants of Development' });

            const quadrantScores = calculateQuadrantScores(s.domains);

            // Calculate overall balance score
            const quadrantValues = Object.values(quadrantScores);
            const overallScore = Math.round(quadrantValues.reduce((a, b) => a + b, 0) / 4);
            const minQuadrant = Math.min(...quadrantValues);
            const maxQuadrant = Math.max(...quadrantValues);
            const balance = 100 - (maxQuadrant - minQuadrant);

            // Overall stats
            const overallStats = quadrantsSection.createDiv({ cls: 'journey-quadrant-overall' });
            overallStats.innerHTML = `
                <div class="journey-quadrant-overall-stat">
                    <span class="label">Overall:</span>
                    <span class="value">${overallScore}%</span>
                </div>
                <div class="journey-quadrant-overall-stat">
                    <span class="label">Balance:</span>
                    <span class="value ${balance >= 70 ? 'good' : balance >= 50 ? 'fair' : 'low'}">${balance}%</span>
                </div>
            `;

            const quadrantsGrid = quadrantsSection.createDiv({ cls: 'journey-quadrants-grid' });

            QUADRANTS.forEach(quadrant => {
                const score = Math.round(quadrantScores[quadrant.id]);
                const relatedDomainIds = Object.entries(DOMAIN_TO_QUADRANT)
                    .filter(([_, q]) => q === quadrant.id)
                    .map(([domainId, _]) => domainId);
                const relatedDomains = s.domains.filter(d => relatedDomainIds.includes(d.id));

                const card = quadrantsGrid.createDiv({ cls: 'journey-quadrant-card' });

                // Quadrant Header
                const header = card.createDiv({ cls: 'journey-quadrant-header', attr: { style: `background: ${quadrant.color}20` } });
                header.innerHTML = `
                    <span class="journey-quadrant-icon">${quadrant.icon}</span>
                    <span class="journey-quadrant-name">${quadrant.name}</span>
                `;

                // Quadrant Score Bar
                const barContainer = card.createDiv({ cls: 'journey-quadrant-bar-container' });
                barContainer.createDiv({
                    cls: 'journey-quadrant-bar',
                    attr: { style: `width: ${score}%; background-color: ${quadrant.color}` }
                });
                card.createDiv({ cls: 'journey-quadrant-score', text: `${score}%` });

                // Quadrant Description
                card.createDiv({ cls: 'journey-quadrant-desc', text: quadrant.desc });

                // Related Domains
                const domainsContainer = card.createDiv({ cls: 'journey-quadrant-domains' });
                relatedDomains.forEach(domain => {
                    const domainRow = domainsContainer.createDiv({ cls: 'journey-quadrant-domain-row' });
                    domainRow.innerHTML = `
                        <span class="journey-qd-icon">${domain.icon}</span>
                        <span class="journey-qd-name">${domain.name}</span>
                        <span class="journey-qd-score">${domain.score}%</span>
                    `;
                });
            });
        }

        // Journey Stats Section
        if (s.characterProfile.assessmentComplete) {
            const statsSection = container.createDiv({ cls: 'journey-char-stats-summary' });
            statsSection.createEl('h4', { text: '📈 Journey Stats' });

            const createdDate = new Date(s.characterProfile.createdAt).toLocaleDateString();
            const statsGrid = statsSection.createDiv({ cls: 'journey-stats-grid' });

            statsGrid.innerHTML = `
                <div class="journey-stat-card">
                    <div class="journey-stat-icon">📅</div>
                    <div class="journey-stat-label">Started</div>
                    <div class="journey-stat-value">${createdDate}</div>
                </div>
                <div class="journey-stat-card">
                    <div class="journey-stat-icon">✅</div>
                    <div class="journey-stat-label">Habits</div>
                    <div class="journey-stat-value">${s.totalHabitsCompleted || 0}</div>
                </div>
                <div class="journey-stat-card">
                    <div class="journey-stat-icon">⚔️</div>
                    <div class="journey-stat-label">Quests</div>
                    <div class="journey-stat-value">${s.totalQuestsCompleted || 0}</div>
                </div>
                <div class="journey-stat-card">
                    <div class="journey-stat-icon">💰</div>
                    <div class="journey-stat-label">Gold Earned</div>
                    <div class="journey-stat-value">${s.totalGoldEarned || 0}</div>
                </div>
            `;
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
        const s = this.plugin.settings;

        // ===== STATS BAR (HP & Energy) =====
        const statsBar = container.createDiv({ cls: 'journey-stats-bar' });
        const hpPercent = Math.round((s.hp / s.maxHp) * 100);
        const energyPercent = Math.round(((s.energy || 100) / (s.maxEnergy || 100)) * 100);
        statsBar.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">❤️ HP</span>
                <div class="stat-bar"><div class="stat-fill hp" style="width: ${hpPercent}%"></div></div>
                <span class="stat-value">${s.hp}/${s.maxHp}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">⚡ Energy</span>
                <div class="stat-bar"><div class="stat-fill energy" style="width: ${energyPercent}%"></div></div>
                <span class="stat-value">${s.energy || 100}/${s.maxEnergy || 100}</span>
            </div>
        `;

        // ===== 1. ACTIVITY CALENDAR (First) =====
        this.renderActivityCalendar(container);

        // ===== 2. LOG LAST NIGHT'S SLEEP =====
        const sleepSection = container.createDiv({ cls: 'journey-daily-checkin' });
        sleepSection.createEl('h4', { text: '😴 Log Last Night\'s Sleep' });
        const sleepGrid = sleepSection.createDiv({ cls: 'journey-sleep-grid' });

        SLEEP_QUALITY.forEach(sleep => {
            const sleepBtn = sleepGrid.createEl('button', { cls: 'journey-sleep-btn' });
            const restore = sleep.hpRestore >= 0 ? `+${sleep.hpRestore}` : sleep.hpRestore;
            sleepBtn.innerHTML = `
                <span class="sleep-icon">${sleep.icon}</span>
                <span class="sleep-label">${sleep.label}</span>
                <span class="sleep-hp">${restore} HP</span>
            `;
            sleepBtn.onclick = async () => {
                await this.logSleep(sleep);
            };
        });

        // ===== 3. HOW ARE YOU FEELING TODAY =====
        const moodSection = container.createDiv({ cls: 'journey-daily-checkin' });
        moodSection.createEl('h4', { text: '😊 How are you feeling today?' });
        const moodGrid = moodSection.createDiv({ cls: 'journey-mood-grid-2col' });

        MOOD_OPTIONS.forEach(mood => {
            const isActive = s.lastMood?.mood === mood.id;
            const moodBtn = moodGrid.createEl('button', {
                cls: `journey-mood-card ${isActive ? 'active' : ''}`
            });
            const energyText = mood.energyBonus >= 0 ? `+${mood.energyBonus}` : mood.energyBonus;
            moodBtn.innerHTML = `
                <span class="mood-card-icon">${mood.icon}</span>
                <span class="mood-card-label">${mood.label}</span>
                <span class="mood-card-energy">${energyText} ⚡</span>
            `;
            moodBtn.onclick = async () => {
                s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + mood.energyBonus));

                // Log to mood history
                if (!s.moodLog) s.moodLog = [];
                s.moodLog.unshift({
                    moodId: mood.id,
                    timestamp: new Date().toISOString(),
                    energyBonus: mood.energyBonus
                });
                s.moodLog = s.moodLog.slice(0, 30);

                s.lastMood = { mood: mood.id, date: new Date().toISOString() };

                // Log to Chronicle
                this.plugin.logActivity('mood', `Feeling ${mood.label}`, {
                    mood: `${mood.icon} ${mood.label}`,
                    energyGain: mood.energyBonus >= 0 ? mood.energyBonus : undefined,
                    energyLost: mood.energyBonus < 0 ? Math.abs(mood.energyBonus) : undefined
                });

                await this.plugin.saveSettings();
                new Notice(`${mood.icon} ${mood.label}! Energy ${energyText}`);
                this.render();
            };
        });

        // ===== 4. COLLAPSIBLE SECTIONS =====
        // Arena & Boss Fights (FIRST - above Journal)
        this.renderCollapsibleSection(container, 'arena', '🐉 Arena & Boss Fights', () => this.renderArenaSection(container));

        // Quests & Habits Section
        this.renderCollapsibleSection(container, 'quests', '⚔️ Quests & Habits', () => this.renderQuestsSection(container));

        // Journal Section (LAST)
        this.renderCollapsibleSection(container, 'journal', '📓 Journal & Skills', () => this.renderJournalSection(container));
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
        const hasApiKey = !!s.ai?.openRouterApiKey;

        // Status info
        const statusCard = container.createDiv({ cls: 'journey-journal-status' });
        const lastSync = js.lastSyncDate ? new Date(js.lastSyncDate).toLocaleString() : 'Never';
        const folderStatus = js.scanMode === 'folder' ? `📁 ${js.journalFolder || 'Journal'}` : `🏷️ ${js.journalTag || '#journal'}`;
        const aiStatus = hasApiKey ? '✅ AI + Skills' : '⚠️ Basic (no API key)';

        statusCard.innerHTML = `
            <div class="journey-journal-stat">
                <span class="label">Source:</span>
                <span class="value">${folderStatus}</span>
            </div>
            <div class="journey-journal-stat">
                <span class="label">Mode:</span>
                <span class="value">${aiStatus}</span>
            </div>
            <div class="journey-journal-stat">
                <span class="label">Last Sync:</span>
                <span class="value">${lastSync}</span>
            </div>
        `;

        // Sync buttons row
        const btnRow = container.createDiv({ cls: 'journey-btn-row' });

        const syncBtn = btnRow.createEl('button', {
            text: '🔄 Sync Journals',
            cls: 'journey-sync-btn primary'
        });
        syncBtn.onclick = async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Syncing...';
            try {
                await this.plugin.syncJournals();
                this.render();
            } catch (e) {
                new Notice(`❌ Sync failed: ${e.message}`);
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 Sync Journals';
            }
        };

        // Reset sync button (to re-analyze all journals)
        const resetSyncBtn = btnRow.createEl('button', {
            text: '🔃 Reset & Resync All',
            cls: 'journey-sync-btn secondary'
        });
        resetSyncBtn.title = 'Clear sync history to re-analyze all journal files and rediscover skills';
        resetSyncBtn.onclick = async () => {
            if (confirm('Reset sync and re-analyze ALL journal files?\n\nThis will:\n• Re-process all journals for XP/HP/Energy\n• Re-discover skills from all journals\n\nExisting skills will gain more XP if mentioned again.')) {
                js.lastSyncDate = null;
                js.recentAnalysis = [];
                // Also clear analyzed journals for skill discovery
                if (s.skillsSettings) {
                    s.skillsSettings.analyzedJournals = [];
                }
                await this.plugin.saveSettings();
                new Notice('🔃 Sync reset! Click "Sync Journals" to re-analyze all.');
                this.render();
            }
        };

        // Recent Analysis
        if (js.recentAnalysis && js.recentAnalysis.length > 0) {
            container.createEl('h5', { text: '📊 Recent Analysis' });
            const analysisList = container.createDiv({ cls: 'journey-analysis-list' });
            js.recentAnalysis.slice(0, 3).forEach(a => {
                const item = analysisList.createDiv({ cls: 'journey-analysis-item' });
                const sentiment = a.sentiment > 0 ? '😊' : a.sentiment < 0 ? '😔' : '😐';
                item.innerHTML = `<span>${sentiment} ${a.fileName}</span><span>+${a.xp || 0} XP</span>`;
            });
        }

        // Tip if no API key
        if (!hasApiKey) {
            const tip = container.createDiv({ cls: 'journey-tip' });
            tip.innerHTML = `💡 <strong>Tip:</strong> Add OpenRouter API key in Settings for AI analysis and automatic skill discovery from journals.`;
        }
    }

    renderQuestsSection(container) {
        const s = this.plugin.settings;

        // ===== GOOD HABITS (+HP) =====
        container.createEl('h5', { text: '✅ Good Habits - Click to Complete (+HP)' });
        const habitsList = container.createDiv({ cls: 'journey-habit-grid' });

        if (s.habits.length === 0) {
            habitsList.createDiv({ cls: 'journey-empty', text: 'No good habits yet. Add one!' });
        } else {
            s.habits.forEach((habit, index) => {
                const hpReward = habit.hpReward || DIFFICULTY[habit.difficulty || 'medium']?.hpReward || 5;
                const habitRow = habitsList.createDiv({ cls: 'journey-habit-row' });

                const habitBtn = habitRow.createEl('button', {
                    cls: `journey-habit-btn good ${habit.completed ? 'completed' : ''}`
                });
                habitBtn.innerHTML = `
                    <span class="habit-icon">${habit.completed ? '✅' : '⬜'}</span>
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-reward">+${hpReward} ❤️</span>
                    ${habit.streak > 0 ? `<span class="habit-streak">🔥${habit.streak}</span>` : ''}
                `;
                habitBtn.disabled = habit.completed;
                habitBtn.onclick = async () => {
                    if (!habit.completed) {
                        await this.plugin.completeHabit(index);
                        this.render();
                    }
                };

                // Delete button
                const deleteBtn = habitRow.createEl('button', { cls: 'journey-delete-btn', text: '×' });
                deleteBtn.title = 'Delete habit';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete habit "${habit.name}"?`)) {
                        s.habits.splice(index, 1);
                        await this.plugin.saveSettings();
                        new Notice(`🗑️ Habit deleted`);
                        this.render();
                    }
                };
            });
        }

        const addHabitBtn = container.createEl('button', { text: '+ Add Good Habit', cls: 'journey-mini-btn good' });
        addHabitBtn.onclick = () => new NewHabitModal(this.app, this.plugin, () => this.render()).open();

        // ===== BAD HABITS (-HP) =====
        container.createEl('h5', { text: '❌ Bad Habits - Click if you slipped (-HP)' });
        const badHabitsList = container.createDiv({ cls: 'journey-habit-grid' });

        if (!s.badHabits || s.badHabits.length === 0) {
            badHabitsList.createDiv({ cls: 'journey-empty', text: 'No bad habits tracked' });
        } else {
            s.badHabits.forEach((badHabit, index) => {
                const hpCost = badHabit.hpCost || 10;
                const habitRow = badHabitsList.createDiv({ cls: 'journey-habit-row' });

                const badHabitBtn = habitRow.createEl('button', { cls: 'journey-habit-btn bad' });
                badHabitBtn.innerHTML = `
                    <span class="habit-icon">😈</span>
                    <span class="habit-name">${badHabit.name}</span>
                    <span class="habit-penalty">-${hpCost} ❤️</span>
                    ${badHabit.triggerCount > 0 ? `<span class="habit-count">(${badHabit.triggerCount}x)</span>` : ''}
                `;
                badHabitBtn.onclick = async () => {
                    await this.plugin.triggerBadHabit(index);
                    this.render();
                };

                // Delete button
                const deleteBtn = habitRow.createEl('button', { cls: 'journey-delete-btn', text: '×' });
                deleteBtn.title = 'Delete bad habit';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete bad habit "${badHabit.name}"?`)) {
                        s.badHabits.splice(index, 1);
                        await this.plugin.saveSettings();
                        new Notice(`🗑️ Bad habit deleted`);
                        this.render();
                    }
                };
            });
        }

        const addBadHabitBtn = container.createEl('button', { text: '+ Add Bad Habit', cls: 'journey-mini-btn bad' });
        addBadHabitBtn.onclick = () => new NewBadHabitModal(this.app, this.plugin, () => this.render()).open();

        // ===== QUESTS =====
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);
        const hasBoss = activeBosses.length > 0;
        const targetBoss = hasBoss ? activeBosses[0] : null;

        container.createEl('h5', { text: '⚔️ Quests' });

        // Show boss connection if there's an active boss
        if (hasBoss && targetBoss) {
            const bossLink = container.createDiv({ cls: 'journey-boss-link' });
            const bossHpPercent = Math.max(0, (targetBoss.currentHp / targetBoss.maxHp) * 100);
            bossLink.innerHTML = `
                <div class="boss-link-header">
                    <span class="boss-link-icon">${targetBoss.icon || '🐉'}</span>
                    <span class="boss-link-name">Fighting: ${targetBoss.name}</span>
                </div>
                <div class="boss-link-hp">
                    <div class="boss-link-hp-bar">
                        <div class="boss-link-hp-fill" style="width: ${bossHpPercent}%"></div>
                    </div>
                    <span class="boss-link-hp-text">${targetBoss.currentHp}/${targetBoss.maxHp} HP</span>
                </div>
                <div class="boss-link-info">⚔️ Complete quests below to deal damage!</div>
            `;
        }

        const questsList = container.createDiv({ cls: 'journey-list' });
        const activeQuests = s.quests.filter(q => !q.completed);

        if (activeQuests.length === 0) {
            questsList.createDiv({ cls: 'journey-empty', text: 'No active quests. Create one to start fighting!' });
        } else {
            activeQuests.slice(0, 5).forEach((quest, idx) => {
                const realIndex = s.quests.indexOf(quest);
                const diff = DIFFICULTY[quest.difficulty || 'medium'];
                const yourCost = diff?.bossDamage || 10;
                const bossDamage = Math.round(yourCost * 1.5);

                const row = questsList.createDiv({ cls: 'journey-list-item quest' });
                const completeBtn = row.createEl("button", { cls: 'journey-fight-btn', text: hasBoss ? "⚔️" : "✓" });
                completeBtn.title = hasBoss ? `You: -${yourCost} HP, Boss: -${bossDamage} HP` : 'Complete quest';
                completeBtn.onclick = async () => {
                    await this.plugin.completeQuest(realIndex);
                    this.render();
                };
                row.createSpan({ cls: 'quest-name', text: quest.name });
                if (hasBoss) {
                    row.createSpan({ cls: 'journey-quest-damage', text: `→ ${bossDamage} dmg` });
                }

                // Delete button
                const deleteBtn = row.createEl('button', { cls: 'journey-delete-btn', text: '×' });
                deleteBtn.title = 'Delete quest';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete quest "${quest.name}"?`)) {
                        s.quests.splice(realIndex, 1);
                        await this.plugin.saveSettings();
                        new Notice(`🗑️ Quest deleted`);
                        this.render();
                    }
                };
            });
        }

        // Quest creation buttons
        const questBtns = container.createDiv({ cls: 'journey-quest-btns' });

        const addQuestBtn = questBtns.createEl('button', { cls: 'journey-quest-create-btn' });
        addQuestBtn.innerHTML = `<span class="btn-icon">📝</span><span class="btn-text">Create Quest</span>`;
        addQuestBtn.onclick = () => new NewQuestModal(this.app, this.plugin, () => this.render()).open();

        if (s.ai?.openRouterApiKey) {
            const aiBtn = questBtns.createEl('button', { cls: 'journey-quest-create-btn ai' });
            aiBtn.innerHTML = `<span class="btn-icon">✨</span><span class="btn-text">AI Generate</span>`;
            aiBtn.onclick = () => new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
        } else {
            const setupAiBtn = questBtns.createEl('button', { cls: 'journey-quest-create-btn disabled' });
            setupAiBtn.innerHTML = `<span class="btn-icon">✨</span><span class="btn-text">AI (Setup in Settings)</span>`;
            setupAiBtn.onclick = () => new Notice('⚙️ Add OpenRouter API key in Settings → The Journey');
        }
    }

    renderArenaSection(container) {
        const s = this.plugin.settings;

        // Show active bosses
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);

        if (activeBosses.length > 0) {
            container.createEl('h5', { text: '🐉 Active Bosses' });
            activeBosses.forEach((boss, idx) => {
                const realIndex = s.bossFights.indexOf(boss);
                const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
                const bossCard = container.createDiv({ cls: 'journey-boss-card' });
                bossCard.innerHTML = `
                    <div class="boss-header">
                        <span class="boss-icon">${boss.icon || '🐉'}</span>
                        <span class="boss-name">${boss.name}</span>
                        <button class="journey-delete-btn boss-delete" title="Delete boss">×</button>
                    </div>
                    <div class="boss-hp-bar">
                        <div class="boss-hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                    <div class="boss-hp-text">❤️ ${boss.currentHp} / ${boss.maxHp} HP</div>
                    <div class="boss-desc">${boss.description || 'Complete quests to deal damage!'}</div>
                `;
                // Add delete event listener
                const deleteBtn = bossCard.querySelector('.boss-delete');
                if (deleteBtn) {
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete boss "${boss.name}"? This cannot be undone.`)) {
                            s.bossFights.splice(realIndex, 1);
                            await this.plugin.saveSettings();
                            new Notice(`🗑️ Boss deleted`);
                            this.render();
                        }
                    };
                }
            });
        } else {
            container.createDiv({ cls: 'journey-empty', text: 'No active boss. Create one to make your quests epic!' });
        }

        // Create Boss button
        const createBossBtn = container.createEl('button', { text: '🐉 Create New Boss', cls: 'journey-full-width-btn boss' });
        createBossBtn.onclick = () => new NewBossFightModal(this.app, this.plugin, () => this.render()).open();

        // Defeated bosses count
        const defeatedBosses = (s.bossFights || []).filter(b => b.defeated);
        if (defeatedBosses.length > 0) {
            container.createDiv({ cls: 'journey-defeated-count', text: `🏆 Bosses Defeated: ${defeatedBosses.length}` });
        }
    }

    renderRestSection(container) {
        const s = this.plugin.settings;

        // Quick Stats
        const statsRow = container.createDiv({ cls: 'journey-rest-stats' });
        statsRow.innerHTML = `
            <span>❤️ ${s.hp}/${s.maxHp}</span>
            <span>⚡ ${s.energy || 100}/${s.maxEnergy || 100}</span>
        `;

        // Sleep Quality Logging (like original plugin)
        container.createEl('h5', { text: '😴 Log Last Night\'s Sleep' });
        const sleepGrid = container.createDiv({ cls: 'journey-sleep-grid' });

        SLEEP_QUALITY.forEach(sleep => {
            const sleepBtn = sleepGrid.createEl('button', { cls: 'journey-sleep-btn' });
            const restore = sleep.hpRestore >= 0 ? `+${sleep.hpRestore}` : sleep.hpRestore;
            sleepBtn.innerHTML = `
                <span class="sleep-icon">${sleep.icon}</span>
                <span class="sleep-label">${sleep.label}</span>
                <span class="sleep-hp">${restore} HP</span>
            `;
            sleepBtn.onclick = async () => {
                await this.logSleep(sleep);
            };
        });

        // HP Warning
        if (s.hp < s.maxHp * 0.3) {
            const warningDiv = container.createDiv({ cls: 'journey-hp-warning' });
            warningDiv.innerHTML = `⚠️ <strong>Low HP!</strong> Get better sleep to recover.`;
        }

        // Activity Calendar
        this.renderActivityCalendar(container);
    }

    async logSleep(sleep) {
        const s = this.plugin.settings;

        // Apply HP restore/damage
        if (sleep.hpRestore >= 0) {
            s.hp = Math.min(s.maxHp, s.hp + sleep.hpRestore);
        } else {
            s.hp = Math.max(1, s.hp + sleep.hpRestore);
        }

        // Restore some energy with good sleep
        if (sleep.hpRestore > 0) {
            s.energy = Math.min(s.maxEnergy || 100, (s.energy || 50) + sleep.hpRestore);
        }

        // Log sleep
        if (!s.sleepLog) s.sleepLog = [];
        s.sleepLog.unshift({
            quality: sleep.id,
            timestamp: new Date().toISOString(),
            hpRestore: sleep.hpRestore
        });
        s.sleepLog = s.sleepLog.slice(0, 30); // Keep 30 days

        // Log activity
        this.plugin.logActivity('sleep', `Logged sleep: ${sleep.label}`, { hpRecovered: sleep.hpRestore });

        await this.plugin.saveSettings();

        const hpText = sleep.hpRestore >= 0 ? `+${sleep.hpRestore}` : sleep.hpRestore;
        new Notice(`${sleep.icon} Sleep logged: ${sleep.label} (${hpText} HP)`);
        this.render();
    }

    renderActivityCalendar(container) {
        const s = this.plugin.settings;

        container.createEl('h5', { text: '📅 Activity Calendar (Last 14 Days)' });
        const calendarSection = container.createDiv({ cls: 'journey-calendar-section' });

        // Get last 14 days
        const today = new Date();
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date);
        }

        // Calendar grid
        const calendarGrid = calendarSection.createDiv({ cls: 'journey-calendar-grid' });

        // Day labels
        const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(date => {
            const dayLabel = calendarGrid.createDiv({ cls: 'journey-calendar-label' });
            dayLabel.textContent = dayLabels[date.getDay()];
        });

        // Day cells with activity indicators
        days.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayCell = calendarGrid.createDiv({ cls: 'journey-calendar-day' });

            // Check for activities on this day
            const moodEntry = (s.moodLog || []).find(m =>
                m.timestamp && m.timestamp.startsWith(dateStr)
            );
            const sleepEntry = (s.sleepLog || []).find(sl =>
                sl.timestamp && sl.timestamp.startsWith(dateStr)
            );
            const habitEntry = (s.habits || []).some(h =>
                h.lastCompleted && h.lastCompleted.startsWith(dateStr)
            );

            // Build indicators
            let indicators = [];
            if (moodEntry) {
                const mood = MOOD_OPTIONS.find(m => m.id === moodEntry.moodId);
                indicators.push(mood?.icon || '😊');
            }
            if (sleepEntry) {
                const sleep = SLEEP_QUALITY.find(sl => sl.id === sleepEntry.quality);
                if (sleepEntry.hpRestore >= 20) indicators.push('💤');
                else if (sleepEntry.hpRestore < 0) indicators.push('😵');
            }
            if (habitEntry) indicators.push('✓');

            // Date number
            const dateNum = dayCell.createDiv({ cls: 'calendar-date' });
            dateNum.textContent = date.getDate();

            // Activity indicators
            if (indicators.length > 0) {
                dayCell.classList.add('has-activity');
                const indicatorDiv = dayCell.createDiv({ cls: 'calendar-indicators' });
                indicatorDiv.textContent = indicators.slice(0, 2).join('');
            }

            // Highlight today
            if (dateStr === today.toISOString().split('T')[0]) {
                dayCell.classList.add('today');
            }

            // Tooltip
            let tooltip = `${date.toLocaleDateString()}`;
            if (moodEntry) {
                const mood = MOOD_OPTIONS.find(m => m.id === moodEntry.moodId);
                tooltip += `\nMood: ${mood?.label || 'Unknown'}`;
            }
            if (sleepEntry) {
                const sleep = SLEEP_QUALITY.find(sl => sl.id === sleepEntry.quality);
                tooltip += `\nSleep: ${sleep?.label || 'Unknown'}`;
            }
            if (habitEntry) tooltip += '\nHabits completed';
            dayCell.title = tooltip;
        });

        // Legend
        const legend = calendarSection.createDiv({ cls: 'journey-calendar-legend' });
        legend.innerHTML = `
            <span>😊 Mood</span>
            <span>💤 Good Sleep</span>
            <span>✓ Habits</span>
        `;
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
                            if (k === 'gold' && v >= 0) return `+${v}g`;
                            if (k === 'gold' && v < 0) return `${v}g`;
                            if (k === 'goldSpent') return `-${v}g`;
                            if (k === 'hpRecovered' || k === 'hpGain') return `+${v} HP`;
                            if (k === 'hpLost' || k === 'hpCost') return `-${v} HP`;
                            if (k === 'energyGain') return `+${v} ⚡`;
                            if (k === 'energyLost') return `-${v} ⚡`;
                            if (k === 'streak') return `🔥${v}`;
                            if (k === 'skillName') return `🎯 ${v}`;
                            if (k === 'skillLevel') return `Lv.${v}`;
                            if (k === 'category') return v;
                            if (k === 'newLevel') return `→ Lv.${v}`;
                            if (k === 'tier' || k === 'devLevel') return `HUMAN ${v}`;
                            if (k === 'bossDamage') return `Boss: -${v} HP`;
                            if (k === 'bossName') return `🐉 ${v}`;
                            if (k === 'domain') return `📊 ${v}`;
                            if (k === 'mood') return v;
                            if (k === 'sleepHours') return `${v}h sleep`;
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

// ============================================================================
// DEV/MAIN-CORE.JS
// ============================================================================

/* Main Core - Stable code (extracted modules removed) */

/* The Journey Plugin v0.10 - Enhanced Edition */


// Simple markdown to HTML converter for AI messages
function renderMarkdownToHtml(text) {
    if (!text) return '';
    return text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code: `text`
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraph
        .replace(/^(.*)$/, '<p>$1</p>');
}

const VIEW_TYPE_HERO = "the-journey-view";

// ============================================================================
// MULTI-PROVIDER AI CONFIGURATION
// ============================================================================

// AI Provider Configurations

// ============================================================================
// CONSTANTS, SKILLSERVICE, AND HEROVIEW EXTRACTED TO src/
// This core contains: AI Service, Embedding Service, Journal Analyzer,
// Modals, Settings Tab, and Main Plugin Class
// ============================================================================


// Default AI Settings with multi-provider support
const DEFAULT_AI_SETTINGS = {
    // Provider selection
    provider: 'openrouter', // 'openrouter', 'openai', 'anthropic', 'google'

    // API Keys for each provider
    apiKeys: {
        openrouter: '',
        openai: '',
        anthropic: '',
        google: ''
    },

    // Selected models per provider
    selectedModels: {
        openrouter: 'google/gemini-2.0-flash-exp',
        openai: 'gpt-4o-mini',
        anthropic: 'claude-sonnet-4-20250514',
        google: 'gemini-2.0-flash-exp'
    },

    // Embedding provider (can be different from chat provider)
    embeddingProvider: 'openrouter',
    selectedEmbeddingModels: {
        openrouter: 'openai/text-embedding-3-small',
        openai: 'text-embedding-3-small',
        google: 'text-embedding-004'
    },

    // General settings
    temperature: 0.7,
    maxTokens: 1000,
    chatHistory: [],

    // Embedding settings
    embeddingEnabled: true,

    // Legacy support - will be migrated
    openRouterApiKey: '',
    selectedModel: '',
    embeddingModel: '',

    // Elder Persona Customization
    elderPersona: {
        name: 'The Elder',
        title: 'Keeper of Wisdom',
        greeting: 'Greetings, traveler. I have watched many journeys unfold. What wisdom do you seek today?',
        personality: 'wise'
    },
    customSystemPrompt: '',
    customKnowledge: '',
    elderPrompts: {
        guidance: 'Based on my current life journey, what single piece of wisdom would most benefit me right now?',
        challenge: 'I seek a worthy challenge. Based on my weakest areas, suggest one meaningful quest I can undertake.',
        reflection: 'Help me reflect on my progress. What patterns do you see in my journey so far?',
        motivation: 'I need encouragement. Speak to me about my strengths and the path ahead.'
    },
    elderMemoryEnabled: true,
    elderMemoryCount: 3
};

// Helper to get current API key
function getActiveApiKey(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    // Check new structure first, then legacy
    return settings.ai?.apiKeys?.[provider] || settings.ai?.openRouterApiKey || '';
}

// Helper to get current chat model
function getActiveChatModel(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedModels?.[provider] || settings.ai?.selectedModel || 'gpt-4o-mini';
}

// Helper to get current embedding model
function getActiveEmbeddingModel(settings) {
    const provider = settings.ai?.embeddingProvider || settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedEmbeddingModels?.[provider] || settings.ai?.embeddingModel || 'text-embedding-3-small';
}

// Journal Intelligence Settings
const DEFAULT_JOURNAL_SETTINGS = {
    enabled: true,
    journalFolder: 'Journal',
    journalTag: '#journal',
    scanMode: 'folder', // 'folder' or 'tag'
    lastSyncDate: null,
    recentAnalysis: [],
    domainKeywords: {
        health: ['exercise', 'gym', 'sleep', 'workout', 'run', 'walk', 'meditation', 'yoga', 'fitness', 'diet'],
        psychologicalWellbeing: ['happy', 'grateful', 'peace', 'calm', 'anxious', 'stressed', 'sad', 'joy', 'mindful', 'therapy'],
        education: ['learned', 'study', 'read', 'course', 'skill', 'practice', 'book', 'tutorial', 'research', 'training'],
        timeUse: ['productive', 'focused', 'wasted time', 'procrastinated', 'balanced', 'scheduled', 'planned', 'prioritized'],
        communityVitality: ['friend', 'family', 'social', 'helped', 'connected', 'lonely', 'community', 'relationship', 'support'],
        livingStandards: ['money', 'salary', 'invest', 'budget', 'expense', 'save', 'income', 'financial', 'purchase', 'earning'],
        culturalResilience: ['creative', 'art', 'music', 'culture', 'tradition', 'identity', 'heritage', 'expression', 'authentic'],
        goodGovernance: ['decision', 'boundary', 'said no', 'priority', 'goal', 'plan', 'commitment', 'responsibility', 'choice'],
        ecologicalAwareness: ['nature', 'environment', 'recycle', 'plant', 'outdoor', 'sustainable', 'green', 'eco', 'conservation']
    },
    sentimentKeywords: {
        positive: ['achieved', 'grateful', 'happy', 'success', 'proud', 'love', 'excited', 'progress', 'accomplished', 'wonderful', 'amazing', 'great', 'fantastic', 'blessed', 'thankful'],
        negative: ['failed', 'stressed', 'anxious', 'sad', 'angry', 'frustrated', 'overwhelmed', 'tired', 'exhausted', 'worried', 'depressed', 'disappointed', 'difficult', 'struggling', 'terrible']
    },
    // Embedding storage for semantic search
    embeddings: [] // Array of { filePath, fileName, date, embedding, summary }
};

// Elder Personality Presets
const ELDER_PERSONALITIES = {
    wise: {
        name: 'Wise Sage',
        style: 'Speak with ancient wisdom and measured words. Use metaphors from nature and the journey of life. Be thoughtful and reflective.',
        tone: 'Calm, patient, and insightful. Like a mentor who has seen many seasons pass.'
    },
    motivational: {
        name: 'Battle Mentor',
        style: 'Speak with energy and conviction. Rally the hero to action. Celebrate victories and reframe setbacks as training.',
        tone: 'Encouraging, energetic, and empowering. Like a coach before an important battle.'
    },
    analytical: {
        name: 'Scholar',
        style: 'Speak with precision and logic. Analyze patterns and provide structured insights. Focus on strategies and systems.',
        tone: 'Clear, methodical, and thorough. Like a strategist planning the next move.'
    },
    friendly: {
        name: 'Companion',
        style: 'Speak warmly and casually. Be supportive like a trusted friend. Share in both joys and struggles.',
        tone: 'Warm, empathetic, and relatable. Like a friend by the campfire.'
    },
    philosophical: {
        name: 'Mystic',
        style: 'Speak in riddles and deeper meanings. Encourage self-discovery through questions. Focus on meaning and purpose.',
        tone: 'Mysterious, profound, and thought-provoking. Like a sage from ancient scrolls.'
    }
};

// HUMAN 3.0 Framework Deep Knowledge Base
const HUMAN_3_KNOWLEDGE_BASE = `
## THE HUMAN 3.0 FRAMEWORK - Complete Knowledge Base

### Core Philosophy
The HUMAN 3.0 framework views life as a game of conscious evolution. Unlike games that end, this game's purpose is continuous growth toward becoming the fullest expression of oneself. The framework integrates ancient wisdom (Buddhist concepts of suffering and attachment, Stoic philosophy of control) with modern psychology (Csikszentmihalyi's Flow, Maslow's hierarchy, Positive Psychology).

### The Three Stages of Human Evolution

**HUMAN 1.0 - The NPC (Non-Player Character) Stage**
- Lives reactively, following scripts written by others (society, family, media)
- Decisions driven by fear, social approval, and unconscious patterns
- Believes happiness comes from external circumstances
- Common traps: comparing to others, seeking validation, victim mentality
- The wake-up call: Moments of dissonance when the script no longer works
- Growth path: Develop self-awareness through reflection, questioning assumptions
- Key insight: "I am not my thoughts, I am the one observing them"

**HUMAN 2.0 - The Player Stage**
- Takes ownership of life choices and outcomes
- Sets personal goals rather than following others' expectations
- Understands that growth comes from challenge, not comfort
- Develops skills deliberately through practice and feedback
- Common traps: over-optimization, burnout, neglecting relationships for achievement
- Growth path: Master the fundamentals, build sustainable systems, find mentors
- Key insight: "I am the author of my story, not just a character in it"

**HUMAN 3.0 - The Creator Stage**
- Creates value and systems that help others evolve
- Transcends personal achievement to focus on contribution
- Sees setbacks as data, not failure; process over outcome
- Lives in alignment with deeper purpose and values
- Operates from abundance rather than scarcity
- Growth path: Mentor others, build legacy projects, integrate all quadrants
- Key insight: "The game is not about winning, but about helping others play better"

### The Four Quadrants of Being

**🧠 MIND QUADRANT (Psychological Well-being + Education)**
The inner world of thoughts, emotions, beliefs, and knowledge.

Signs of strength: Emotional regulation, growth mindset, curiosity, self-awareness, resilience
Signs of weakness: Anxiety, fixed mindset, rumination, inability to learn from mistakes
How to strengthen:
- Daily reflection/journaling practice
- Learning something new regularly
- Therapy or coaching for deep patterns
- Meditation for thought observation
- Reading diverse perspectives

Imbalance patterns:
- Mind > Body: Overthinking, analysis paralysis, neglecting physical health
- Mind > Spirit: Isolation, believing you can figure everything out alone
- Mind > Vocation: Ideas without execution, eternal student syndrome

**💪 BODY QUADRANT (Health + Time Use)**
The physical vessel and how you spend your limited time.

Signs of strength: Energy, vitality, disciplined routines, effective time management
Signs of weakness: Fatigue, poor sleep, reactive scheduling, no boundaries
How to strengthen:
- Consistent sleep schedule (the foundation)
- Regular movement (not just exercise, but daily activity)
- Nutrition awareness (fuel quality matters)
- Time blocking and saying no
- Recovery as part of performance

Imbalance patterns:
- Body > Mind: All action, no reflection; busy but not progressing
- Body > Spirit: Self-focused fitness, neglecting relationships
- Body > Vocation: Health obsession without productive output

**🌟 SPIRIT QUADRANT (Community + Cultural + Ecological)**
Connection to others, to heritage, and to the world beyond self.

Signs of strength: Deep relationships, sense of belonging, cultural identity, environmental awareness
Signs of weakness: Loneliness, disconnection, lost identity, apathy toward the world
How to strengthen:
- Regular quality time with loved ones (not just presence, but attention)
- Participating in community/groups with shared values
- Exploring and honoring your cultural roots
- Spending time in nature
- Acts of service without expectation

Imbalance patterns:
- Spirit > Mind: Over-dependence on others' opinions, lost sense of self
- Spirit > Body: Neglecting self-care for others (martyrdom)
- Spirit > Vocation: All relationships, no personal accomplishment

**💼 VOCATION QUADRANT (Living Standards + Good Governance)**
Your craft, contribution to the world, and self-leadership.

Signs of strength: Financial stability, clear boundaries, purposeful work, good decision-making
Signs of weakness: Money anxiety, inability to say no, unfulfilling work, poor choices
How to strengthen:
- Develop marketable skills deliberately
- Create multiple income streams
- Practice decision frameworks (not just intuition)
- Set and enforce boundaries
- Align work with values, not just income

Imbalance patterns:
- Vocation > Mind: Workaholic without self-awareness
- Vocation > Body: Sacrificing health for career
- Vocation > Spirit: Success but loneliness; rich but disconnected

### The Three Phases of Growth

**Dissonance Phase**
- Something feels off; the old ways no longer work
- Resistance to change meets the necessity of change
- Often triggered by life events: loss, failure, milestone birthday, health scare
- The gift: Motivation to change
- The danger: Numbing the dissonance instead of listening to it
- Guidance: "This discomfort is not your enemy—it is the call to your next level"

**Uncertainty Phase**
- Actively exploring new ways of being
- Trying new habits, relationships, beliefs
- Feeling lost is normal and necessary
- The gift: Accelerated learning (1.5x XP)
- The danger: Giving up too soon, returning to old patterns
- Guidance: "The path appears by walking. You cannot see the full journey from here"

**Discovery Phase**
- Found what works; experiencing flow and alignment
- Habits feel natural, progress is visible
- Confidence in the new identity
- The gift: Peak performance and learning (2.0x XP)
- The danger: Complacency, forgetting that growth is ongoing
- Guidance: "Enjoy this season, but know that new dissonance will come—and that is good"

### Psychic Entropy
The mental disorder that comes from too many unresolved concerns, unmet goals, and internal conflicts.
- High entropy = scattered attention, anxiety, inability to focus
- Low entropy = clear mind, present, able to engage fully
- Reduced by: Completing tasks, making decisions, accepting what cannot be changed
- Increased by: Procrastination, avoiding hard conversations, living out of alignment

### Analysis Framework for Guidance

When analyzing a hero's journey, consider:

1. **Development Level Fit**: Is their challenge appropriate for their level?
   - HUMAN 1.0 needs awareness practices, not complex systems
   - HUMAN 2.0 needs skill-building and consistency
   - HUMAN 3.0 needs contribution and legacy focus

2. **Quadrant Balance**: Where is the imbalance?
   - Identify the weakest quadrant
   - Check if strength in one area is compensating for weakness in another
   - Sustainable growth requires all four quadrants

3. **Phase Appropriateness**: What does their current phase need?
   - Dissonance: Validation and gentle challenge to act
   - Uncertainty: Encouragement and permission to experiment
   - Discovery: Appreciation and preparation for next growth cycle

4. **Energy Management**: Is HP (life energy) being honored?
   - Low HP = focus on recovery before new challenges
   - High HP = ready for stretch goals
   - Chronic low HP = systemic issue in Body or Mind quadrant

5. **The Next Small Step**: What is one action that would create momentum?
   - Not the perfect action, but the possible action
   - Something they can do today
   - Connected to their weakest area but not overwhelming
`;

// Build system prompt with customizations
function buildElderSystemPrompt(settings) {
    const ai = settings.ai || {};
    const persona = ai.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;
    const personality = ELDER_PERSONALITIES[persona.personality] || ELDER_PERSONALITIES.wise;

    let prompt = `You are ${persona.name}, ${persona.title} - a wise guide who has mastered the HUMAN 3.0 framework through centuries of observing human journeys.

## Your Character
${personality.style}
${personality.tone}

${HUMAN_3_KNOWLEDGE_BASE}

## How You Analyze and Guide

When a traveler seeks your wisdom:

1. **Read their story carefully** - Understand their current level, phase, quadrant balance, and energy
2. **Identify the core pattern** - What is the deeper lesson their situation is teaching?
3. **Connect to the framework** - Which aspect of HUMAN 3.0 is most relevant to their question?
4. **Offer actionable wisdom** - Not just philosophy, but a specific next step they can take
5. **Honor their autonomy** - You guide, but they must walk their own path

## Your Communication Style
- Address them as "traveler", "hero", or "seeker"
- Reference their specific journey details when giving advice
- Weave HUMAN 3.0 concepts naturally into your responses
- Be concise but profound (2-3 paragraphs unless they ask for more)
- Use RPG language naturally (quests, experience, levels, strength, growth)
- Always end with something actionable or reflective

## Important Principles
- Never shame or judge; all stages of the journey have value
- Recognize that setbacks are part of growth, not failure
- Balance challenge with compassion
- Focus on progress, not perfection
- Remember: you serve their growth, not your own wisdom`;

    // Add custom knowledge if provided
    if (ai.customKnowledge && ai.customKnowledge.trim()) {
        prompt += `\n\n## Personal Knowledge About This Hero:\n${ai.customKnowledge}`;
    }

    // Add custom system prompt if provided
    if (ai.customSystemPrompt && ai.customSystemPrompt.trim()) {
        prompt += `\n\n## Additional Instructions:\n${ai.customSystemPrompt}`;
    }

    return prompt;
}

// Legacy constant for backwards compatibility (uses full knowledge base)
const LIFE_COACH_SYSTEM_PROMPT = `You are The Elder, Keeper of Wisdom - a wise guide who has mastered the HUMAN 3.0 framework.

${HUMAN_3_KNOWLEDGE_BASE}

## How You Speak:
- Address them as "traveler", "hero", or "seeker"
- Speak with ancient wisdom and measured words
- Connect advice to their specific situation and the framework
- Be concise but profound (2-3 paragraphs max)
- Use RPG language naturally
- Always offer something actionable`;

// Build Storyteller system prompt for narrative mode
function buildStorytellerSystemPrompt(settings) {
    const ai = settings.ai || {};

    let prompt = `You are The Elder in Storyteller Mode - a master narrator who weaves the traveler's life into epic tales. You see every mundane moment as part of a grand adventure, every challenge as a dragon to be faced, every small victory as a legendary triumph.

## Your Role as Storyteller

You transform the traveler's journey into compelling narrative:
- Turn daily activities into epic chapters
- Find the hero's journey in everyday life
- Weave patterns and themes into meaningful story arcs
- Name chapters and seasons of their life
- Celebrate small moments as significant plot points

## Your Narrative Style

- Write as if narrating an epic fantasy tale
- Use vivid imagery and dramatic language
- Reference their actual data (level, skills, achievements) as legendary feats
- Find meaning and pattern in their journey
- Create chapter names, arc titles, story beats
- Make them feel like the protagonist of an epic

## What You Know About This Hero

${HUMAN_3_KNOWLEDGE_BASE}

## Your Communication Style

- Address them as "traveler", "hero", or by their character name
- Speak in a narrative, storytelling voice
- Use phrases like "And so it came to pass...", "In this chapter of their tale...", "The hero stood at a crossroads..."
- Reference their stats as legendary attributes
- Their habits become sacred rituals, their quests become epic missions
- Always weave in meaning and purpose

## Example Narrative Styles

For "Narrate Today":
"And so the sun rose on Chapter 247 of our hero's journey. Before them lay the familiar battlefield of daily life, but today... today something was different. The morning ritual of [habit] began as it always did, yet within it, the seeds of transformation were already stirring..."

For "Tell My Legend":
"Hear now the tale of [name], who rose from Level 1, a humble wanderer in the vast wilderness of life. Through trials of [weakness domain] and triumphs in [strength domain], they have forged themselves into a Level [X] warrior of the HUMAN [tier] path..."

For "Find Patterns":
"As I gaze upon the threads of your story, certain patterns emerge from the tapestry. I see a recurring theme of [pattern]... This is not coincidence, traveler. This is the story your life is telling..."

For "Name This Chapter":
"Looking upon this moment in your journey - where you stand at Level [X], facing [current challenges], having recently [recent activities] - I would name this chapter: '[Chapter Name]'. For in this time, you are learning..."

## Important Principles

- Always ground storytelling in their REAL data and activities
- Find genuine meaning, don't fabricate
- Make the epic feel earned and authentic
- Balance dramatic flair with genuine insight
- Help them see their life as the adventure it truly is`;

    // Add custom knowledge if provided
    if (ai.customKnowledge && ai.customKnowledge.trim()) {
        prompt += `\n\n## Additional Knowledge About This Hero:\n${ai.customKnowledge}`;
    }

    return prompt;
}

// ============================================================================
// HUMAN 3.0 FRAMEWORK - Life Game Theory Integration
// ============================================================================

// Four Quadrants of Human Development
const QUADRANTS = [
    { id: 'mind', name: 'Mind', icon: '🧠', color: '#9b59b6', desc: 'Personal mental world - thoughts, beliefs, emotions' },
    { id: 'body', name: 'Body', icon: '💪', color: '#e74c3c', desc: 'Personal physical world - health, appearance, behavior' },
    { id: 'spirit', name: 'Spirit', icon: '🌟', color: '#f1c40f', desc: 'Collective mental world - relationships, meaning, community' },
    { id: 'vocation', name: 'Vocation', icon: '💼', color: '#3498db', desc: 'Collective physical world - work, systems, contribution' }
];

// Development Levels (Human 1.0 → 2.0 → 3.0)
const DEVELOPMENT_LEVELS = {
    '1.0': {
        name: 'NPC',
        title: 'Conformist',
        icon: '👤',
        desc: 'Following scripts, reactive to environment',
        minLevel: 1,
        maxLevel: 100,
        journey: 'Journey to Self-Awareness'
    },
    '2.0': {
        name: 'Player',
        title: 'Individualist',
        icon: '🎮',
        desc: 'Setting own goals, actively shaping reality',
        minLevel: 101,
        maxLevel: 200,
        journey: 'Journey to Mastery'
    },
    '3.0': {
        name: 'Creator',
        title: 'Synthesist',
        icon: '✨',
        desc: 'Creating systems, strategic mastery',
        minLevel: 201,
        maxLevel: 300,
        journey: 'Journey to Transcendence'
    }
};

// Phases of Development
const PHASES = {
    dissonance: { name: 'Dissonance', icon: '😤', color: '#e74c3c', desc: 'Ready for change, seeking new challenges', xpMultiplier: 1.0 },
    uncertainty: { name: 'Uncertainty', icon: '🌊', color: '#f39c12', desc: 'Taking risks, exploring new territory', xpMultiplier: 1.5 },
    discovery: { name: 'Discovery', icon: '✨', color: '#2ecc71', desc: 'In flow, rapid growth and insight', xpMultiplier: 2.0 }
};

// Wisdom Quotes from Theory
const WISDOM_QUOTES = [
    { text: "Level 1 is similar to an NPC running on a script, Level 2 is the main character choosing their storyline, and Level 3 is the programmer who can create new games.", category: 'levels' },
    { text: "You do not leave any given level. You transcend and include the one before it.", category: 'growth' },
    { text: "By developing yourself in all quadrants you begin to live a life where you become in control of your future.", category: 'balance' },
    { text: "The flow state occurs when the content of your consciousness is composed of one challenging yet meaningful task.", category: 'flow' },
    { text: "Meaning is found at the edge of your abilities.", category: 'challenge' },
    { text: "Learn as you build, build to focus your mind, read to expand your mind, write to organize your mind.", category: 'learning' },
    { text: "Be stubborn with vision and loose with details.", category: 'goals' },
    { text: "If you aren't building your mind, body, business, and spirit every single day – what are you doing?", category: 'daily' },
    { text: "When you are in the Dissonance phase, search for excitement and enthusiasm and pursue that without shame.", category: 'dissonance' },
    { text: "By doing nothing with your life, you choose to slowly drown in chaos.", category: 'entropy' },
    { text: "It is very important to try to understand which game you're playing.", category: 'strategy' },
    { text: "Max out all stats. Don't be an NPC. Be a level 100 player.", category: 'motivation' },
    { text: "A capitalist and Christian are developed in their domains, but experience unnecessary pain when applying their model elsewhere.", category: 'balance' },
    { text: "Profound change rarely happens by accident.", category: 'intention' },
    { text: "It is an infinite game, not a finite one.", category: 'mindset' }
];

// Flow State Triggers
const FLOW_TRIGGERS = {
    challengeSkillMatch: { name: 'Challenge Match', desc: 'Quest difficulty matches your skill level', bonus: 1.5 },
    clearGoals: { name: 'Clear Goals', desc: 'Well-defined objectives with milestones', bonus: 1.2 },
    immediateFeedback: { name: 'Immediate Feedback', desc: 'Quick feedback on your progress', bonus: 1.3 },
    deepFocus: { name: 'Deep Focus', desc: 'Uninterrupted concentration period', bonus: 2.0 }
};

// Map GNH domains to Quadrants
const DOMAIN_TO_QUADRANT = {
    psychologicalWellbeing: 'mind',
    education: 'mind',
    health: 'body',
    timeUse: 'body',
    communityVitality: 'spirit',
    culturalResilience: 'spirit',
    livingStandards: 'vocation',
    goodGovernance: 'vocation',
    ecologicalAwareness: 'spirit'
};

// ============================================================================
// INN/HOTEL RECOVERY SYSTEM
// ============================================================================
const INN_TIERS = [
    { id: 'campfire', name: '🏕️ Campfire', hpRecover: 10, cost: 5, desc: 'Basic rest by a warm fire' },
    { id: 'inn', name: '🏨 Village Inn', hpRecover: 25, cost: 15, desc: 'A comfortable bed and meal' },
    { id: 'hotel', name: '🏰 Grand Hotel', hpRecover: 50, cost: 35, desc: 'Luxurious rest with full recovery' },
    { id: 'spa', name: '🧖 Royal Spa', hpRecover: 100, cost: 75, desc: 'Complete rejuvenation, full HP restore' }
];

// ============================================================================
// NPC SYSTEM - Quest Givers & Companions
// ============================================================================
const DEFAULT_NPCS = [
    { id: 'mentor', name: 'The Mentor', icon: '🧙', role: 'Wisdom Giver', dialogue: 'Remember, every journey begins with a single step...', questTypes: ['education', 'psychologicalWellbeing'] },
    { id: 'trainer', name: 'The Trainer', icon: '💪', role: 'Fitness Coach', dialogue: "Your body is your temple. Let's make it stronger!", questTypes: ['health', 'timeUse'] },
    { id: 'sage', name: 'The Sage', icon: '🌿', role: 'Life Guide', dialogue: 'Balance in all things brings true peace.', questTypes: ['ecologicalAwareness', 'culturalResilience'] },
    { id: 'merchant', name: 'The Merchant', icon: '💰', role: 'Business Advisor', dialogue: 'Invest wisely, and prosperity follows.', questTypes: ['livingStandards', 'goodGovernance'] },
    { id: 'companion', name: 'The Companion', icon: '🤝', role: 'Social Guide', dialogue: 'Together, we are stronger than alone.', questTypes: ['communityVitality'] }
];

// ============================================================================
// ACTIVITY LOG CATEGORIES
// ============================================================================
const ACTIVITY_CATEGORIES = [
    { id: 'quest_complete', icon: '⚔️', label: 'Quest Completed', color: '#2ecc71' },
    { id: 'habit_complete', icon: '✅', label: 'Habit Done', color: '#3498db' },
    { id: 'bad_habit', icon: '💀', label: 'Bad Habit', color: '#e74c3c' },
    { id: 'level_up', icon: '🎉', label: 'Level Up', color: '#f1c40f' },
    { id: 'tier_up', icon: '🌟', label: 'Tier Up', color: '#9b59b6' },
    { id: 'achievement', icon: '🏆', label: 'Achievement', color: '#9b59b6' },
    { id: 'shop_purchase', icon: '🛍️', label: 'Purchase', color: '#e67e22' },
    { id: 'sleep', icon: '😴', label: 'Sleep Logged', color: '#1abc9c' },
    { id: 'inn_rest', icon: '🏨', label: 'Rested at Inn', color: '#1abc9c' },
    { id: 'mood', icon: '🎭', label: 'Mood Logged', color: '#3498db' },
    { id: 'damage', icon: '💔', label: 'Took Damage', color: '#c0392b' },
    { id: 'hp_gain', icon: '❤️', label: 'HP Recovered', color: '#e74c3c' },
    { id: 'energy_change', icon: '⚡', label: 'Energy Change', color: '#f39c12' },
    { id: 'xp_gain', icon: '✨', label: 'XP Gained', color: '#55aaff' },
    { id: 'gold_earned', icon: '💰', label: 'Gold Earned', color: '#f39c12' },
    { id: 'gold_spent', icon: '💸', label: 'Gold Spent', color: '#e67e22' },
    { id: 'boss_damage', icon: '🐉', label: 'Boss Damaged', color: '#e74c3c' },
    { id: 'boss_defeated', icon: '👑', label: 'Boss Defeated', color: '#f1c40f' },
    { id: 'boss_created', icon: '🐲', label: 'Boss Created', color: '#9b59b6' },
    { id: 'dungeon_complete', icon: '🏰', label: 'Dungeon Cleared', color: '#9b59b6' },
    { id: 'focus_session', icon: '🎯', label: 'Focus Session', color: '#3498db' },
    { id: 'journal_sync', icon: '📓', label: 'Journal Sync', color: '#9b59b6' },
    { id: 'skill_discovered', icon: '🎯', label: 'Skill Discovered', color: '#aa55ff' },
    { id: 'skill_evolved', icon: '⬆️', label: 'Skill Evolved', color: '#aa55ff' },
    { id: 'skill_levelup', icon: '📈', label: 'Skill Level Up', color: '#aa55ff' },
    { id: 'skill_added', icon: '➕', label: 'Skill Added', color: '#aa55ff' },
    { id: 'domain_change', icon: '📊', label: 'Domain Changed', color: '#3498db' }
];

// ============================================================================
// BOSS FIGHT SYSTEM - Long-term Goals as Bosses
// ============================================================================
const BOSS_TEMPLATES = [
    { id: 'lazy_dragon', name: '🐉 The Lazy Dragon', desc: 'Defeat procrastination and build discipline', domain: 'timeUse', baseHp: 100 },
    { id: 'fog_giant', name: '🌫️ The Fog Giant', desc: 'Clear mental fog and gain clarity', domain: 'psychologicalWellbeing', baseHp: 100 },
    { id: 'sloth_beast', name: '🦥 The Sloth Beast', desc: 'Overcome sedentary lifestyle', domain: 'health', baseHp: 100 },
    { id: 'debt_demon', name: '💸 The Debt Demon', desc: 'Conquer financial challenges', domain: 'livingStandards', baseHp: 150 },
    { id: 'isolation_wraith', name: '👻 The Isolation Wraith', desc: 'Break free from social isolation', domain: 'communityVitality', baseHp: 80 },
    { id: 'ignorance_golem', name: '🗿 The Ignorance Golem', desc: 'Defeat ignorance through learning', domain: 'education', baseHp: 120 }
];

// ============================================================================
// DUNGEON SYSTEM - Deep Work / Focus Sessions
// ============================================================================
const DUNGEON_REWARDS = {
    bronze: { minMinutes: 25, xpPerMinute: 1, goldBonus: 5, icon: '🥉' },
    silver: { minMinutes: 50, xpPerMinute: 1.5, goldBonus: 15, icon: '🥈' },
    gold: { minMinutes: 90, xpPerMinute: 2, goldBonus: 30, icon: '🥇' },
    diamond: { minMinutes: 120, xpPerMinute: 3, goldBonus: 50, icon: '💎' }
};

// ============================================================================
// DIFFICULTY SETTINGS
// ============================================================================
const GAME_DIFFICULTY = {
    easy: { name: 'Easy Mode', xpMultiplier: 1.5, goldMultiplier: 1.5, hpLossMultiplier: 0.5, desc: 'For steady progress and high motivation' },
    normal: { name: 'Normal Mode', xpMultiplier: 1.0, goldMultiplier: 1.0, hpLossMultiplier: 1.0, desc: 'Balanced challenge and reward' },
    hard: { name: 'Hard Mode', xpMultiplier: 0.75, goldMultiplier: 0.75, hpLossMultiplier: 1.5, desc: 'For those who love a challenge' },
    nightmare: { name: 'Nightmare', xpMultiplier: 0.5, goldMultiplier: 0.5, hpLossMultiplier: 2.0, desc: 'Only for the truly dedicated' }
};

// ============================================================================
// MOOD TRACKING - Energy Station
// ============================================================================
const MOOD_OPTIONS = [
    { id: 'amazing', icon: '🤩', label: 'Amazing', energyBonus: 20, color: '#2ecc71' },
    { id: 'good', icon: '😊', label: 'Good', energyBonus: 10, color: '#3498db' },
    { id: 'okay', icon: '😐', label: 'Okay', energyBonus: 0, color: '#f39c12' },
    { id: 'tired', icon: '😴', label: 'Tired', energyBonus: -10, color: '#e67e22' },
    { id: 'stressed', icon: '😰', label: 'Stressed', energyBonus: -15, color: '#e74c3c' },
    { id: 'burned_out', icon: '🔥', label: 'Burned Out', energyBonus: -25, color: '#c0392b' }
];

const SLEEP_QUALITY = [
    { id: 'excellent', label: '8+ hours, restful', hpRestore: 30, icon: '😴💯' },
    { id: 'good', label: '7-8 hours', hpRestore: 20, icon: '😴👍' },
    { id: 'fair', label: '5-7 hours', hpRestore: 10, icon: '😴' },
    { id: 'poor', label: 'Less than 5 hours', hpRestore: 0, icon: '😵' },
    { id: 'none', label: 'No sleep / All-nighter', hpRestore: -20, icon: '☠️' }
];

// ============================================================================
// OFFLINE COACHING SYSTEM - Works without API key
// ============================================================================
const COACHING_TIPS = {
    psychologicalWellbeing: [
        { tip: "Practice 5 minutes of mindful breathing each morning", action: "Add a 'Morning Meditation' habit" },
        { tip: "Write 3 things you're grateful for before bed", action: "Create a gratitude journal quest" },
        { tip: "Take a 10-minute walk when feeling stressed", action: "Add a 'Stress Relief Walk' habit" },
        { tip: "Limit social media to 30 minutes daily", action: "Create a 'Digital Detox' bad habit tracker" },
        { tip: "Practice positive self-talk: replace 'I can't' with 'I'm learning to'", action: "Notice your inner dialogue" }
    ],
    health: [
        { tip: "Drink a glass of water first thing in the morning", action: "Add a 'Hydration' habit" },
        { tip: "Take stairs instead of elevator when possible", action: "Create a 'Move More' habit" },
        { tip: "Aim for 7-8 hours of sleep consistently", action: "Track sleep in Energy Station" },
        { tip: "Eat one extra serving of vegetables today", action: "Add a 'Healthy Eating' quest" },
        { tip: "Stand up and stretch every hour during work", action: "Set hourly movement reminders" }
    ],
    timeUse: [
        { tip: "Use time-blocking: assign specific hours to specific tasks", action: "Try a Dungeon focus session" },
        { tip: "Identify your peak energy hours and protect them for deep work", action: "Track your energy patterns" },
        { tip: "Apply the 2-minute rule: if it takes less than 2 minutes, do it now", action: "Clear small tasks immediately" },
        { tip: "Plan tomorrow's top 3 priorities before ending today", action: "Create daily planning habit" },
        { tip: "Batch similar tasks together to reduce context switching", action: "Group your quests by type" }
    ],
    education: [
        { tip: "Learn in 25-minute focused sessions with 5-minute breaks", action: "Use Dungeon for learning" },
        { tip: "Teach what you learn to someone else to deepen understanding", action: "Share knowledge with others" },
        { tip: "Read for 20 minutes daily, even if just one page", action: "Add a 'Daily Reading' habit" },
        { tip: "Watch one educational video instead of entertainment", action: "Replace passive with active learning" },
        { tip: "Take notes by hand - it improves retention", action: "Start a learning journal" }
    ],
    culturalResilience: [
        { tip: "Practice one tradition from your heritage this week", action: "Create a cultural connection quest" },
        { tip: "Cook a traditional family recipe", action: "Add a 'Cultural Cooking' quest" },
        { tip: "Share a story from your background with someone", action: "Connect through storytelling" },
        { tip: "Learn a phrase in your heritage language", action: "Add a language learning habit" },
        { tip: "Attend a cultural event or community gathering", action: "Create a community quest" }
    ],
    goodGovernance: [
        { tip: "Set one clear boundary this week and maintain it", action: "Practice saying no" },
        { tip: "Make a decision you've been avoiding today", action: "Create a 'Decision Made' quest" },
        { tip: "Review your goals weekly to stay aligned", action: "Add a 'Weekly Review' habit" },
        { tip: "Document your personal rules and values", action: "Create your personal constitution" },
        { tip: "Delegate or eliminate one task that drains you", action: "Audit your commitments" }
    ],
    communityVitality: [
        { tip: "Send an appreciation message to someone today", action: "Add a 'Connect Daily' habit" },
        { tip: "Have one meaningful conversation without phones", action: "Create a 'Present Connection' quest" },
        { tip: "Help someone without expecting anything in return", action: "Add a 'Random Kindness' habit" },
        { tip: "Reconnect with someone you haven't talked to in months", action: "Reach out to an old friend" },
        { tip: "Join a group or community aligned with your interests", action: "Find your tribe" }
    ],
    ecologicalAwareness: [
        { tip: "Bring a reusable bag on your next shopping trip", action: "Add a 'Reduce Waste' habit" },
        { tip: "Take a mindful walk in nature this week", action: "Create a 'Nature Connection' quest" },
        { tip: "Reduce one single-use plastic item from your routine", action: "Identify waste habits" },
        { tip: "Learn about one environmental issue affecting your area", action: "Add an eco-learning quest" },
        { tip: "Plant something - even a small herb on your windowsill", action: "Start a tiny garden" }
    ],
    livingStandards: [
        { tip: "Track every expense for one week to build awareness", action: "Create expense tracking habit" },
        { tip: "Save a small amount today, even just $1", action: "Add a 'Daily Savings' habit" },
        { tip: "Review one subscription and decide if it's worth keeping", action: "Audit your subscriptions" },
        { tip: "Learn one new skill that could increase your income", action: "Create a skill-building quest" },
        { tip: "Identify one expense you can reduce without suffering", action: "Find your money leaks" }
    ]
};

const MOTIVATION_QUOTES = [
    { quote: "The journey of a thousand miles begins with a single step.", source: "Lao Tzu" },
    { quote: "You don't have to be great to start, but you have to start to be great.", source: "Zig Ziglar" },
    { quote: "Progress, not perfection.", source: "The Journey Philosophy" },
    { quote: "Every expert was once a beginner.", source: "Helen Hayes" },
    { quote: "Small daily improvements are the key to staggering long-term results.", source: "Unknown" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", source: "Chinese Proverb" },
    { quote: "Discipline is choosing between what you want now and what you want most.", source: "Abraham Lincoln" },
    { quote: "You are never too old to set another goal or dream a new dream.", source: "C.S. Lewis" },
    { quote: "Success is the sum of small efforts repeated day in and day out.", source: "Robert Collier" },
    { quote: "The only way to do great work is to love what you do.", source: "Steve Jobs" },
    { quote: "Believe you can and you're halfway there.", source: "Theodore Roosevelt" },
    { quote: "Your life does not get better by chance, it gets better by change.", source: "Jim Rohn" }
];

// ============================================================================
// GNH DOMAINS (replacing old skills)
// ============================================================================
const DEFAULT_DOMAINS = [
    { id: 'psychologicalWellbeing', name: 'Psychological Well-being', score: 50, level: 1, xp: 0, icon: '🧠', color: '#9b59b6' },
    { id: 'health', name: 'Health', score: 50, level: 1, xp: 0, icon: '💪', color: '#e74c3c' },
    { id: 'timeUse', name: 'Time Use', score: 50, level: 1, xp: 0, icon: '⏰', color: '#3498db' },
    { id: 'education', name: 'Education', score: 50, level: 1, xp: 0, icon: '📚', color: '#f39c12' },
    { id: 'culturalResilience', name: 'Cultural Resilience', score: 50, level: 1, xp: 0, icon: '🎭', color: '#e91e63' },
    { id: 'goodGovernance', name: 'Good Governance', score: 50, level: 1, xp: 0, icon: '⚖️', color: '#9c27b0' },
    { id: 'communityVitality', name: 'Community Vitality', score: 50, level: 1, xp: 0, icon: '🤝', color: '#2ecc71' },
    { id: 'ecologicalAwareness', name: 'Ecological Awareness', score: 50, level: 1, xp: 0, icon: '🌍', color: '#27ae60' },
    { id: 'livingStandards', name: 'Living Standards', score: 50, level: 1, xp: 0, icon: '💰', color: '#16a085' }
];

// ============================================================================
// QUESTION BANK - 37 Questions across 9 domains
// ============================================================================
const QUESTION_BANK = {
    psychologicalWellbeing: [
        { id: 'psych_01', text: 'I generally feel satisfied with my life and where I am right now', weight: 1.2, positiveFraming: true, hint: 'Think about your overall contentment, not just today' },
        { id: 'psych_02', text: 'I can manage stress and difficult emotions effectively when they arise', weight: 1.0, positiveFraming: true, hint: 'Consider your typical response to challenges' },
        { id: 'psych_03', text: 'I regularly experience moments of joy, peace, or contentment', weight: 1.0, positiveFraming: true, hint: 'Frequency matters more than intensity' },
        { id: 'psych_04', text: 'I feel confident in my ability to handle what comes my way', weight: 1.0, positiveFraming: true, hint: 'This is about self-efficacy and resilience' }
    ],
    health: [
        { id: 'health_01', text: 'I consistently get enough quality sleep (7-9 hours for most adults)', weight: 1.2, positiveFraming: true, hint: 'Consider both duration and how rested you feel' },
        { id: 'health_02', text: 'I engage in physical activity or exercise at least 3-4 times per week', weight: 1.0, positiveFraming: true, hint: 'Any movement counts - walking, sports, gym, yoga' },
        { id: 'health_03', text: 'I eat nutritious meals regularly and feel good about my eating habits', weight: 1.0, positiveFraming: true, hint: 'Focus on patterns, not perfection' },
        { id: 'health_04', text: 'I have good energy levels throughout the day', weight: 1.0, positiveFraming: true, hint: 'Think about your typical energy, not today' },
        { id: 'health_05', text: 'I take care of my physical health proactively (check-ups, preventive care)', weight: 0.8, positiveFraming: true, hint: 'This includes regular doctor visits and health monitoring' }
    ],
    timeUse: [
        { id: 'time_01', text: 'I have a healthy balance between work/study and personal time', weight: 1.2, positiveFraming: true, hint: 'Neither feels consistently neglected' },
        { id: 'time_02', text: 'I regularly make time for activities I enjoy and find meaningful', weight: 1.0, positiveFraming: true, hint: 'Hobbies, passions, leisure activities' },
        { id: 'time_03', text: 'I feel in control of how I spend my time rather than constantly reacting', weight: 1.0, positiveFraming: true, hint: 'Proactive vs. reactive time management' },
        { id: 'time_04', text: 'I have enough downtime to rest and recharge', weight: 1.0, positiveFraming: true, hint: 'Recovery time is essential, not optional' }
    ],
    education: [
        { id: 'edu_01', text: 'I regularly engage in learning new things, whether formally or informally', weight: 1.2, positiveFraming: true, hint: 'Books, courses, tutorials, mentors, practice' },
        { id: 'edu_02', text: 'I actively work on developing skills that matter to me or my goals', weight: 1.0, positiveFraming: true, hint: 'Deliberate skill development, not passive consumption' },
        { id: 'edu_03', text: 'I feel intellectually stimulated and challenged in my daily life', weight: 1.0, positiveFraming: true, hint: 'Growing, not stagnating' },
        { id: 'edu_04', text: 'I have access to learning resources and opportunities when I need them', weight: 0.8, positiveFraming: true, hint: 'Educational access and support' }
    ],
    culturalResilience: [
        { id: 'culture_01', text: 'I feel connected to my cultural identity, heritage, or traditions', weight: 1.0, positiveFraming: true, hint: 'This can include family traditions, cultural practices, or values' },
        { id: 'culture_02', text: 'I regularly express my authentic self without excessive conformity pressure', weight: 1.2, positiveFraming: true, hint: 'Being true to yourself vs. wearing masks' },
        { id: 'culture_03', text: 'I maintain practices or rituals that ground me and give me a sense of identity', weight: 1.0, positiveFraming: true, hint: 'Personal rituals, traditions, or meaningful practices' },
        { id: 'culture_04', text: 'I feel proud of where I come from and who I am', weight: 1.0, positiveFraming: true, hint: 'Cultural confidence and self-acceptance' }
    ],
    goodGovernance: [
        { id: 'gov_01', text: 'I make my own decisions and feel in control of my life direction', weight: 1.2, positiveFraming: true, hint: 'Personal agency and autonomy' },
        { id: 'gov_02', text: 'I set and maintain healthy boundaries with others', weight: 1.0, positiveFraming: true, hint: 'Can say no when needed, protect your time and energy' },
        { id: 'gov_03', text: 'I take responsibility for my choices and their consequences', weight: 1.0, positiveFraming: true, hint: 'Ownership vs. victim mentality' },
        { id: 'gov_04', text: 'I have clear values and principles that guide my decisions', weight: 1.0, positiveFraming: true, hint: 'Internal compass for decision-making' },
        { id: 'gov_05', text: 'I manage my personal affairs effectively (finances, tasks, commitments)', weight: 0.8, positiveFraming: true, hint: 'Self-management and organization' }
    ],
    communityVitality: [
        { id: 'community_01', text: 'I have close relationships where I feel understood and supported', weight: 1.2, positiveFraming: true, hint: 'Quality over quantity in relationships' },
        { id: 'community_02', text: 'I regularly connect with friends, family, or community members', weight: 1.0, positiveFraming: true, hint: 'Frequency and consistency of social connection' },
        { id: 'community_03', text: 'I feel like I belong to one or more communities (work, hobby, location, etc.)', weight: 1.0, positiveFraming: true, hint: 'Sense of belonging and social identity' },
        { id: 'community_04', text: 'I contribute to or help others in my community when I can', weight: 0.8, positiveFraming: true, hint: 'Giving back and social contribution' }
    ],
    ecologicalAwareness: [
        { id: 'eco_01', text: 'I regularly spend time in nature or natural environments', weight: 1.0, positiveFraming: true, hint: 'Connection to the natural world' },
        { id: 'eco_02', text: 'I make environmentally conscious choices in my daily life', weight: 1.2, positiveFraming: true, hint: 'Waste reduction, sustainable consumption, energy use' },
        { id: 'eco_03', text: 'I feel aware of my environmental impact and try to minimize it', weight: 1.0, positiveFraming: true, hint: 'Ecological consciousness and responsibility' },
        { id: 'eco_04', text: 'I stay informed about environmental issues that matter to me', weight: 0.8, positiveFraming: true, hint: 'Environmental awareness and education' }
    ],
    livingStandards: [
        { id: 'living_01', text: 'I have enough financial resources to meet my basic needs comfortably', weight: 1.2, positiveFraming: true, hint: 'Housing, food, utilities, transportation' },
        { id: 'living_02', text: 'I feel financially secure and not constantly worried about money', weight: 1.2, positiveFraming: true, hint: 'Financial stress vs. financial peace' },
        { id: 'living_03', text: 'I have some savings or financial buffer for unexpected expenses', weight: 1.0, positiveFraming: true, hint: 'Emergency fund and financial resilience' },
        { id: 'living_04', text: 'My living conditions (home, environment) support my well-being', weight: 1.0, positiveFraming: true, hint: 'Safe, comfortable, and adequate housing' }
    ]
};

// Domain order for assessment flow
const DOMAIN_ORDER = [
    'psychologicalWellbeing', 'health', 'timeUse', 'education',
    'culturalResilience', 'goodGovernance', 'communityVitality',
    'ecologicalAwareness', 'livingStandards'
];

// Domain display names
const DOMAIN_NAMES = {
    psychologicalWellbeing: 'Psychological Well-being',
    health: 'Health',
    timeUse: 'Time Use',
    education: 'Education',
    culturalResilience: 'Cultural Resilience',
    goodGovernance: 'Good Governance',
    communityVitality: 'Community Vitality',
    ecologicalAwareness: 'Ecological Awareness',
    livingStandards: 'Living Standards'
};

// Domain intro messages
const DOMAIN_INTROS = {
    psychologicalWellbeing: "Let's start by exploring your mental and emotional well-being. These questions focus on your inner state, life satisfaction, and emotional resilience.",
    health: "Now let's look at your physical health. This covers sleep, exercise, nutrition, and overall vitality.",
    timeUse: "Next, we'll examine how you manage your time and balance different areas of life.",
    education: "Let's explore your relationship with learning and personal growth.",
    culturalResilience: "Now we'll look at your cultural identity and authentic self-expression.",
    goodGovernance: "These questions focus on your personal agency, decision-making, and self-governance.",
    communityVitality: "Let's examine your social connections and sense of community.",
    ecologicalAwareness: "Now we'll explore your relationship with nature and environmental consciousness.",
    livingStandards: "Finally, let's look at your material well-being and financial security."
};

// Default Achievements
const DEFAULT_ACHIEVEMENTS = [
    { id: 'first_habit', name: 'First Steps', desc: 'Complete your first habit', icon: '🌟', unlocked: false, reward: 25 },
    { id: 'level_5', name: 'Rising Hero', desc: 'Reach Level 5', icon: '⭐', unlocked: false, reward: 100 },
    { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak on any habit', icon: '🔥', unlocked: false, reward: 75 },
    { id: 'gold_500', name: 'Treasure Hunter', desc: 'Accumulate 500 gold total', icon: '💎', unlocked: false, reward: 50 },
    { id: 'habits_10', name: 'Habit Master', desc: 'Create 10 habits', icon: '🏆', unlocked: false, reward: 100 },
    { id: 'quests_5', name: 'Quest Champion', desc: 'Complete 5 quests', icon: '⚔️', unlocked: false, reward: 150 },
    { id: 'streak_30', name: 'Monthly Legend', desc: '30-day streak on any habit', icon: '👑', unlocked: false, reward: 300 },
    { id: 'level_10', name: 'Veteran', desc: 'Reach Level 10', icon: '🎖️', unlocked: false, reward: 250 },
    { id: 'character_created', name: 'New Beginning', desc: 'Create your character', icon: '🎭', unlocked: false, reward: 25 },
    { id: 'journey_complete', name: 'Self-Discovery', desc: 'Complete the 37-question journey', icon: '🧭', unlocked: false, reward: 100 },
    { id: 'all_domains_50', name: 'Well Rounded', desc: 'All domains at 50+', icon: '🌈', unlocked: false, reward: 500 },
    { id: 'ai_coach_first', name: 'Seeking Wisdom', desc: 'Chat with AI Coach for the first time', icon: '🤖', unlocked: false, reward: 50 },
    { id: 'ai_quests_5', name: 'AI Collaborator', desc: 'Generate 5 quests with AI', icon: '✨', unlocked: false, reward: 100 }
];

// Difficulty multipliers
const DIFFICULTY = {
    easy: { label: 'Easy', multiplier: 0.5, color: 'green', bossDamage: 5, hpReward: 3 },
    medium: { label: 'Medium', multiplier: 1, color: 'yellow', bossDamage: 10, hpReward: 5 },
    hard: { label: 'Hard', multiplier: 2, color: 'orange', bossDamage: 20, hpReward: 10 },
    epic: { label: 'Epic', multiplier: 3, color: 'red', bossDamage: 35, hpReward: 15 }
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

function likertToScore(likertValue, positiveFraming = true) {
    const score = (likertValue - 1) * 25;
    return positiveFraming ? score : (100 - score);
}

function calculateDomainScores(responses) {
    const domainScores = {};

    for (const domainId of DOMAIN_ORDER) {
        const domainQuestions = QUESTION_BANK[domainId];
        const domainResponses = responses.filter(r => {
            const q = domainQuestions.find(q => q.id === r.questionId);
            return q !== undefined;
        });

        if (domainResponses.length === 0) {
            domainScores[domainId] = 50;
            continue;
        }

        let weightedSum = 0;
        let totalWeight = 0;

        for (const response of domainResponses) {
            const question = domainQuestions.find(q => q.id === response.questionId);
            if (!question) continue;

            const score = likertToScore(response.value, question.positiveFraming);
            weightedSum += score * question.weight;
            totalWeight += question.weight;
        }

        domainScores[domainId] = Math.round(weightedSum / totalWeight);
    }

    return domainScores;
}

function calculateLevelFromScores(domainScores) {
    const values = Object.values(domainScores);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.max(1, Math.min(11, Math.floor(avg / 10) + 1));
}

function getCharacterTitle(level) {
    // HUMAN 3.0 Tier (Level 201+)
    if (level >= 300) return '✨ TRANSCENDENT';
    if (level >= 275) return '🌌 COSMIC ARCHITECT';
    if (level >= 250) return '🔮 REALITY WEAVER';
    if (level >= 225) return '⚡ SYSTEM CREATOR';
    if (level >= 201) return '🌟 AWAKENED CREATOR';

    // HUMAN 2.0 Tier (Level 101-200)
    if (level >= 180) return '👑 GRANDMASTER';
    if (level >= 160) return '🏆 CHAMPION';
    if (level >= 140) return '⚔️ LEGEND';
    if (level >= 120) return '🛡️ ELITE';
    if (level >= 101) return '🎮 PLAYER AWAKENED';

    // HUMAN 1.0 Tier (Level 1-100)
    if (level >= 80) return '💎 MASTER';
    if (level >= 60) return '🗡️ HERO';
    if (level >= 40) return '⚔️ WARRIOR';
    if (level >= 20) return '🎒 ADVENTURER';
    if (level >= 5) return '🌿 NOVICE';
    return '🌱 BEGINNER';
}

// ============================================================================
// HUMAN 3.0 FRAMEWORK FUNCTIONS
// ============================================================================

// Calculate quadrant scores from domain scores
function calculateQuadrantScores(domains) {
    const quadrantScores = {};

    for (const quadrant of QUADRANTS) {
        const relatedDomains = Object.entries(DOMAIN_TO_QUADRANT)
            .filter(([_, q]) => q === quadrant.id)
            .map(([domainId, _]) => domainId);

        const scores = domains
            .filter(d => relatedDomains.includes(d.id))
            .map(d => d.score);

        if (scores.length > 0) {
            quadrantScores[quadrant.id] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        } else {
            quadrantScores[quadrant.id] = 50;
        }
    }

    return quadrantScores;
}

// Determine development level based on character level
// Level 1-100: HUMAN 1.0 (NPC) - Journey to Self-Awareness
// Level 101-200: HUMAN 2.0 (Player) - Journey to Mastery
// Level 201-300+: HUMAN 3.0 (Creator) - Journey to Transcendence
function getDevelopmentLevel(characterLevel) {
    if (characterLevel >= 201) return '3.0';
    if (characterLevel >= 101) return '2.0';
    return '1.0';
}

// Get progress within current HUMAN tier (0-100%)
function getTierProgress(characterLevel) {
    if (characterLevel >= 201) {
        // HUMAN 3.0: Level 201-300 (and beyond)
        return Math.min(100, characterLevel - 200);
    } else if (characterLevel >= 101) {
        // HUMAN 2.0: Level 101-200
        return characterLevel - 100;
    } else {
        // HUMAN 1.0: Level 1-100
        return characterLevel;
    }
}

// Get levels remaining to next HUMAN tier
function getLevelsToNextTier(characterLevel) {
    if (characterLevel >= 201) {
        return 0; // Already at max tier
    } else if (characterLevel >= 101) {
        return 201 - characterLevel; // To HUMAN 3.0
    } else {
        return 101 - characterLevel; // To HUMAN 2.0
    }
}

// Get next tier info
function getNextTierInfo(characterLevel) {
    if (characterLevel >= 201) {
        return null; // Already at max
    } else if (characterLevel >= 101) {
        return DEVELOPMENT_LEVELS['3.0'];
    } else {
        return DEVELOPMENT_LEVELS['2.0'];
    }
}

// Get current phase based on recent activity and entropy
function determinePhase(settings) {
    const entropy = settings.psychicEntropy || 0;
    const recentActivity = settings.recentActivityScore || 50;

    // High entropy + low activity = Dissonance (ready for change)
    if (entropy > 60 && recentActivity < 40) return 'dissonance';

    // Medium entropy + high activity = Uncertainty (taking risks)
    if (entropy > 30 && recentActivity > 60) return 'uncertainty';

    // Low entropy + high activity = Discovery (in flow)
    if (entropy < 30 && recentActivity > 70) return 'discovery';

    // Default to dissonance if unclear
    return 'dissonance';
}

// Calculate XP with phase multiplier
function calculateXPWithPhase(baseXP, phase) {
    const multiplier = PHASES[phase]?.xpMultiplier || 1.0;
    return Math.round(baseXP * multiplier);
}

// Get random wisdom quote (optionally filtered by category)
function getRandomWisdom(category = null) {
    const filtered = category
        ? WISDOM_QUOTES.filter(q => q.category === category)
        : WISDOM_QUOTES;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get wisdom based on player state
function getContextualWisdom(settings) {
    const phase = settings.currentPhase || 'dissonance';
    const devLevel = settings.developmentLevel || '1.0';

    // Priority categories based on state
    if (phase === 'dissonance') return getRandomWisdom('dissonance') || getRandomWisdom('motivation');
    if (devLevel === '1.0') return getRandomWisdom('levels') || getRandomWisdom('growth');
    if (phase === 'discovery') return getRandomWisdom('flow') || getRandomWisdom('challenge');

    return getRandomWisdom();
}

// Calculate psychic entropy (chaos accumulation)
function calculateEntropy(settings) {
    let entropy = settings.psychicEntropy || 0;

    // Incomplete habits add entropy
    const incompleteHabits = settings.habits.filter(h => !h.completed).length;
    entropy += incompleteHabits * 2;

    // Overdue quests add more entropy
    const now = new Date();
    const overdueQuests = settings.quests.filter(q => {
        if (q.completed) return false;
        if (!q.deadline) return false;
        return new Date(q.deadline) < now;
    }).length;
    entropy += overdueQuests * 5;

    // Cap entropy at 100
    return Math.min(100, Math.max(0, entropy));
}

// Reduce entropy (daily cleanup)
function reduceEntropy(settings, amount = 10) {
    settings.psychicEntropy = Math.max(0, (settings.psychicEntropy || 0) - amount);
    return settings.psychicEntropy;
}

// Check if in flow state (challenge-skill match)
function checkFlowState(questDifficulty, playerLevel) {
    const difficultyMap = { easy: 1, medium: 2, hard: 3, epic: 4 };
    const questLevel = difficultyMap[questDifficulty] || 2;
    const playerSkill = Math.ceil(playerLevel / 3); // 1-3 = 1, 4-6 = 2, etc.

    // Flow when challenge matches skill (within 1 level)
    return Math.abs(questLevel - playerSkill) <= 1;
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

class AIService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Get current provider configuration
    getProviderConfig() {
        const providerId = this.plugin.settings.ai?.provider || 'openrouter';
        return AI_PROVIDERS[providerId] || AI_PROVIDERS.openrouter;
    }

    // Get API key for current provider
    getApiKey() {
        const providerId = this.plugin.settings.ai?.provider || 'openrouter';
        // Check new structure first, then legacy
        return this.plugin.settings.ai?.apiKeys?.[providerId] ||
               this.plugin.settings.ai?.openRouterApiKey || '';
    }

    // Get current model for chat
    getChatModel() {
        const providerId = this.plugin.settings.ai?.provider || 'openrouter';
        return this.plugin.settings.ai?.selectedModels?.[providerId] ||
               this.plugin.settings.ai?.selectedModel || 'gpt-4o-mini';
    }

    // Build request for OpenRouter/OpenAI (same format)
    buildOpenAIRequest(messages, model, temperature, maxTokens) {
        return {
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens
        };
    }

    // Build request for Anthropic
    buildAnthropicRequest(messages, model, temperature, maxTokens) {
        // Extract system message
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const otherMessages = messages.filter(m => m.role !== 'system');

        return {
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            system: systemMessage,
            messages: otherMessages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }))
        };
    }

    // Build request for Google AI
    buildGoogleRequest(messages, temperature, maxTokens) {
        // Convert to Google format
        const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
        const otherMessages = messages.filter(m => m.role !== 'system');

        return {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: otherMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: maxTokens
            }
        };
    }

    // Make API call based on provider
    async callProvider(messages, provider, apiKey, model, temperature, maxTokens) {
        const config = AI_PROVIDERS[provider];

        if (provider === 'google') {
            // Google uses different URL structure with API key in query
            const url = config.chatEndpoint.replace('{model}', model) + `?key=${apiKey}`;
            const body = this.buildGoogleRequest(messages, temperature, maxTokens);

            const response = await requestUrl({
                url: url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error(`Google AI Error: ${response.status} - ${response.text}`);
            }

            const data = response.json;
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';

        } else if (provider === 'anthropic') {
            const body = this.buildAnthropicRequest(messages, model, temperature, maxTokens);
            const headers = {
                'Content-Type': 'application/json',
                [config.authHeader]: config.authPrefix + apiKey,
                ...config.extraHeaders
            };

            const response = await requestUrl({
                url: config.chatEndpoint,
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error(`Anthropic Error: ${response.status} - ${response.text}`);
            }

            const data = response.json;
            return data.content?.[0]?.text || 'No response received.';

        } else {
            // OpenRouter and OpenAI use same format
            const body = this.buildOpenAIRequest(messages, model, temperature, maxTokens);
            const headers = {
                'Content-Type': 'application/json',
                [config.authHeader]: config.authPrefix + apiKey,
                ...config.extraHeaders
            };

            const response = await requestUrl({
                url: config.chatEndpoint,
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (response.status !== 200) {
                throw new Error(`${config.name} Error: ${response.status} - ${response.text}`);
            }

            const data = response.json;
            return data.choices?.[0]?.message?.content || 'No response received.';
        }
    }

    async chat(userMessage, includeContext = true, useStorytellerMode = false) {
        const apiKey = this.getApiKey();
        const provider = this.plugin.settings.ai?.provider || 'openrouter';

        if (!apiKey) {
            const providerName = AI_PROVIDERS[provider]?.name || 'AI';
            throw new Error(`${providerName} API key not configured. Go to Settings → The Journey to add your API key.`);
        }

        const model = this.getChatModel();
        const temperature = this.plugin.settings.ai?.temperature || 0.7;
        const maxTokens = this.plugin.settings.ai?.maxTokens || 1000;

        // Build context from character data as natural narrative
        let contextMessage = '';
        if (includeContext && this.plugin.settings.characterProfile?.assessmentComplete) {
            const s = this.plugin.settings;
            const sortedDomains = [...s.domains].sort((a, b) => b.score - a.score);
            const strengths = sortedDomains.slice(0, 3);
            const weaknesses = sortedDomains.slice(-3).reverse();

            // HUMAN 3.0 Framework data
            const quadrantScores = calculateQuadrantScores(s.domains);
            const devLevel = getDevelopmentLevel(s.level);
            const currentPhase = determinePhase(s);
            const devInfo = DEVELOPMENT_LEVELS[devLevel];

            // Find weakest/strongest quadrant
            const quadrantEntries = Object.entries(quadrantScores);
            const weakestQuadrant = quadrantEntries.reduce((a, b) => a[1] < b[1] ? a : b);
            const strongestQuadrant = quadrantEntries.reduce((a, b) => a[1] > b[1] ? a : b);

            const tierProgress = getTierProgress(s.level);
            const levelsToNext = getLevelsToNextTier(s.level);

            // Quadrant names in natural language
            const quadrantNames = { mind: 'Mind', body: 'Body', spirit: 'Spirit', vocation: 'Vocation' };

            // Health status description
            const hpPercent = Math.round((s.hp / s.maxHp) * 100);
            let healthDesc = '';
            if (hpPercent >= 80) healthDesc = 'in excellent health, full of vitality';
            else if (hpPercent >= 50) healthDesc = 'in fair condition, though somewhat weary';
            else if (hpPercent >= 25) healthDesc = 'wounded and struggling, in need of rest';
            else healthDesc = 'critically weakened, barely holding on';

            // Phase description
            let phaseDesc = '';
            if (currentPhase === 'dissonance') phaseDesc = 'feeling the stirrings of change, sensing that something must shift';
            else if (currentPhase === 'uncertainty') phaseDesc = 'walking through the mist of uncertainty, exploring new paths';
            else phaseDesc = 'in a state of flow and discovery, learning rapidly';

            // Build natural narrative
            contextMessage = `
The traveler before you is ${s.characterProfile?.name || 'a wandering soul'}, currently at Level ${s.level} on their journey. They are ${healthDesc}, carrying ${s.gold} gold coins from their adventures.

In the great tapestry of human development, this hero walks the path of ${devInfo.journey}. As a ${devInfo.name}, they are ${devLevel === '1.0' ? 'still awakening to their own potential, learning to see beyond the scripts they were given' : devLevel === '2.0' ? 'actively shaping their reality, setting their own goals and taking ownership of their story' : 'transcending ordinary limits, creating systems and leaving a legacy for others'}.

They have progressed ${tierProgress}% through this stage of evolution${levelsToNext > 0 ? `, with ${levelsToNext} levels remaining before ascending to the next tier` : ', standing at the pinnacle of human development'}.

Currently, this seeker is ${phaseDesc}.

Looking at the four aspects of their being:
- Their ${quadrantNames[strongestQuadrant[0]]} burns brightest at ${Math.round(strongestQuadrant[1])}%, showing where their power lies
- Their ${quadrantNames[weakestQuadrant[0]]} needs nurturing at ${Math.round(weakestQuadrant[1])}%, revealing where growth awaits

Their greatest strengths shine in ${strengths.map(d => d.name).join(', ')} - these are the gifts they bring to the world.
Yet growth calls from ${weaknesses.map(d => d.name).join(', ')} - here lie the lessons still to be learned.

On their daily path, they tend to ${s.habits.filter(h => !h.completed).length} sacred rituals and pursue ${s.quests.filter(q => !q.completed).length} active quests. Today, they have honored ${s.habits.filter(h => h.completed).length} of their commitments.

`;
        }

        // Build dynamic system prompt with customizations (Guide or Storyteller mode)
        const systemPrompt = useStorytellerMode
            ? buildStorytellerSystemPrompt(this.plugin.settings)
            : buildElderSystemPrompt(this.plugin.settings);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(this.plugin.settings.ai?.chatHistory || []).slice(-10),
            { role: 'user', content: contextMessage + userMessage }
        ];

        try {
            const assistantMessage = await this.callProvider(messages, provider, apiKey, model, temperature, maxTokens);

            // Save to chat history
            if (true) {
                if (!this.plugin.settings.ai.chatHistory) {
                    this.plugin.settings.ai.chatHistory = [];
                }
                this.plugin.settings.ai.chatHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: assistantMessage }
                );
                // Keep only last 50 messages
                if (this.plugin.settings.ai.chatHistory.length > 50) {
                    this.plugin.settings.ai.chatHistory = this.plugin.settings.ai.chatHistory.slice(-50);
                }
                await this.plugin.saveSettings();
            }

            return assistantMessage;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    async generateQuests(count = 3) {
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        const prompt = `Based on my lowest-scoring life domains, generate ${count} specific, actionable quests I can complete this week.

My weakest domains are:
${weakestDomains.map(d => `- ${d.icon} ${d.name}: ${d.score}%`).join('\n')}

For each quest, provide:
1. A clear, specific name (5-10 words)
2. The target domain
3. Difficulty (easy/medium/hard)
4. Suggested XP reward (10-100)
5. Suggested Gold reward (5-50)

Format your response as JSON array:
[
  {"name": "Quest name", "domain": "domainId", "difficulty": "medium", "xp": 30, "gold": 15},
  ...
]

Only return the JSON array, no other text.`;

        // Don't save quest generation to chat history (it's a system operation)
        const response = await this.chat(prompt, true, false);

        // Parse JSON from response
        try {
            let jsonStr = response;
            if (response.includes('```')) {
                const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('Failed to parse AI quest response:', e);
            throw new Error('AI returned invalid quest format. Please try again.');
        }
    }

    async getCoachingAdvice(topic = 'general') {
        const prompts = {
            general: "Based on my current domain scores, what's the single most impactful thing I could focus on this week to improve my overall well-being?",
            motivation: "I'm feeling unmotivated today. Based on my character profile, give me a personalized pep talk and one small action I can take right now.",
            habits: "Look at my current habits and domain scores. Suggest one new habit I should add and one I should consider removing or modifying.",
            progress: "Analyze my domain scores. Which area has the most potential for quick improvement, and what specific actions would help?"
        };

        return await this.chat(prompts[topic] || prompts.general, true);
    }
}

// ============================================================================
// EMBEDDING SERVICE CLASS - Multi-Provider Semantic Search & Memory
// ============================================================================

class EmbeddingService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Get embedding provider and API key
    getEmbeddingConfig() {
        const ai = this.plugin.settings.ai || {};
        // Embedding can use a different provider than chat
        const provider = ai.embeddingProvider || ai.provider || 'openrouter';
        const apiKey = ai.apiKeys?.[provider] || ai.openRouterApiKey || '';
        const model = ai.selectedEmbeddingModels?.[provider] || ai.embeddingModel || 'text-embedding-3-small';

        return { provider, apiKey, model };
    }

    // Create embedding using OpenRouter or OpenAI (same API format)
    async createEmbeddingOpenAI(text, apiKey, model, endpoint, extraHeaders = {}) {
        const response = await requestUrl({
            url: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...extraHeaders
            },
            body: JSON.stringify({
                model: model,
                input: text.substring(0, 8000)
            })
        });

        if (response.status !== 200) {
            throw new Error(`Embedding API Error: ${response.status}`);
        }

        const data = response.json;
        return data.data[0].embedding;
    }

    // Create embedding using Google AI
    async createEmbeddingGoogle(text, apiKey, model) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

        const response = await requestUrl({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${model}`,
                content: { parts: [{ text: text.substring(0, 8000) }] }
            })
        });

        if (response.status !== 200) {
            throw new Error(`Google Embedding Error: ${response.status}`);
        }

        const data = response.json;
        return data.embedding.values;
    }

    // Create embedding for text - routes to correct provider
    async createEmbedding(text) {
        const { provider, apiKey, model } = this.getEmbeddingConfig();

        if (!apiKey) {
            const providerName = AI_PROVIDERS[provider]?.name || 'AI';
            throw new Error(`${providerName} API key not configured for embeddings`);
        }

        // Check if provider supports embeddings
        if (provider === 'anthropic') {
            throw new Error('Anthropic does not support embeddings. Please use OpenRouter, OpenAI, or Google for embeddings.');
        }

        try {
            if (provider === 'google') {
                return await this.createEmbeddingGoogle(text, apiKey, model);
            } else if (provider === 'openai') {
                return await this.createEmbeddingOpenAI(
                    text,
                    apiKey,
                    model,
                    'https://api.openai.com/v1/embeddings'
                );
            } else {
                // OpenRouter (default)
                return await this.createEmbeddingOpenAI(
                    text,
                    apiKey,
                    model,
                    'https://openrouter.ai/api/v1/embeddings',
                    { 'HTTP-Referer': 'https://obsidian.md', 'X-Title': 'The Journey Plugin' }
                );
            }
        } catch (error) {
            console.error('Embedding Service Error:', error);
            throw error;
        }
    }

    // Calculate cosine similarity between two embeddings
    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (normA * normB);
    }

    // Find most similar entries to a query
    async findSimilarEntries(query, topK = 5) {
        const embeddings = this.plugin.settings.journalSettings?.embeddings || [];
        if (embeddings.length === 0) return [];

        // Create embedding for query
        const queryEmbedding = await this.createEmbedding(query);

        // Calculate similarities
        const similarities = embeddings.map(entry => ({
            ...entry,
            similarity: this.cosineSimilarity(queryEmbedding, entry.embedding)
        }));

        // Sort by similarity and return top K
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    // Find relevant entries for Elder context
    async getRelevantMemories(query, count = 3) {
        try {
            const similar = await this.findSimilarEntries(query, count);
            return similar
                .filter(e => e.similarity > 0.3) // Only include if similarity > 30%
                .map(e => ({
                    fileName: e.fileName,
                    date: e.date,
                    summary: e.summary,
                    similarity: Math.round(e.similarity * 100)
                }));
        } catch (error) {
            console.error('Error getting memories:', error);
            return [];
        }
    }

    // Create summary for embedding (shorter than full content)
    createSummary(content, maxLength = 500) {
        // Remove markdown formatting
        let text = content
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*|__/g, '')
            .replace(/\*|_/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
            .trim();

        // Return first maxLength characters
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Embed a journal entry and store it
    async embedJournalEntry(filePath, fileName, content, date) {
        const summary = this.createSummary(content);
        const embedding = await this.createEmbedding(summary);

        return {
            filePath,
            fileName,
            date,
            summary,
            embedding
        };
    }
}

// ============================================================================
// SKILL SERVICE CLASS - Skill Discovery & Leveling
// ============================================================================

class JournalAnalyzer {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Get all journal notes based on settings
    async getJournalNotes() {
        const s = this.plugin.settings.journalSettings;
        const allFiles = this.plugin.app.vault.getMarkdownFiles();

        if (s.scanMode === 'folder') {
            const folderPath = s.journalFolder.endsWith('/') ? s.journalFolder : s.journalFolder + '/';
            return allFiles.filter(f => f.path.startsWith(folderPath) || f.path.startsWith(s.journalFolder + '/'));
        } else {
            // Tag-based: need to read each file's content
            const taggedNotes = [];
            for (const file of allFiles) {
                try {
                    const content = await this.plugin.app.vault.read(file);
                    if (content.includes(s.journalTag)) {
                        taggedNotes.push(file);
                    }
                } catch (e) {
                    console.error(`Error reading file ${file.path}:`, e);
                }
            }
            return taggedNotes;
        }
    }

    // Get notes modified since last sync
    async getNewNotes() {
        const allJournals = await this.getJournalNotes();
        const lastSync = this.plugin.settings.journalSettings.lastSyncDate;

        if (!lastSync) return allJournals; // First sync - analyze all

        const lastSyncTime = new Date(lastSync).getTime();
        return allJournals.filter(f => f.stat.mtime > lastSyncTime);
    }

    // Offline keyword-based analysis
    analyzeContentOffline(content) {
        const s = this.plugin.settings.journalSettings;
        const contentLower = content.toLowerCase();

        // Domain detection
        const domainScores = {};
        for (const [domain, keywords] of Object.entries(s.domainKeywords)) {
            const matches = keywords.filter(k => contentLower.includes(k.toLowerCase()));
            domainScores[domain] = {
                matches: matches,
                count: matches.length,
                intensity: matches.length / keywords.length
            };
        }

        // Sentiment analysis
        const positiveMatches = s.sentimentKeywords.positive.filter(k => contentLower.includes(k.toLowerCase()));
        const negativeMatches = s.sentimentKeywords.negative.filter(k => contentLower.includes(k.toLowerCase()));

        const sentiment = {
            positive: positiveMatches.length,
            negative: negativeMatches.length,
            score: positiveMatches.length - negativeMatches.length,
            positiveWords: positiveMatches,
            negativeWords: negativeMatches
        };

        return { domainScores, sentiment };
    }

    // AI-powered analysis (when API key available)
    async analyzeContentWithAI(content, fileName) {
        const apiKey = this.plugin.settings.ai?.openRouterApiKey;
        if (!apiKey) return null;

        const prompt = `Analyze this journal entry and return ONLY valid JSON (no markdown, no explanation):
{
    "domains": {
        "health": 0,
        "psychologicalWellbeing": 0,
        "education": 0,
        "timeUse": 0,
        "communityVitality": 0,
        "livingStandards": 0,
        "culturalResilience": 0,
        "goodGovernance": 0,
        "ecologicalAwareness": 0
    },
    "sentiment": 0,
    "achievements": [],
    "challenges": [],
    "suggestedXP": 0,
    "suggestedHPChange": 0
}

Scoring guide:
- domains: 0-10 score based on how much the entry focuses on each life area
- sentiment: -10 (very negative) to +10 (very positive)
- achievements: list of accomplishments mentioned (strings)
- challenges: list of difficulties mentioned (strings)
- suggestedXP: 0-50 based on accomplishments and effort
- suggestedHPChange: -20 to +10 (negative for stress/challenges, positive for self-care)

Journal entry from "${fileName}":
${content.substring(0, 2000)}`;

        try {
            // Use chat with saveToHistory=false to avoid polluting the Elder conversation
            const response = await this.plugin.aiService.chat(prompt, false, false);
            // Try to extract JSON from response
            let jsonStr = response;
            if (response.includes('```')) {
                const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('AI analysis failed:', e);
            return null;
        }
    }

    // Combined analysis
    async analyzeNote(file) {
        const content = await this.plugin.app.vault.read(file);
        const offlineAnalysis = this.analyzeContentOffline(content);

        let aiAnalysis = null;
        if (this.plugin.settings.ai?.openRouterApiKey) {
            aiAnalysis = await this.analyzeContentWithAI(content, file.basename);
        }

        return {
            file: file.path,
            fileName: file.basename,
            modifiedDate: new Date(file.stat.mtime).toISOString(),
            wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
            offline: offlineAnalysis,
            ai: aiAnalysis
        };
    }
}

// ============================================================================
// CHARACTER CREATION MODAL
// ============================================================================

class CharacterCreationModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
        this.currentStep = 'welcome';
        this.characterName = '';
        this.currentDomainIndex = 0;
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.allQuestions = this.buildQuestionList();
        this.totalQuestions = this.allQuestions.length;
    }

    buildQuestionList() {
        const questions = [];
        for (const domainId of DOMAIN_ORDER) {
            const domainQuestions = QUESTION_BANK[domainId];
            for (const q of domainQuestions) {
                questions.push({ ...q, domain: domainId });
            }
        }
        return questions;
    }

    getCurrentQuestion() {
        let idx = 0;
        for (let d = 0; d < this.currentDomainIndex; d++) {
            idx += QUESTION_BANK[DOMAIN_ORDER[d]].length;
        }
        idx += this.currentQuestionIndex;
        return this.allQuestions[idx];
    }

    getOverallProgress() {
        let answered = 0;
        for (let d = 0; d < this.currentDomainIndex; d++) {
            answered += QUESTION_BANK[DOMAIN_ORDER[d]].length;
        }
        answered += this.currentQuestionIndex;
        return Math.round((answered / this.totalQuestions) * 100);
    }

    onOpen() {
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-assessment-modal');

        switch (this.currentStep) {
            case 'welcome':
                this.renderWelcome();
                break;
            case 'domain_intro':
                this.renderDomainIntro();
                break;
            case 'question':
                this.renderQuestion();
                break;
            case 'complete':
                this.renderComplete();
                break;
        }
    }

    renderWelcome() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: '🎭 Create Your Character' });

        const nameSection = contentEl.createDiv({ cls: 'rpg-name-section' });
        nameSection.createEl('label', { text: 'What should we call you?' });

        const nameInput = nameSection.createEl('input', {
            type: 'text',
            placeholder: 'Enter your name...',
            cls: 'rpg-name-input'
        });
        nameInput.value = this.characterName;
        nameInput.addEventListener('input', (e) => {
            this.characterName = e.target.value;
        });

        contentEl.createEl('h3', { text: 'Choose Your Path', cls: 'rpg-path-title' });

        const pathsContainer = contentEl.createDiv({ cls: 'rpg-paths-container' });

        // Quick Start Path
        const quickPath = pathsContainer.createDiv({ cls: 'rpg-path-card' });
        quickPath.createDiv({ cls: 'rpg-path-icon', text: '⚡' });
        quickPath.createEl('h4', { text: 'Quick Start' });
        quickPath.createEl('p', {
            text: 'Jump right in! Start with balanced stats and discover yourself through gameplay.',
            cls: 'rpg-path-desc'
        });
        quickPath.createDiv({ cls: 'rpg-path-reward', text: 'Start at Level 1' });
        const quickBtn = quickPath.createEl('button', {
            text: 'Start Adventure →',
            cls: 'rpg-primary-btn'
        });
        quickBtn.onclick = () => {
            if (!this.characterName.trim()) {
                this.characterName = 'Hero';
            }
            this.quickStart();
        };

        // Discovery Journey Path
        const journeyPath = pathsContainer.createDiv({ cls: 'rpg-path-card journey' });
        journeyPath.createDiv({ cls: 'rpg-path-icon', text: '🧭' });
        journeyPath.createEl('h4', { text: 'Discovery Journey' });
        journeyPath.createEl('p', {
            text: 'Answer 37 questions to discover your true strengths. Earn XP for each answer!',
            cls: 'rpg-path-desc'
        });
        journeyPath.createDiv({ cls: 'rpg-path-reward', text: '+5 XP per question • +50 bonus XP' });
        const journeyBtn = journeyPath.createEl('button', {
            text: 'Begin Journey →',
            cls: 'rpg-secondary-btn'
        });
        journeyBtn.onclick = () => {
            if (!this.characterName.trim()) {
                this.characterName = 'Hero';
            }
            this.currentStep = 'domain_intro';
            this.render();
        };

        contentEl.createEl('p', {
            text: "💡 Tip: You can always take the Discovery Journey later from your Character tab!",
            cls: 'rpg-modal-tip'
        });
    }

    async quickStart() {
        const s = this.plugin.settings;

        // Set default domain scores (all at 50%)
        s.domains = DEFAULT_DOMAINS.map(d => ({
            ...d,
            score: 50,
            level: 1,
            xp: 0
        }));

        s.characterProfile = {
            name: this.characterName,
            createdAt: new Date().toISOString(),
            assessmentComplete: false,  // Journey not completed
            assessmentResponses: [],
            questionsAnswered: 0
        };

        s.level = 1;
        s.maxHp = 110;
        s.hp = s.maxHp;
        s.xp = 0;

        await this.plugin.saveSettings();

        // Award character_created achievement
        const ach = s.achievements.find(a => a.id === 'character_created');
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            s.gold += ach.reward;
            s.totalGoldEarned = (s.totalGoldEarned || 0) + ach.reward;
            await this.plugin.saveSettings();
            new Notice(`🏆 Achievement: ${ach.name}! +${ach.reward}g`);
        }

        new Notice(`⚡ Character "${this.characterName}" created! Level 1`);

        this.close();
        if (this.onComplete) this.onComplete();
    }

    renderDomainIntro() {
        const { contentEl } = this;
        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);

        const progress = this.getOverallProgress();
        const progressBar = contentEl.createDiv({ cls: 'rpg-progress-container' });
        progressBar.createDiv({ cls: 'rpg-progress-label', text: `Progress: ${progress}%` });
        const bar = progressBar.createDiv({ cls: 'rpg-progress-bar' });
        bar.createDiv({ cls: 'rpg-progress-fill', attr: { style: `width: ${progress}%` } });

        contentEl.createEl('h2', { text: `${domain.icon} ${domain.name}` });
        contentEl.createEl('p', {
            text: DOMAIN_INTROS[domainId],
            cls: 'rpg-domain-intro-text'
        });
        contentEl.createEl('p', {
            text: `(${QUESTION_BANK[domainId].length} questions in this section)`,
            cls: 'rpg-question-count'
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });
        const continueBtn = btnContainer.createEl('button', {
            text: 'Continue →',
            cls: 'rpg-primary-btn'
        });
        continueBtn.onclick = () => {
            this.currentStep = 'question';
            this.currentQuestionIndex = 0;
            this.render();
        };
    }

    renderQuestion() {
        const { contentEl } = this;
        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domainQuestions = QUESTION_BANK[domainId];
        const question = domainQuestions[this.currentQuestionIndex];
        const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);

        const progress = this.getOverallProgress();
        const progressBar = contentEl.createDiv({ cls: 'rpg-progress-container' });
        progressBar.createDiv({ cls: 'rpg-progress-label', text: `Progress: ${progress}%` });
        const bar = progressBar.createDiv({ cls: 'rpg-progress-bar' });
        bar.createDiv({ cls: 'rpg-progress-fill', attr: { style: `width: ${progress}%` } });

        contentEl.createDiv({ cls: 'rpg-domain-badge', text: `${domain.icon} ${domain.name}` });

        const questionNum = this.currentQuestionIndex + 1;
        const totalInDomain = domainQuestions.length;
        contentEl.createDiv({ cls: 'rpg-question-number', text: `Question ${questionNum} of ${totalInDomain}` });

        contentEl.createEl('h3', { text: question.text, cls: 'rpg-question-text' });

        if (question.hint) {
            contentEl.createDiv({ cls: 'rpg-question-hint', text: `💡 ${question.hint}` });
        }

        const likertContainer = contentEl.createDiv({ cls: 'rpg-likert-container' });
        const labels = [
            { value: 1, label: 'Strongly Disagree', emoji: '😟' },
            { value: 2, label: 'Disagree', emoji: '😕' },
            { value: 3, label: 'Neutral', emoji: '😐' },
            { value: 4, label: 'Agree', emoji: '🙂' },
            { value: 5, label: 'Strongly Agree', emoji: '😊' }
        ];

        labels.forEach(opt => {
            const btn = likertContainer.createEl('button', { cls: 'rpg-likert-btn' });
            btn.createDiv({ cls: 'rpg-likert-emoji', text: opt.emoji });
            btn.createDiv({ cls: 'rpg-likert-value', text: opt.value.toString() });
            btn.createDiv({ cls: 'rpg-likert-label', text: opt.label });

            btn.onclick = () => this.submitResponse(question.id, opt.value);
        });

        const navContainer = contentEl.createDiv({ cls: 'rpg-nav-container' });
        if (this.currentQuestionIndex > 0 || this.currentDomainIndex > 0) {
            const backBtn = navContainer.createEl('button', { text: '← Back', cls: 'rpg-secondary-btn' });
            backBtn.onclick = () => this.goBack();
        }
    }

    async submitResponse(questionId, value) {
        const existingIdx = this.responses.findIndex(r => r.questionId === questionId);
        const isNewAnswer = existingIdx < 0;

        if (existingIdx >= 0) {
            this.responses[existingIdx].value = value;
        } else {
            this.responses.push({ questionId, value });
        }

        // Award XP for new answers
        if (isNewAnswer) {
            const xpReward = 5;
            this.plugin.settings.xp += xpReward;
            await this.plugin.saveSettings();
            new Notice(`+${xpReward} XP for answering!`);
        }

        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domainQuestions = QUESTION_BANK[domainId];

        if (this.currentQuestionIndex < domainQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
        } else {
            if (this.currentDomainIndex < DOMAIN_ORDER.length - 1) {
                this.currentDomainIndex++;
                this.currentStep = 'domain_intro';
                this.render();
            } else {
                this.currentStep = 'complete';
                this.render();
            }
        }
    }

    goBack() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        } else if (this.currentDomainIndex > 0) {
            this.currentDomainIndex--;
            const prevDomainQuestions = QUESTION_BANK[DOMAIN_ORDER[this.currentDomainIndex]];
            this.currentQuestionIndex = prevDomainQuestions.length - 1;
        }
        this.render();
    }

    renderComplete() {
        const { contentEl } = this;

        const domainScores = calculateDomainScores(this.responses);
        const level = calculateLevelFromScores(domainScores);
        const title = getCharacterTitle(level);

        contentEl.createEl('h2', { text: '🎉 Journey Complete!' });

        // Show rewards earned
        const rewardsBox = contentEl.createDiv({ cls: 'rpg-rewards-box' });
        rewardsBox.createEl('h4', { text: '🎁 Rewards Earned' });
        const totalXP = (this.responses.length * 5) + 50; // 5 per question + 50 bonus
        rewardsBox.createDiv({ cls: 'rpg-reward-item', text: `✨ ${this.responses.length * 5} XP from questions` });
        rewardsBox.createDiv({ cls: 'rpg-reward-item bonus', text: `🌟 +50 XP completion bonus!` });
        rewardsBox.createDiv({ cls: 'rpg-reward-total', text: `Total: ${totalXP} XP` });

        const card = contentEl.createDiv({ cls: 'rpg-character-card' });
        card.createDiv({ cls: 'rpg-card-title', text: title });
        card.createEl('h3', { text: this.characterName });
        card.createDiv({ cls: 'rpg-card-level', text: `Level ${level}` });

        const scoresSection = contentEl.createDiv({ cls: 'rpg-scores-section' });
        scoresSection.createEl('h4', { text: 'Your Domain Scores' });

        const sortedDomains = DOMAIN_ORDER.map(id => ({
            id,
            score: domainScores[id],
            ...DEFAULT_DOMAINS.find(d => d.id === id)
        })).sort((a, b) => b.score - a.score);

        scoresSection.createDiv({ cls: 'rpg-section-label', text: '💪 Top Strengths' });
        sortedDomains.slice(0, 3).forEach((d, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            scoresSection.createDiv({
                cls: 'rpg-score-row strength',
                text: `${medals[i]} ${d.icon} ${d.name}: ${d.score}%`
            });
        });

        scoresSection.createDiv({ cls: 'rpg-section-label', text: '🌱 Growth Areas' });
        sortedDomains.slice(-3).reverse().forEach(d => {
            scoresSection.createDiv({
                cls: 'rpg-score-row growth',
                text: `🎯 ${d.icon} ${d.name}: ${d.score}%`
            });
        });

        const chartSection = contentEl.createDiv({ cls: 'rpg-chart-section' });
        chartSection.createEl('h4', { text: 'All Domains' });

        DOMAIN_ORDER.forEach(domainId => {
            const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);
            const score = domainScores[domainId];

            const row = chartSection.createDiv({ cls: 'rpg-domain-bar-row' });
            row.createDiv({ cls: 'rpg-domain-bar-label', text: `${domain.icon} ${domain.name}` });
            const barContainer = row.createDiv({ cls: 'rpg-domain-bar-container' });
            barContainer.createDiv({
                cls: 'rpg-domain-bar-fill',
                attr: { style: `width: ${score}%; background-color: ${domain.color}` }
            });
            row.createDiv({ cls: 'rpg-domain-bar-value', text: `${score}%` });
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });
        const confirmBtn = btnContainer.createEl('button', {
            text: '✨ Apply Results',
            cls: 'rpg-primary-btn'
        });
        confirmBtn.onclick = () => {
            this.finalizeCharacter(domainScores, level);
        };
    }

    async finalizeCharacter(domainScores, level) {
        const s = this.plugin.settings;
        const isNewCharacter = !s.characterProfile?.name;

        s.domains = DEFAULT_DOMAINS.map(d => ({
            ...d,
            score: domainScores[d.id],
            level: Math.floor(domainScores[d.id] / 10) + 1,
            xp: 0
        }));

        // Give completion bonus XP
        const bonusXP = 50;
        s.xp += bonusXP;

        s.characterProfile = {
            name: this.characterName || s.characterProfile?.name || 'Hero',
            createdAt: s.characterProfile?.createdAt || new Date().toISOString(),
            assessmentComplete: true,
            assessmentResponses: this.responses,
            questionsAnswered: this.responses.length
        };

        s.level = level;
        s.maxHp = 100 + (level * 10);
        s.hp = s.maxHp;

        await this.plugin.saveSettings();

        // Check for journey completion achievement
        const journeyAch = s.achievements.find(a => a.id === 'journey_complete');
        if (journeyAch && !journeyAch.unlocked) {
            journeyAch.unlocked = true;
            s.gold += journeyAch.reward;
            s.totalGoldEarned += journeyAch.reward;
            await this.plugin.saveSettings();
            new Notice(`🏆 Achievement Unlocked: ${journeyAch.name}! +${journeyAch.reward}g`);
        }

        // Also check character_created if new
        if (isNewCharacter) {
            const ach = s.achievements.find(a => a.id === 'character_created');
            if (ach && !ach.unlocked) {
                ach.unlocked = true;
                s.gold += ach.reward;
                s.totalGoldEarned += ach.reward;
                await this.plugin.saveSettings();
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
            }
        }

        new Notice(`🎉 Journey complete! +${bonusXP} bonus XP! Now Level ${level}!`);

        this.close();
        if (this.onComplete) this.onComplete();
    }
}

// ============================================================================
// ELDER SETTINGS MODAL - Customize AI Persona
// ============================================================================

class ElderSettingsModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-elder-settings-modal');

        const s = this.plugin.settings;
        if (!s.ai) s.ai = { ...DEFAULT_AI_SETTINGS };
        if (!s.ai.elderPersona) s.ai.elderPersona = { ...DEFAULT_AI_SETTINGS.elderPersona };
        if (!s.ai.elderPrompts) s.ai.elderPrompts = { ...DEFAULT_AI_SETTINGS.elderPrompts };

        contentEl.createEl('h2', { text: '🧙 Customize Your Elder' });
        contentEl.createEl('p', {
            text: 'Shape the personality and wisdom of your guide.',
            cls: 'rpg-modal-subtitle'
        });

        // === PERSONA SECTION ===
        const personaSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        personaSection.createEl('h3', { text: '👤 Elder Identity' });

        // Name
        const nameRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        nameRow.createEl('label', { text: 'Name' });
        const nameInput = nameRow.createEl('input', { type: 'text' });
        nameInput.value = s.ai.elderPersona.name;
        nameInput.placeholder = 'The Elder';
        nameInput.onchange = (e) => s.ai.elderPersona.name = e.target.value;

        // Title
        const titleRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        titleRow.createEl('label', { text: 'Title' });
        const titleInput = titleRow.createEl('input', { type: 'text' });
        titleInput.value = s.ai.elderPersona.title;
        titleInput.placeholder = 'Keeper of Wisdom';
        titleInput.onchange = (e) => s.ai.elderPersona.title = e.target.value;

        // Greeting
        const greetingRow = personaSection.createDiv({ cls: 'rpg-setting-row vertical' });
        greetingRow.createEl('label', { text: 'Greeting Message' });
        const greetingInput = greetingRow.createEl('textarea');
        greetingInput.value = s.ai.elderPersona.greeting;
        greetingInput.placeholder = 'Greetings, traveler...';
        greetingInput.rows = 2;
        greetingInput.onchange = (e) => s.ai.elderPersona.greeting = e.target.value;

        // Personality Preset
        const personalityRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        personalityRow.createEl('label', { text: 'Personality' });
        const personalitySelect = personalityRow.createEl('select');

        Object.entries(ELDER_PERSONALITIES).forEach(([id, preset]) => {
            const option = personalitySelect.createEl('option', { value: id, text: preset.name });
            if (id === s.ai.elderPersona.personality) option.selected = true;
        });
        personalitySelect.onchange = (e) => s.ai.elderPersona.personality = e.target.value;

        // Preview personality
        const previewBox = personaSection.createDiv({ cls: 'rpg-personality-preview' });
        const updatePreview = () => {
            const preset = ELDER_PERSONALITIES[personalitySelect.value];
            previewBox.innerHTML = `
                <div class="rpg-preview-title">${preset.name}</div>
                <div class="rpg-preview-style">${preset.style}</div>
                <div class="rpg-preview-tone"><em>${preset.tone}</em></div>
            `;
        };
        updatePreview();
        personalitySelect.onchange = (e) => {
            s.ai.elderPersona.personality = e.target.value;
            updatePreview();
        };

        // === CUSTOM KNOWLEDGE ===
        const knowledgeSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        knowledgeSection.createEl('h3', { text: '📚 Personal Knowledge' });
        knowledgeSection.createEl('p', {
            text: 'Add context about yourself that the Elder should know (goals, background, preferences).',
            cls: 'rpg-setting-desc'
        });

        const knowledgeInput = knowledgeSection.createEl('textarea', { cls: 'rpg-large-textarea' });
        knowledgeInput.value = s.ai.customKnowledge || '';
        knowledgeInput.placeholder = 'Example:\n- I am a photographer transitioning careers\n- My main goal is to find my first client by end of month\n- I prefer actionable advice over philosophical musings\n- I struggle with procrastination';
        knowledgeInput.rows = 5;
        knowledgeInput.onchange = (e) => s.ai.customKnowledge = e.target.value;

        // === CUSTOM INSTRUCTIONS ===
        const instructionsSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        instructionsSection.createEl('h3', { text: '📜 Custom Instructions' });
        instructionsSection.createEl('p', {
            text: 'Additional instructions for how the Elder should behave or respond.',
            cls: 'rpg-setting-desc'
        });

        const instructionsInput = instructionsSection.createEl('textarea', { cls: 'rpg-large-textarea' });
        instructionsInput.value = s.ai.customSystemPrompt || '';
        instructionsInput.placeholder = 'Example:\n- Always end with an actionable next step\n- Reference Vietnamese culture when relevant\n- Keep responses under 200 words\n- Focus on practical advice, not theory';
        instructionsInput.rows = 4;
        instructionsInput.onchange = (e) => s.ai.customSystemPrompt = e.target.value;

        // === QUICK PROMPTS ===
        const promptsSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        promptsSection.createEl('h3', { text: '⚡ Quick Wisdom Prompts' });
        promptsSection.createEl('p', {
            text: 'Customize what happens when you click the quick wisdom buttons.',
            cls: 'rpg-setting-desc'
        });

        const prompts = [
            { id: 'guidance', label: '🔮 Guidance', default: DEFAULT_AI_SETTINGS.elderPrompts.guidance },
            { id: 'challenge', label: '⚔️ Challenge', default: DEFAULT_AI_SETTINGS.elderPrompts.challenge },
            { id: 'reflection', label: '🪞 Reflection', default: DEFAULT_AI_SETTINGS.elderPrompts.reflection },
            { id: 'motivation', label: '🔥 Motivation', default: DEFAULT_AI_SETTINGS.elderPrompts.motivation }
        ];

        prompts.forEach(prompt => {
            const promptRow = promptsSection.createDiv({ cls: 'rpg-setting-row vertical' });
            promptRow.createEl('label', { text: prompt.label });
            const promptInput = promptRow.createEl('textarea');
            promptInput.value = s.ai.elderPrompts[prompt.id] || prompt.default;
            promptInput.placeholder = prompt.default;
            promptInput.rows = 2;
            promptInput.onchange = (e) => s.ai.elderPrompts[prompt.id] = e.target.value;
        });

        // === BUTTONS ===
        const buttonRow = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        const resetBtn = buttonRow.createEl('button', {
            text: '🔄 Reset to Defaults',
            cls: 'rpg-btn secondary'
        });
        resetBtn.onclick = async () => {
            s.ai.elderPersona = { ...DEFAULT_AI_SETTINGS.elderPersona };
            s.ai.elderPrompts = { ...DEFAULT_AI_SETTINGS.elderPrompts };
            s.ai.customKnowledge = '';
            s.ai.customSystemPrompt = '';
            await this.plugin.saveSettings();
            this.onOpen(); // Re-render
        };

        const saveBtn = buttonRow.createEl('button', {
            text: '💾 Save Changes',
            cls: 'rpg-btn primary'
        });
        saveBtn.onclick = async () => {
            await this.plugin.saveSettings();
            new Notice('Elder settings saved!');
            this.close();
            if (this.onComplete) this.onComplete();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ============================================================================
// AI QUEST GENERATOR MODAL
// ============================================================================

class AIQuestGeneratorModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
        this.generatedQuests = [];
        this.isLoading = false;
    }

    onOpen() {
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-ai-modal');

        const hasApiKey = !!this.plugin.settings.ai?.openRouterApiKey;

        contentEl.createEl('h2', { text: '✨ Quest Generator' });

        // Show weakest domains
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        const infoSection = contentEl.createDiv({ cls: 'rpg-ai-info' });
        infoSection.createEl('p', { text: 'Generate quests to improve your weakest domains:' });
        weakestDomains.forEach(d => {
            infoSection.createDiv({ cls: 'rpg-domain-tag', text: `${d.icon} ${d.name} (${d.score}%)` });
        });

        if (this.isLoading) {
            contentEl.createDiv({ cls: 'rpg-loading', text: '🎲 Generating quests...' });
            return;
        }

        if (this.generatedQuests.length > 0) {
            this.renderGeneratedQuests(contentEl);
            return;
        }

        // Generate buttons
        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        // Smart generate (always available)
        const smartBtn = btnContainer.createEl('button', {
            text: '📚 Smart Generate (3 Quests)',
            cls: 'rpg-primary-btn'
        });
        smartBtn.onclick = () => this.generateSmartQuests();

        // AI generate (only with API key)
        if (hasApiKey) {
            const aiBtn = btnContainer.createEl('button', {
                text: '🤖 AI Generate (Enhanced)',
                cls: 'rpg-secondary-btn'
            });
            aiBtn.onclick = () => this.generateAIQuests();
        } else {
            contentEl.createDiv({
                cls: 'rpg-info-note',
                text: '💡 Add an API key in Settings to unlock AI-enhanced quest generation with personalized suggestions.'
            });
        }
    }

    // Smart quest generation - works offline
    generateSmartQuests() {
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        this.generatedQuests = weakestDomains.map(domain => {
            const tips = COACHING_TIPS[domain.id] || COACHING_TIPS.psychologicalWellbeing;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];

            return {
                name: randomTip.tip,
                xp: 15 + Math.floor(Math.random() * 15),
                gold: 5 + Math.floor(Math.random() * 10),
                domain: domain.id,
                difficulty: 'medium',
                source: 'smart'
            };
        });

        this.render();
    }

    // AI quest generation - requires API key
    async generateAIQuests() {
        this.isLoading = true;
        this.render();

        try {
            const aiService = new AIService(this.plugin);
            this.generatedQuests = await aiService.generateQuests(3);
            this.generatedQuests = this.generatedQuests.map(q => ({ ...q, source: 'ai' }));
            this.isLoading = false;
            this.render();
        } catch (error) {
            this.isLoading = false;
            new Notice(`❌ ${error.message}`);
            // Fallback to smart generation
            this.generateSmartQuests();
        }
    }

    renderGeneratedQuests(contentEl) {
        contentEl.createEl('h3', { text: 'Generated Quests' });

        this.generatedQuests.forEach((quest, index) => {
            const questEl = contentEl.createDiv({ cls: 'rpg-generated-quest' });

            const domain = this.plugin.settings.domains.find(d => d.id === quest.domain);
            const domainIcon = domain ? domain.icon : '📌';

            questEl.createDiv({ cls: 'rpg-quest-name', text: quest.name });
            questEl.createDiv({
                cls: 'rpg-quest-meta',
                text: `${domainIcon} ${quest.domain} | ${quest.difficulty} | +${quest.xp}xp +${quest.gold}g`
            });

            const addBtn = questEl.createEl('button', { text: 'Add Quest', cls: 'rpg-add-btn' });
            addBtn.onclick = async () => {
                this.plugin.settings.quests.push({
                    name: quest.name,
                    domain: quest.domain,
                    difficulty: quest.difficulty,
                    xp: quest.xp,
                    gold: quest.gold,
                    completed: false,
                    completedDate: null,
                    aiGenerated: true
                });

                // Track AI quest generation
                if (!this.plugin.settings.aiQuestsGenerated) {
                    this.plugin.settings.aiQuestsGenerated = 0;
                }
                this.plugin.settings.aiQuestsGenerated++;

                await this.plugin.saveSettings();
                this.plugin.checkAchievements();

                addBtn.disabled = true;
                addBtn.setText('✓ Added');
                new Notice(`⚔️ Quest added: ${quest.name}`);
            };
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        const regenerateBtn = btnContainer.createEl('button', {
            text: '🔄 Generate More',
            cls: 'rpg-secondary-btn'
        });
        regenerateBtn.onclick = () => {
            this.generatedQuests = [];
            this.generateQuests();
        };

        const closeBtn = btnContainer.createEl('button', {
            text: 'Done',
            cls: 'rpg-primary-btn'
        });
        closeBtn.onclick = () => {
            this.close();
            if (this.onComplete) this.onComplete();
        };
    }
}

// ============================================================================
// HERO DASHBOARD VIEW
// ============================================================================

class NewHabitModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create New Habit" });

        let name = "";
        let xp = 10;
        let gold = 5;
        let domain = 'health';
        let difficulty = 'medium';

        new Setting(contentEl).setName("Habit Name").addText(text => text.onChange(value => name = value));

        new Setting(contentEl).setName("Life Domain").addDropdown(dd => {
            this.plugin.settings.domains.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
            dd.setValue(domain);
            dd.onChange(value => domain = value);
        });

        new Setting(contentEl).setName("Difficulty").addDropdown(dd => {
            Object.keys(DIFFICULTY).forEach(d => dd.addOption(d, DIFFICULTY[d].label));
            dd.setValue(difficulty);
            dd.onChange(value => difficulty = value);
        });

        new Setting(contentEl).setName("Base XP").addText(text => {
            text.setValue("10");
            text.onChange(value => xp = Number(value));
        });

        new Setting(contentEl).setName("Base Gold").addText(text => {
            text.setValue("5");
            text.onChange(value => gold = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Create")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.habits.push({
                        name, xp, gold, domain, difficulty,
                        completed: false,
                        streak: 0,
                        bestStreak: 0,
                        lastCompletedDate: null
                    });
                    await this.plugin.saveSettings();
                    this.plugin.checkAchievements();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewQuestModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create New Quest" });

        let name = "";
        let xp = 50;
        let gold = 25;
        let domain = 'education';
        let difficulty = 'medium';
        let deadline = "";

        new Setting(contentEl).setName("Quest Name").addText(text => text.onChange(value => name = value));

        new Setting(contentEl).setName("Life Domain").addDropdown(dd => {
            this.plugin.settings.domains.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
            dd.setValue(domain);
            dd.onChange(value => domain = value);
        });

        new Setting(contentEl).setName("Difficulty").addDropdown(dd => {
            Object.keys(DIFFICULTY).forEach(d => dd.addOption(d, DIFFICULTY[d].label));
            dd.setValue(difficulty);
            dd.onChange(value => difficulty = value);
        });

        new Setting(contentEl).setName("Deadline (optional)").addText(text => {
            text.inputEl.type = 'date';
            text.onChange(value => deadline = value);
        });

        new Setting(contentEl).setName("XP Reward").addText(text => {
            text.setValue("50");
            text.onChange(value => xp = Number(value));
        });

        new Setting(contentEl).setName("Gold Reward").addText(text => {
            text.setValue("25");
            text.onChange(value => gold = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Create Quest")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.quests.push({
                        name, xp, gold, domain, difficulty, deadline,
                        completed: false,
                        completedDate: null
                    });
                    await this.plugin.saveSettings();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewBadHabitModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Track Bad Habit" });

        let name = "";
        let hpCost = 10;
        let goldPenalty = 5;

        new Setting(contentEl).setName("Bad Habit Name").addText(text => text.onChange(value => name = value));
        new Setting(contentEl).setName("HP Cost").addText(text => {
            text.setValue("10");
            text.onChange(value => hpCost = Number(value));
        });
        new Setting(contentEl).setName("Gold Penalty").addText(text => {
            text.setValue("5");
            text.onChange(value => goldPenalty = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Track")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.badHabits.push({
                        name, hpCost, goldPenalty, triggerCount: 0
                    });
                    await this.plugin.saveSettings();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewRewardModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create Shop Reward" });
        let name = "";
        let cost = 50;

        new Setting(contentEl).setName("Reward Name").addText(text => text.onChange(value => name = value));
        new Setting(contentEl).setName("Gold Cost").addText(text => {
            text.setValue("50");
            text.onChange(value => cost = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn.setButtonText("Create").setCta().onClick(async () => {
            if (name) {
                this.plugin.settings.rewards.push({ name, cost });
                await this.plugin.saveSettings();
                this.onSubmit();
                this.close();
            }
        }));
    }
    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// BOSS FIGHT MODAL
// ============================================================================
class NewBossFightModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "🐉 Create Boss Fight" });
        contentEl.createEl("p", { cls: 'rpg-modal-subtitle', text: 'Turn your big goal into an epic battle!' });

        let name = "";
        let description = "";
        let icon = "🐉";
        let maxHp = 100;
        let domain = 'psychologicalWellbeing';

        new Setting(contentEl)
            .setName("Boss Name")
            .setDesc("Give your boss a memorable name")
            .addText(text => text
                .setPlaceholder("The Lazy Dragon")
                .onChange(value => name = value));

        new Setting(contentEl)
            .setName("Description")
            .setDesc("What does defeating this boss represent?")
            .addText(text => text
                .setPlaceholder("Complete my thesis by March")
                .onChange(value => description = value));

        new Setting(contentEl)
            .setName("Boss Icon")
            .addText(text => text
                .setValue("🐉")
                .onChange(value => icon = value));

        new Setting(contentEl)
            .setName("Boss HP")
            .setDesc("Higher HP = longer battle. 100 HP ≈ 10 tasks to defeat")
            .addDropdown(dd => {
                dd.addOption("50", "50 HP - Quick Battle");
                dd.addOption("100", "100 HP - Standard");
                dd.addOption("150", "150 HP - Tough Fight");
                dd.addOption("200", "200 HP - Epic Battle");
                dd.addOption("300", "300 HP - Legendary");
                dd.setValue("100");
                dd.onChange(value => maxHp = parseInt(value));
            });

        new Setting(contentEl)
            .setName("Linked Domain")
            .setDesc("Completing tasks in this domain damages the boss")
            .addDropdown(dd => {
                DEFAULT_DOMAINS.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
                dd.onChange(value => domain = value);
            });

        // Boss templates - Easy click buttons
        contentEl.createEl('h4', { text: '⚡ Quick Templates (Click to create instantly!)' });
        const templateGrid = contentEl.createDiv({ cls: 'journey-boss-template-grid' });

        BOSS_TEMPLATES.forEach(template => {
            const templateBtn = templateGrid.createEl('button', { cls: 'journey-boss-template-btn' });
            templateBtn.innerHTML = `
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.desc}</div>
                <div class="template-stats">❤️ ${template.baseHp} HP</div>
            `;

            templateBtn.onclick = async () => {
                // Create boss instantly from template
                const boss = {
                    id: Date.now().toString(),
                    name: template.name,
                    description: template.desc,
                    icon: template.name.split(' ')[0], // Get emoji
                    maxHp: template.baseHp,
                    currentHp: template.baseHp,
                    domain: template.domain,
                    defeated: false,
                    createdAt: new Date().toISOString()
                };

                if (!this.plugin.settings.bossFights) {
                    this.plugin.settings.bossFights = [];
                }
                this.plugin.settings.bossFights.push(boss);

                // Log to Chronicle
                this.plugin.logActivity('boss_created', `Created boss: ${template.name}`, {
                    bossName: template.name,
                    domain: template.domain
                });

                await this.plugin.saveSettings();

                new Notice(`🐉 ${template.name} has appeared! Defeat it by completing quests!`);
                this.onSubmit();
                this.close();
            };
        });

        contentEl.createEl('hr');
        contentEl.createEl('h4', { text: '✏️ Or create custom boss:' });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("⚔️ Start Boss Fight!")
                .setCta()
                .onClick(async () => {
                    if (!name) {
                        new Notice("Boss needs a name!");
                        return;
                    }

                    const boss = {
                        id: Date.now().toString(),
                        name,
                        description,
                        icon,
                        maxHp,
                        currentHp: maxHp,
                        domain,
                        defeated: false,
                        createdAt: new Date().toISOString()
                    };

                    if (!this.plugin.settings.bossFights) {
                        this.plugin.settings.bossFights = [];
                    }
                    this.plugin.settings.bossFights.push(boss);

                    // Log to Chronicle
                    this.plugin.logActivity('boss_created', `Created boss: ${name}`, {
                        bossName: name,
                        domain: domain
                    });

                    await this.plugin.saveSettings();

                    new Notice(`🐉 Boss "${name}" has appeared! Defeat it by completing ${domain} tasks!`);
                    this.onSubmit();
                    this.close();
                }));
    }

    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// ADD SKILL MODAL
// ============================================================================
class AddSkillModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('rpg-add-skill-modal');

        contentEl.createEl('h2', { text: '🎯 Add New Skill' });

        let name = '';
        let category = 'vocation';
        let description = '';

        new Setting(contentEl)
            .setName('Skill Name')
            .setDesc('What skill are you developing?')
            .addText(text => text
                .setPlaceholder('e.g., Python Programming')
                .onChange(value => name = value));

        new Setting(contentEl)
            .setName('Category')
            .setDesc('Which quadrant does this skill belong to?')
            .addDropdown(dd => {
                Object.entries(SKILL_CATEGORIES).forEach(([id, info]) => {
                    dd.addOption(id, `${info.icon} ${info.name}`);
                });
                dd.setValue('vocation');
                dd.onChange(value => category = value);
            });

        new Setting(contentEl)
            .setName('Description')
            .setDesc('Optional description of this skill')
            .addTextArea(text => text
                .setPlaceholder('What does this skill involve?')
                .onChange(value => description = value));

        // Examples section
        const examplesDiv = contentEl.createDiv({ cls: 'rpg-skill-examples-section' });
        examplesDiv.createEl('h4', { text: '💡 Example Skills by Category' });

        Object.entries(SKILL_CATEGORIES).forEach(([id, info]) => {
            const catDiv = examplesDiv.createDiv({ cls: 'rpg-skill-example-cat' });
            catDiv.innerHTML = `<strong>${info.icon} ${info.name}:</strong> ${info.examples.join(', ')}`;
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close()))
            .addButton(btn => btn
                .setButtonText('Add Skill')
                .setCta()
                .onClick(async () => {
                    if (!name.trim()) {
                        new Notice('Please enter a skill name');
                        return;
                    }

                    const skillService = new SkillService(this.plugin);
                    const skill = skillService.createSkill(name.trim(), category, 'manual', description.trim());

                    this.plugin.logActivity('skill_added', `Added skill: ${skill.name}`, { category });

                    await this.plugin.saveSettings();
                    new Notice(`🎯 Skill added: ${skill.name}`);
                    this.onSubmit();
                    this.close();
                }));
    }

    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// NPC DIALOG MODAL
// ============================================================================
class NPCDialogModal extends Modal {
    constructor(app, plugin, npc, questSuggestion, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.npc = npc;
        this.questSuggestion = questSuggestion;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('rpg-npc-dialog-modal');

        // NPC Header
        const header = contentEl.createDiv({ cls: 'rpg-npc-dialog-header' });
        header.createDiv({ cls: 'rpg-npc-dialog-icon', text: this.npc.icon });
        const headerInfo = header.createDiv({ cls: 'rpg-npc-dialog-info' });
        headerInfo.createEl('h2', { text: this.npc.name });
        headerInfo.createDiv({ cls: 'rpg-npc-dialog-role', text: this.npc.role });

        // Dialogue
        const dialogueBox = contentEl.createDiv({ cls: 'rpg-npc-dialogue-box' });
        dialogueBox.createEl('p', { text: `"${this.npc.dialogue}"` });

        // Quest Suggestion
        if (this.questSuggestion) {
            const questSection = contentEl.createDiv({ cls: 'rpg-npc-quest-section' });
            questSection.createEl('h3', { text: '📜 Quest Suggestion' });

            const questCard = questSection.createDiv({ cls: 'rpg-npc-quest-card' });
            questCard.createDiv({ cls: 'rpg-npc-quest-domain', text: `${this.questSuggestion.domain.icon} ${this.questSuggestion.domain.name}` });
            questCard.createDiv({ cls: 'rpg-npc-quest-name', text: this.questSuggestion.questName });

            const rewards = questCard.createDiv({ cls: 'rpg-npc-quest-rewards' });
            rewards.createSpan({ text: `⭐ ${this.questSuggestion.xp} XP` });
            rewards.createSpan({ text: `💰 ${this.questSuggestion.gold}g` });

            const acceptBtn = questSection.createEl('button', {
                text: '✅ Accept Quest',
                cls: 'rpg-full-width-btn primary'
            });
            acceptBtn.onclick = async () => {
                const newQuest = {
                    name: this.questSuggestion.questName,
                    xp: this.questSuggestion.xp,
                    gold: this.questSuggestion.gold,
                    domain: this.questSuggestion.domain.id,
                    difficulty: 'medium',
                    completed: false,
                    npcGiver: this.npc.id
                };
                this.plugin.settings.quests.push(newQuest);

                // Log activity
                this.plugin.logActivity('quest_complete', `Accepted quest from ${this.npc.name}`, {
                    questName: this.questSuggestion.questName
                });

                await this.plugin.saveSettings();
                new Notice(`📜 Quest accepted: ${this.questSuggestion.questName}`);
                this.onSubmit();
                this.close();
            };
        } else {
            contentEl.createDiv({ cls: 'rpg-npc-no-quest', text: 'No quest available right now. Check back later!' });
        }

        // Close button
        const closeBtn = contentEl.createEl('button', {
            text: 'Farewell',
            cls: 'rpg-full-width-btn secondary'
        });
        closeBtn.onclick = () => this.close();
    }

    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

class TheJourneySettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'The Journey Settings' });

        // AI Settings Section
        containerEl.createEl('h3', { text: '🤖 AI Configuration' });

        const ai = this.plugin.settings.ai || {};
        const currentProvider = ai.provider || 'openrouter';

        // Provider Selection
        new Setting(containerEl)
            .setName('AI Provider')
            .setDesc('Choose your AI service provider for chat and coaching.')
            .addDropdown(dd => {
                Object.entries(AI_PROVIDERS).forEach(([id, provider]) => {
                    dd.addOption(id, `${provider.name} - ${provider.description}`);
                });
                dd.setValue(currentProvider);
                dd.onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.provider = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show provider-specific options
                });
            });

        // API Key for current provider
        const providerConfig = AI_PROVIDERS[currentProvider];
        const apiKeyPlaceholders = {
            openrouter: 'sk-or-v1-...',
            openai: 'sk-...',
            anthropic: 'sk-ant-...',
            google: 'AIza...'
        };

        new Setting(containerEl)
            .setName(`${providerConfig.name} API Key`)
            .setDesc(`Enter your ${providerConfig.name} API key`)
            .addText(text => text
                .setPlaceholder(apiKeyPlaceholders[currentProvider] || 'Enter API key...')
                .setValue(ai.apiKeys?.[currentProvider] || ai.openRouterApiKey || '')
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    if (!this.plugin.settings.ai.apiKeys) {
                        this.plugin.settings.ai.apiKeys = {};
                    }
                    this.plugin.settings.ai.apiKeys[currentProvider] = value;
                    // Also update legacy field for backwards compatibility
                    if (currentProvider === 'openrouter') {
                        this.plugin.settings.ai.openRouterApiKey = value;
                    }
                    await this.plugin.saveSettings();
                }));

        // Model Selection for current provider
        const chatModels = getChatModels(currentProvider);
        if (chatModels.length > 0) {
            new Setting(containerEl)
                .setName('Chat Model')
                .setDesc(`Choose which ${providerConfig.name} model to use for the Elder and coaching.`)
                .addDropdown(dd => {
                    chatModels.forEach(model => {
                        dd.addOption(model.id, model.name);
                    });
                    dd.setValue(ai.selectedModels?.[currentProvider] || chatModels[0].id);
                    dd.onChange(async (value) => {
                        if (!this.plugin.settings.ai) {
                            this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                        }
                        if (!this.plugin.settings.ai.selectedModels) {
                            this.plugin.settings.ai.selectedModels = {};
                        }
                        this.plugin.settings.ai.selectedModels[currentProvider] = value;
                        await this.plugin.saveSettings();
                    });
                });
        }

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness. Lower = more focused, Higher = more creative (0.0 - 1.0)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(ai.temperature || 0.7)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Maximum length of AI responses (100 - 4000)')
            .addText(text => text
                .setValue(String(ai.maxTokens || 1000))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 100 && num <= 4000) {
                        if (!this.plugin.settings.ai) {
                            this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                        }
                        this.plugin.settings.ai.maxTokens = num;
                        await this.plugin.saveSettings();
                    }
                }));

        // Provider-specific info
        const infoEl = containerEl.createDiv({ cls: 'rpg-settings-info' });
        const providerInstructions = {
            openrouter: {
                title: '📖 OpenRouter Setup',
                steps: [
                    'Go to openrouter.ai and create an account',
                    'Navigate to Keys section',
                    'Create a new API key',
                    'Copy and paste it above'
                ],
                note: 'OpenRouter provides access to 100+ AI models with one API key. Pay only for what you use.'
            },
            openai: {
                title: '📖 OpenAI Setup',
                steps: [
                    'Go to platform.openai.com',
                    'Sign in or create an account',
                    'Go to API Keys section',
                    'Create a new secret key'
                ],
                note: 'OpenAI provides GPT models directly. Requires a paid account with credits.'
            },
            anthropic: {
                title: '📖 Anthropic Setup',
                steps: [
                    'Go to console.anthropic.com',
                    'Sign in or create an account',
                    'Go to API Keys section',
                    'Create a new key'
                ],
                note: 'Anthropic provides Claude models directly. Note: Anthropic does not support embeddings.'
            },
            google: {
                title: '📖 Google AI Setup',
                steps: [
                    'Go to makersuite.google.com',
                    'Sign in with your Google account',
                    'Click "Get API key"',
                    'Create a key for a new or existing project'
                ],
                note: 'Google AI Studio provides Gemini models. Free tier available with rate limits.'
            }
        };

        const info = providerInstructions[currentProvider];
        infoEl.createEl('h4', { text: info.title });
        infoEl.createEl('ol', {}, ol => {
            info.steps.forEach(step => {
                ol.createEl('li', { text: step });
            });
        });
        infoEl.createEl('p', { text: info.note, cls: 'rpg-settings-note' });

        // Show configured providers status
        const configuredProviders = Object.entries(AI_PROVIDERS)
            .filter(([id]) => ai.apiKeys?.[id] || (id === 'openrouter' && ai.openRouterApiKey))
            .map(([id, config]) => config.name);

        if (configuredProviders.length > 0) {
            const statusEl = containerEl.createDiv({ cls: 'rpg-settings-status' });
            statusEl.innerHTML = `<strong>✅ Configured providers:</strong> ${configuredProviders.join(', ')}`;
        }

        // Journal Intelligence Section
        containerEl.createEl('h3', { text: '📓 Journal Intelligence' });

        new Setting(containerEl)
            .setName('Enable Journal Analysis')
            .setDesc('Analyze your journal entries to affect character stats')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.journalSettings?.enabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.journalSettings) {
                        this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                    }
                    this.plugin.settings.journalSettings.enabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Scan Mode')
            .setDesc('How to identify journal entries')
            .addDropdown(dropdown => dropdown
                .addOption('folder', 'By Folder')
                .addOption('tag', 'By Tag')
                .setValue(this.plugin.settings.journalSettings?.scanMode || 'folder')
                .onChange(async (value) => {
                    if (!this.plugin.settings.journalSettings) {
                        this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                    }
                    this.plugin.settings.journalSettings.scanMode = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show relevant option
                }));

        if (this.plugin.settings.journalSettings?.scanMode === 'folder' || !this.plugin.settings.journalSettings?.scanMode) {
            new Setting(containerEl)
                .setName('Journal Folder')
                .setDesc('Folder containing your journal entries (without leading slash)')
                .addText(text => text
                    .setPlaceholder('Journal')
                    .setValue(this.plugin.settings.journalSettings?.journalFolder || 'Journal')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.journalSettings) {
                            this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                        }
                        this.plugin.settings.journalSettings.journalFolder = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            new Setting(containerEl)
                .setName('Journal Tag')
                .setDesc('Tag to identify journal entries')
                .addText(text => text
                    .setPlaceholder('#journal')
                    .setValue(this.plugin.settings.journalSettings?.journalTag || '#journal')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.journalSettings) {
                            this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                        }
                        this.plugin.settings.journalSettings.journalTag = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Info about Journal Intelligence
        const journalInfoEl = containerEl.createDiv({ cls: 'rpg-settings-info' });
        journalInfoEl.innerHTML = `
            <p><strong>How Journal Intelligence Works:</strong></p>
            <ul>
                <li>Scans journal entries for keywords related to life domains</li>
                <li>Analyzes sentiment (positive/negative) to adjust HP and XP</li>
                <li>Longer entries earn Gold (1g per 100 words)</li>
                <li>With AI enabled, provides deeper analysis and personalized suggestions</li>
            </ul>
        `;

        // Embedding & Semantic Search Section
        containerEl.createEl('h3', { text: '🔍 Semantic Search & Elder Memory' });

        new Setting(containerEl)
            .setName('Enable Embeddings')
            .setDesc('Create embeddings for journal entries to enable semantic search and Elder memory.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ai?.embeddingEnabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.embeddingEnabled = value;
                    await this.plugin.saveSettings();
                }));

        // Embedding Provider Selection (only providers that support embeddings)
        const embeddingProviders = Object.entries(AI_PROVIDERS)
            .filter(([id, config]) => config.supportsEmbeddings);

        const currentEmbeddingProvider = this.plugin.settings.ai?.embeddingProvider ||
                                         this.plugin.settings.ai?.provider || 'openrouter';

        new Setting(containerEl)
            .setName('Embedding Provider')
            .setDesc('Choose which provider to use for embeddings (can be different from chat).')
            .addDropdown(dd => {
                embeddingProviders.forEach(([id, config]) => {
                    dd.addOption(id, config.name);
                });
                dd.setValue(currentEmbeddingProvider);
                dd.onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.embeddingProvider = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show provider-specific models
                });
            });

        // Embedding Model Selection for current embedding provider
        const embeddingModels = getEmbeddingModels(currentEmbeddingProvider);
        if (embeddingModels.length > 0) {
            new Setting(containerEl)
                .setName('Embedding Model')
                .setDesc(`Choose which ${AI_PROVIDERS[currentEmbeddingProvider].name} model to use for embeddings.`)
                .addDropdown(dd => {
                    embeddingModels.forEach(model => {
                        dd.addOption(model.id, `${model.name} (${model.dimensions}d)`);
                    });
                    const currentModel = this.plugin.settings.ai?.selectedEmbeddingModels?.[currentEmbeddingProvider] ||
                                        embeddingModels[0].id;
                    dd.setValue(currentModel);
                    dd.onChange(async (value) => {
                        if (!this.plugin.settings.ai) {
                            this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                        }
                        if (!this.plugin.settings.ai.selectedEmbeddingModels) {
                            this.plugin.settings.ai.selectedEmbeddingModels = {};
                        }
                        this.plugin.settings.ai.selectedEmbeddingModels[currentEmbeddingProvider] = value;
                        await this.plugin.saveSettings();
                    });
                });
        } else {
            const noEmbedMsg = containerEl.createDiv({ cls: 'rpg-settings-warning' });
            noEmbedMsg.textContent = `⚠️ ${AI_PROVIDERS[currentEmbeddingProvider]?.name || 'This provider'} does not support embeddings. Please choose a different embedding provider.`;
        }

        // Check if embedding provider has API key configured
        const embeddingApiKey = this.plugin.settings.ai?.apiKeys?.[currentEmbeddingProvider] ||
                               (currentEmbeddingProvider === 'openrouter' ? this.plugin.settings.ai?.openRouterApiKey : '');
        if (!embeddingApiKey && embeddingModels.length > 0) {
            const warningEl = containerEl.createDiv({ cls: 'rpg-settings-warning' });
            warningEl.textContent = `⚠️ No API key configured for ${AI_PROVIDERS[currentEmbeddingProvider].name}. Please add your API key above.`;
        }

        new Setting(containerEl)
            .setName('Elder Memory')
            .setDesc('Allow the Elder to recall relevant past journal entries when chatting.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.ai?.elderMemoryEnabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.elderMemoryEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Memory Count')
            .setDesc('Number of relevant past entries to include in Elder conversations (1-5)')
            .addSlider(slider => slider
                .setLimits(1, 5, 1)
                .setValue(this.plugin.settings.ai?.elderMemoryCount || 3)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = JSON.parse(JSON.stringify(DEFAULT_AI_SETTINGS));
                    }
                    this.plugin.settings.ai.elderMemoryCount = value;
                    await this.plugin.saveSettings();
                }));

        // Embedding stats
        const embeddingsCount = this.plugin.settings.journalSettings?.embeddings?.length || 0;
        const embeddingInfoEl = containerEl.createDiv({ cls: 'rpg-settings-info' });
        embeddingInfoEl.innerHTML = `
            <p><strong>Embedding Statistics:</strong></p>
            <ul>
                <li>Journal entries indexed: ${embeddingsCount}</li>
                <li>Embedding provider: ${AI_PROVIDERS[currentEmbeddingProvider]?.name || currentEmbeddingProvider}</li>
                <li>Semantic search: ${embeddingsCount > 0 ? '✅ Available' : '❌ Sync journals first'}</li>
                <li>Elder memory: ${this.plugin.settings.ai?.elderMemoryEnabled && embeddingsCount > 0 ? '✅ Active' : '❌ Needs embeddings'}</li>
            </ul>
        `;

        // Clear embeddings button
        if (embeddingsCount > 0) {
            new Setting(containerEl)
                .setName('Clear Embeddings')
                .setDesc('Remove all stored embeddings. You will need to sync journals again to recreate them.')
                .addButton(btn => btn
                    .setButtonText('Clear All Embeddings')
                    .setWarning()
                    .onClick(async () => {
                        if (!this.plugin.settings.journalSettings) {
                            this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                        }
                        this.plugin.settings.journalSettings.embeddings = [];
                        await this.plugin.saveSettings();
                        new Notice('🗑️ All embeddings cleared');
                        this.display();
                    }));
        }

        // Update Plugin Section
        containerEl.createEl('h3', { text: '🔄 Plugin Updates' });

        new Setting(containerEl)
            .setName('Check for Updates')
            .setDesc('Check GitHub for the latest version of The Journey plugin')
            .addButton(btn => btn
                .setButtonText('🔄 Check Updates')
                .onClick(async () => {
                    btn.setButtonText('Checking...');
                    btn.setDisabled(true);
                    try {
                        const response = await requestUrl({
                            url: 'https://api.github.com/repos/huyhung/the-journey-obsidian/releases/latest',
                            method: 'GET'
                        });
                        const latestVersion = response.json.tag_name?.replace('v', '') || 'unknown';
                        const currentVersion = this.plugin.manifest.version;

                        if (latestVersion !== 'unknown' && latestVersion !== currentVersion) {
                            new Notice(`🎉 New version available: v${latestVersion} (current: v${currentVersion})\n\nDownload from GitHub to update!`, 8000);
                        } else if (latestVersion === currentVersion) {
                            new Notice(`✅ You're up to date! (v${currentVersion})`);
                        } else {
                            new Notice(`Current version: v${currentVersion}\nCheck GitHub for updates.`);
                        }
                    } catch (e) {
                        new Notice(`ℹ️ Current version: v${this.plugin.manifest.version}\n\nVisit GitHub to check for updates.`);
                    }
                    btn.setButtonText('🔄 Check Updates');
                    btn.setDisabled(false);
                }))
            .addButton(btn => btn
                .setButtonText('📂 Open GitHub')
                .onClick(() => {
                    window.open('https://github.com/huyhung/the-journey-obsidian/releases', '_blank');
                }));

        // Game Actions Section
        containerEl.createEl('h3', { text: '🎮 Game Actions' });

        new Setting(containerEl)
            .setName('Heal HP')
            .setDesc('Manually restore health points')
            .addButton(btn => btn
                .setButtonText('Heal 10 HP')
                .onClick(async () => {
                    this.plugin.heal(10);
                    new Notice('💚 Healed 10 HP!');
                }))
            .addButton(btn => btn
                .setButtonText('Full Heal')
                .onClick(async () => {
                    this.plugin.settings.hp = this.plugin.settings.maxHp;
                    await this.plugin.saveSettings();
                    new Notice('💚 Fully healed!');
                }));

        new Setting(containerEl)
            .setName('Take Damage')
            .setDesc('Manually reduce health points (for testing)')
            .addButton(btn => btn
                .setButtonText('Take 10 Damage')
                .onClick(async () => {
                    this.plugin.takeDamage(10);
                    new Notice('💔 Took 10 damage!');
                }));

        new Setting(containerEl)
            .setName('Add Gold')
            .setDesc('Manually add gold (for testing)')
            .addButton(btn => btn
                .setButtonText('+50 Gold')
                .onClick(async () => {
                    this.plugin.settings.gold += 50;
                    await this.plugin.saveSettings();
                    new Notice('🪙 Added 50 gold!');
                }));

        // Danger Zone
        containerEl.createEl('h3', { text: '⚠️ Danger Zone' });

        new Setting(containerEl)
            .setName('Clear Chat History')
            .setDesc('Delete all AI conversation history')
            .addButton(btn => btn
                .setButtonText('Clear Chat')
                .setWarning()
                .onClick(async () => {
                    if (confirm('Clear all AI chat history?')) {
                        if (this.plugin.settings.ai) {
                            this.plugin.settings.ai.chatHistory = [];
                        }
                        await this.plugin.saveSettings();
                        new Notice('🗑️ Chat history cleared!');
                    }
                }));

        new Setting(containerEl)
            .setName('Reset Character')
            .setDesc('⚠️ Complete fresh start - deletes ALL data: character profile, habits, quests, bosses, skills, journal history. You can create a new character and sync journal from scratch.')
            .addButton(btn => btn
                .setButtonText('🗑️ Delete & Start Fresh')
                .setWarning()
                .onClick(async () => {
                    if (confirm('⚠️ DELETE EVERYTHING?\n\nThis will permanently remove:\n• Character profile & assessment\n• All habits and quests\n• Boss fights & dungeons\n• Skills discovered\n• Mood & sleep logs\n• Journal analysis history\n\nYou will start completely fresh like a new player.\n\nThis cannot be undone!')) {
                        await this.plugin.resetAllData();
                        new Notice('🔄 Character deleted! Open The Journey to create a new hero.');
                        this.display(); // Refresh settings view
                    }
                }));
    }
}

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

module.exports = class TheJourneyPlugin extends Plugin {
    async onload() {
        console.log('Loading The Journey Plugin v0.10.8');
        await this.loadSettings();
        this.checkDailyReset();

        this.registerView(VIEW_TYPE_HERO, (leaf) => new JourneyView(leaf, this));
        this.addRibbonIcon('compass', 'Open The Journey', () => this.activateView());
        this.addCommand({ id: 'open-journey', name: 'Open The Journey', callback: () => this.activateView() });
        this.addCommand({ id: 'create-character', name: 'Create/Retake Character Assessment', callback: () => {
            new CharacterCreationModal(this.app, this, () => this.refreshViews()).open();
        }});
        this.addCommand({ id: 'ai-generate-quests', name: 'AI: Generate Quests', callback: () => {
            if (!this.settings.ai?.openRouterApiKey) {
                new Notice('⚠️ Configure OpenRouter API key in Settings → The Journey');
                return;
            }
            new AIQuestGeneratorModal(this.app, this, () => this.refreshViews()).open();
        }});

        // Add settings tab
        this.addSettingTab(new TheJourneySettingTab(this.app, this));

        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        this.registerEvent(this.app.workspace.on('editor-change', (editor, info) => this.handleQuestCompletion(editor)));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_HERO);
    }

    async loadSettings() {
        const saved = await this.loadData() || {};

        // Migrate from old skills to domains
        let domains;
        if (saved.domains) {
            domains = saved.domains;
        } else if (saved.skills) {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            domains = DEFAULT_DOMAINS.map(d => {
                const oldSkill = saved.skills.find(s => skillToDomain[s.id] === d.id);
                return oldSkill ? { ...d, level: oldSkill.level, xp: oldSkill.xp } : d;
            });
        } else {
            domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
        }

        // Migrate habits
        const migratedHabits = (saved.habits || []).map(h => {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            return {
                ...h,
                domain: h.domain || skillToDomain[h.skill] || 'health',
                difficulty: h.difficulty || 'medium',
                streak: h.streak || 0,
                bestStreak: h.bestStreak || 0,
                lastCompletedDate: h.lastCompletedDate || null
            };
        });

        // Migrate quests
        const migratedQuests = (saved.quests || []).map(q => {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            return {
                ...q,
                domain: q.domain || skillToDomain[q.skill] || 'education'
            };
        });

        // Merge achievements
        const mergedAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
            const savedAch = (saved.achievements || []).find(a => a.id === defaultAch.id);
            return savedAch ? { ...defaultAch, unlocked: savedAch.unlocked } : defaultAch;
        });

        this.settings = {
            level: saved.level || 1,
            xp: saved.xp || 0,
            hp: saved.hp || 100,
            maxHp: saved.maxHp || 100,
            gold: saved.gold || 0,
            totalGoldEarned: saved.totalGoldEarned || 0,
            totalHabitsCompleted: saved.totalHabitsCompleted || 0,
            totalQuestsCompleted: saved.totalQuestsCompleted || 0,
            lastPlayedDate: saved.lastPlayedDate || new Date().toDateString(),
            domains: domains,
            habits: migratedHabits,
            badHabits: saved.badHabits || [],
            quests: migratedQuests,
            rewards: saved.rewards || [],
            achievements: mergedAchievements,
            characterProfile: saved.characterProfile || null,
            ai: saved.ai || { ...DEFAULT_AI_SETTINGS },
            aiQuestsGenerated: saved.aiQuestsGenerated || 0,
            // HUMAN 3.0 Framework
            currentPhase: saved.currentPhase || 'dissonance',
            psychicEntropy: saved.psychicEntropy || 0,
            lastWisdomDate: saved.lastWisdomDate || null,
            dailyWisdom: saved.dailyWisdom || null,
            // Activity Log & NPC System
            activityLog: saved.activityLog || [],
            npcs: saved.npcs || JSON.parse(JSON.stringify(DEFAULT_NPCS)),
            lastPenaltyCheck: saved.lastPenaltyCheck || null,
            penaltyEnabled: saved.penaltyEnabled !== undefined ? saved.penaltyEnabled : true,
            // Boss Fight System
            bossFights: saved.bossFights || [],
            totalBossesDefeated: saved.totalBossesDefeated || 0,
            // Dungeon System (Focus Sessions)
            activeDungeon: saved.activeDungeon || null,
            totalDungeonsCleared: saved.totalDungeonsCleared || 0,
            totalFocusMinutes: saved.totalFocusMinutes || 0,
            // Energy Station
            energy: saved.energy || 100,
            maxEnergy: saved.maxEnergy || 100,
            moodLog: saved.moodLog || [],
            lastMoodCheck: saved.lastMoodCheck || null,
            sleepLog: saved.sleepLog || [],
            // Difficulty
            gameDifficulty: saved.gameDifficulty || 'normal',
            // Daily Summary
            dailyStats: saved.dailyStats || {},
            // Journal Intelligence
            journalSettings: saved.journalSettings || JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS)),
            // Skills System (IMPORTANT: Must load from saved data!)
            skillsSettings: saved.skillsSettings || JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS)),
            // Last mood tracking
            lastMood: saved.lastMood || null
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateStatusBar();
    }

    async resetAllData() {
        this.settings = {
            level: 1, xp: 0, hp: 100, maxHp: 100, gold: 0,
            totalGoldEarned: 0, totalHabitsCompleted: 0, totalQuestsCompleted: 0,
            lastPlayedDate: new Date().toDateString(),
            domains: JSON.parse(JSON.stringify(DEFAULT_DOMAINS)),
            habits: [], badHabits: [], quests: [], rewards: [], skills: [],
            achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
            characterProfile: null,
            ai: { ...DEFAULT_AI_SETTINGS },
            aiQuestsGenerated: 0,
            // HUMAN 3.0 Framework
            currentPhase: 'dissonance',
            psychicEntropy: 0,
            lastWisdomDate: null,
            dailyWisdom: null,
            // Activity Log & NPC System
            activityLog: [],
            npcs: JSON.parse(JSON.stringify(DEFAULT_NPCS)),
            lastPenaltyCheck: null,
            penaltyEnabled: true,
            // Boss Fight System
            bossFights: [],
            totalBossesDefeated: 0,
            // Dungeon System
            activeDungeon: null,
            totalDungeonsCleared: 0,
            totalFocusMinutes: 0,
            // Energy Station
            energy: 100,
            maxEnergy: 100,
            moodLog: [],
            lastMoodCheck: null,
            sleepLog: [],
            // Difficulty & Daily
            gameDifficulty: 'normal',
            dailyStats: {},
            // Journal Intelligence
            journalSettings: JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS)),
            // Skills System
            skillsSettings: JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS)),
            // Last mood
            lastMood: null
        };
        await this.saveSettings();
        new Notice("🔄 All data has been reset!");
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (this.settings.lastPlayedDate !== today) {
            console.log("The Journey: New Day Detected!");

            this.settings.habits.forEach(h => {
                if (h.completed && h.lastCompletedDate === yesterday) {
                    h.streak = (h.streak || 0) + 1;
                    h.bestStreak = Math.max(h.bestStreak || 0, h.streak);
                } else if (!h.completed) {
                    h.streak = 0;
                }
                h.completed = false;
            });

            // Increase entropy for incomplete tasks (HUMAN 3.0)
            const incompleteTasks = this.settings.quests.filter(q => !q.completed).length;
            if (incompleteTasks > 0) {
                this.settings.psychicEntropy = Math.min(100, (this.settings.psychicEntropy || 0) + incompleteTasks * 2);
            }

            this.settings.lastPlayedDate = today;
            this.saveSettings();
            this.checkAchievements();
            this.checkWeeklyPenalty(); // Check for debt penalty
            new Notice("☀️ New day! Habits reset. Keep your streaks going!");
        }
    }

    async handleQuestCompletion(editor) {
        const lineCount = editor.lineCount();
        let changesMade = false;

        for (let i = 0; i < lineCount; i++) {
            const line = editor.getLine(i);
            const questRegex = /^\s*-\s*\[x\]\s*(.*?)#quest(?!\S)/;
            const match = line.match(questRegex);

            if (match) {
                this.gainXp(20, 10, 'education');
                const newLine = line.replace("#quest", "#quest-done");
                editor.setLine(i, newLine);
                changesMade = true;
            }
        }

        if (changesMade) this.refreshViews();
    }

    // --- GAME LOGIC ---

    gainXp(xpAmount, goldAmount, domainId = null) {
        const s = this.settings;

        // Apply phase XP multiplier (HUMAN 3.0)
        const currentPhase = determinePhase(s);
        const adjustedXP = calculateXPWithPhase(xpAmount, currentPhase);
        const phaseInfo = PHASES[currentPhase];

        s.xp += adjustedXP;
        s.gold += goldAmount;
        s.totalGoldEarned += goldAmount;

        // Reduce psychic entropy when completing tasks
        reduceEntropy(s, 5);

        if (domainId) {
            const domain = s.domains.find(d => d.id === domainId);
            if (domain) {
                domain.xp += adjustedXP;
                const domainXpNeeded = domain.level * 50;
                if (domain.xp >= domainXpNeeded) {
                    domain.level++;
                    domain.xp = 0;
                    domain.score = Math.min(100, domain.score + 2);
                    new Notice(`📈 ${domain.icon} ${domain.name} leveled up to ${domain.level}!`);
                }

                // Damage bosses linked to this domain
                this.damageBossesForDomain(domainId, 10);
            }
        }

        const xpToNextLevel = s.level * 100;
        if (s.xp >= xpToNextLevel) {
            this.levelUp();
        } else {
            // Show XP with phase multiplier info
            const multiplierText = phaseInfo.xpMultiplier > 1 ? ` (×${phaseInfo.xpMultiplier} ${phaseInfo.name})` : '';
            new Notice(`+${adjustedXP} XP${multiplierText} | +${goldAmount} Gold`);
        }

        this.saveSettings();
        this.checkAchievements();
    }

    levelUp() {
        const s = this.settings;
        const oldLevel = s.level;
        s.level++;
        s.xp = 0;
        s.maxHp += 10;
        s.hp = s.maxHp;

        // Grant skill points on level up
        if (!s.skillsSettings) {
            s.skillsSettings = JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS));
        }
        const skillPointsGained = s.skillsSettings.skillPointsPerLevel || 1;
        s.skillsSettings.availableSkillPoints = (s.skillsSettings.availableSkillPoints || 0) + skillPointsGained;

        // Check for HUMAN tier advancement
        const oldDevLevel = getDevelopmentLevel(oldLevel);
        const newDevLevel = getDevelopmentLevel(s.level);

        // Log activity
        this.logActivity('level_up', `Reached Level ${s.level}!`, { newLevel: s.level, devLevel: newDevLevel, skillPointsGained });

        if (oldDevLevel !== newDevLevel) {
            // HUMAN tier advancement!
            const devInfo = DEVELOPMENT_LEVELS[newDevLevel];
            new Notice(`🌟 HUMAN ${newDevLevel} UNLOCKED! 🌟\n${devInfo.icon} ${devInfo.name} - ${devInfo.journey}\n+${skillPointsGained} Skill Point!`, 10000);
            this.logActivity('tier_up', `Advanced to HUMAN ${newDevLevel} - ${devInfo.name}!`, { tier: newDevLevel });
        } else {
            new Notice(`🎉 LEVEL UP! You are now Level ${s.level}!\n+${skillPointsGained} Skill Point`);
        }

        this.checkAchievements();
    }

    takeDamage(amount) {
        const s = this.settings;
        s.hp -= amount;
        if (s.hp <= 0) {
            s.hp = 0;
            new Notice(`💀 YOU FAINTED. Lost some XP.`);
            s.xp = Math.max(0, s.xp - 50);
            s.hp = Math.floor(s.maxHp / 2);
        } else {
            new Notice(`-${amount} HP`);
        }
        this.saveSettings();
    }

    heal(amount) {
        this.settings.hp = Math.min(this.settings.maxHp, this.settings.hp + amount);
        this.saveSettings();
    }

    async completeHabit(index) {
        const s = this.settings;
        const habit = s.habits[index];
        if (habit && !habit.completed) {
            habit.completed = true;
            habit.lastCompleted = new Date().toISOString();
            habit.lastCompletedDate = new Date().toDateString();
            s.totalHabitsCompleted++;

            const diff = DIFFICULTY[habit.difficulty || 'medium'];
            const streakBonus = Math.min((habit.streak || 0) * 0.1, 1);
            const finalXp = Math.round(habit.xp * diff.multiplier * (1 + streakBonus));
            const finalGold = Math.round(habit.gold * diff.multiplier * (1 + streakBonus));

            // HP Reward for good habits
            const hpReward = habit.hpReward || diff.hpReward || 5;
            s.hp = Math.min(s.maxHp, s.hp + hpReward);

            // Log activity
            this.logActivity('habit_complete', habit.name, {
                xp: finalXp,
                gold: finalGold,
                hpGain: hpReward,
                streak: habit.streak || 0
            });

            this.gainXp(finalXp, finalGold, habit.domain);
            new Notice(`✅ ${habit.name} +${finalXp} XP +${hpReward} HP`);
        }
    }

    async removeHabit(index) {
        this.settings.habits.splice(index, 1);
        await this.saveSettings();
    }

    async completeQuest(index) {
        const s = this.settings;
        const quest = s.quests[index];
        if (quest && !quest.completed) {
            quest.completed = true;
            quest.completedDate = new Date().toISOString();
            s.totalQuestsCompleted++;

            const diff = DIFFICULTY[quest.difficulty || 'medium'];
            let finalXp = Math.round(quest.xp * diff.multiplier);
            let finalGold = Math.round(quest.gold * diff.multiplier);

            // Player takes damage (boss fight cost)
            const playerDamage = diff.bossDamage || 10;
            s.hp = Math.max(1, s.hp - playerDamage);

            // Damage active bosses!
            const bossDamageDealt = Math.round(playerDamage * 1.5);
            let bossDefeated = null;
            const activeBosses = (s.bossFights || []).filter(b => !b.defeated);

            if (activeBosses.length > 0) {
                // Damage all active bosses (or just the first one matching domain)
                const targetBoss = activeBosses.find(b => b.domain === quest.domain) || activeBosses[0];
                if (targetBoss) {
                    targetBoss.currentHp = Math.max(0, targetBoss.currentHp - bossDamageDealt);

                    if (targetBoss.currentHp <= 0) {
                        targetBoss.defeated = true;
                        targetBoss.defeatedAt = new Date().toISOString();
                        bossDefeated = targetBoss;

                        // Boss defeat rewards!
                        const bossReward = Math.round(targetBoss.maxHp * 0.5);
                        s.gold += bossReward;
                        finalXp += targetBoss.maxHp;
                    }
                }
            }

            // Check for Flow State bonus (HUMAN 3.0)
            const flowState = checkFlowState(quest.difficulty || 'medium', s.level);
            if (flowState.inFlow) {
                finalXp = Math.round(finalXp * 1.25);
                new Notice(`🌊 ${flowState.message}`);
            }

            // Log activity
            this.logActivity('quest_complete', quest.name, {
                xp: finalXp,
                gold: finalGold,
                playerDamage: playerDamage,
                bossDamage: bossDamageDealt,
                difficulty: quest.difficulty || 'medium',
                inFlow: flowState.inFlow
            });

            this.gainXp(finalXp, finalGold, quest.domain);

            // Notification
            if (bossDefeated) {
                new Notice(`🎉 BOSS DEFEATED! ${bossDefeated.name} is slain!\n+${targetBoss.maxHp} XP | +${Math.round(targetBoss.maxHp * 0.5)} Gold!`, 5000);
            } else if (activeBosses.length > 0) {
                new Notice(`⚔️ Quest Complete! You: -${playerDamage}❤️ | Boss: -${bossDamageDealt}❤️\n+${finalXp} XP`);
            } else {
                new Notice(`⚔️ Quest Complete: ${quest.name}\n+${finalXp} XP | -${playerDamage} HP`);
            }
        }
    }

    async removeQuest(index) {
        this.settings.quests.splice(index, 1);
        await this.saveSettings();
    }

    async triggerBadHabit(index) {
        const s = this.settings;
        const habit = s.badHabits[index];
        if (habit) {
            habit.triggerCount++;
            s.gold = Math.max(0, s.gold - habit.goldPenalty);
            this.takeDamage(habit.hpCost);

            // Increase psychic entropy (HUMAN 3.0)
            s.psychicEntropy = Math.min(100, (s.psychicEntropy || 0) + 10);

            // Log activity
            this.logActivity('bad_habit', habit.name, {
                hpLost: habit.hpCost,
                goldLost: habit.goldPenalty,
                triggerCount: habit.triggerCount
            });

            new Notice(`😔 -${habit.hpCost} HP | -${habit.goldPenalty}g | +10 Entropy`);
            await this.saveSettings();
        }
    }

    async removeBadHabit(index) {
        this.settings.badHabits.splice(index, 1);
        await this.saveSettings();
    }

    // ============================================================================
    // ACTIVITY LOG SYSTEM
    // ============================================================================
    logActivity(category, description, details = {}) {
        const s = this.settings;
        const activity = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            category: category,
            description: description,
            details: details
        };

        // Keep last 100 activities
        s.activityLog = [activity, ...(s.activityLog || [])].slice(0, 100);
    }

    // ============================================================================
    // INN/HOTEL RECOVERY SYSTEM
    // ============================================================================
    async restAtInn(tierId) {
        const s = this.settings;
        const inn = INN_TIERS.find(i => i.id === tierId);

        if (!inn) {
            new Notice('❌ Invalid inn tier!');
            return false;
        }

        if (s.gold < inn.cost) {
            new Notice(`❌ Not enough gold! Need ${inn.cost}g`);
            return false;
        }

        if (s.hp >= s.maxHp) {
            new Notice('❤️ You are already at full health!');
            return false;
        }

        s.gold -= inn.cost;
        const oldHp = s.hp;
        s.hp = Math.min(s.maxHp, s.hp + inn.hpRecover);
        const actualRecovery = s.hp - oldHp;

        // Log activity
        this.logActivity('inn_rest', `Rested at ${inn.name}`, {
            hpRecovered: actualRecovery,
            goldSpent: inn.cost
        });

        // Reduce entropy (rest reduces chaos)
        s.psychicEntropy = Math.max(0, (s.psychicEntropy || 0) - 15);

        await this.saveSettings();
        new Notice(`${inn.name}: +${actualRecovery} HP | -${inn.cost}g | -15 Entropy`);
        return true;
    }

    // ============================================================================
    // BOSS FIGHT SYSTEM
    // ============================================================================
    async damageBoss(bossIndex, damage) {
        const s = this.settings;
        const boss = s.bossFights[bossIndex];

        if (!boss || boss.defeated) return;

        boss.currentHp = Math.max(0, boss.currentHp - damage);

        // Log activity
        this.logActivity('boss_damage', `Dealt ${damage} damage to ${boss.name}`, {
            damage,
            remaining: boss.currentHp
        });

        // Check if boss is defeated
        if (boss.currentHp <= 0) {
            boss.defeated = true;
            boss.defeatedAt = new Date().toISOString();
            s.totalBossesDefeated = (s.totalBossesDefeated || 0) + 1;

            // Rewards for defeating boss
            const xpReward = boss.maxHp * 2;
            const goldReward = boss.maxHp;

            s.xp += xpReward;
            s.gold += goldReward;

            this.logActivity('boss_defeated', `Defeated ${boss.name}!`, {
                xp: xpReward,
                gold: goldReward
            });

            new Notice(`🎉 BOSS DEFEATED: ${boss.name}!\n+${xpReward} XP | +${goldReward}g`);
            this.checkAchievements();
        } else {
            new Notice(`⚔️ ${boss.name} takes ${damage} damage! (${boss.currentHp}/${boss.maxHp} HP remaining)`);
        }

        await this.saveSettings();
    }

    // Damage bosses when completing domain tasks
    damageBossesForDomain(domainId, baseDamage = 10) {
        const s = this.settings;
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated && b.domain === domainId);

        activeBosses.forEach((boss, idx) => {
            const bossIndex = s.bossFights.indexOf(boss);
            this.damageBoss(bossIndex, baseDamage);
        });
    }

    // ============================================================================
    // PENALTY SYSTEM (Weekly check for negative gold)
    // ============================================================================
    checkWeeklyPenalty() {
        const s = this.settings;
        if (!s.penaltyEnabled) return;

        const now = new Date();
        const lastCheck = s.lastPenaltyCheck ? new Date(s.lastPenaltyCheck) : null;

        // Check if a week has passed
        if (lastCheck) {
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            if (now - lastCheck < weekInMs) return;
        }

        // Apply penalty if gold is negative
        if (s.gold < 0) {
            const penalty = Math.min(Math.abs(s.gold), 20); // Max 20 HP penalty
            this.takeDamage(penalty);
            this.logActivity('damage', `Weekly debt penalty`, { hpLost: penalty, debt: s.gold });
            new Notice(`💀 Weekly Penalty: -${penalty} HP for ${s.gold}g debt!`);
        }

        s.lastPenaltyCheck = now.toISOString();
        this.saveSettings();
    }

    // ============================================================================
    // NPC INTERACTION
    // ============================================================================
    getNPCDialogue(npcId) {
        const npc = this.settings.npcs.find(n => n.id === npcId) || DEFAULT_NPCS.find(n => n.id === npcId);
        return npc ? npc.dialogue : "...";
    }

    getNPCQuestSuggestion(npcId) {
        const s = this.settings;
        const npc = DEFAULT_NPCS.find(n => n.id === npcId);
        if (!npc) return null;

        // Find lowest scoring domain that this NPC covers
        const relevantDomains = s.domains.filter(d => npc.questTypes.includes(d.id));
        if (relevantDomains.length === 0) return null;

        const lowestDomain = relevantDomains.reduce((a, b) => a.score < b.score ? a : b);

        // Generate quest suggestion based on domain
        const suggestions = {
            health: ['Go for a 30-minute walk', 'Drink 8 glasses of water today', 'Do 20 push-ups', 'Sleep before 11 PM'],
            education: ['Read for 30 minutes', 'Complete an online lesson', 'Learn 10 new vocabulary words', 'Watch an educational video'],
            psychologicalWellbeing: ['Meditate for 10 minutes', 'Write 3 things you are grateful for', 'Call a friend', 'Take a digital detox hour'],
            timeUse: ['Plan tomorrow with time blocks', 'Complete your MIT (Most Important Task)', 'Declutter one area', 'Review weekly goals'],
            communityVitality: ['Help someone today', 'Send an appreciation message', 'Attend a community event', 'Volunteer for an hour'],
            livingStandards: ['Review your budget', 'Save $10 today', 'Learn about investing', 'Track all expenses today'],
            ecologicalAwareness: ['Use reusable bags', 'Plant something', 'Reduce water usage', 'Walk instead of driving'],
            culturalResilience: ['Practice a traditional skill', 'Cook a cultural dish', 'Share a story from your heritage', 'Learn about your ancestry'],
            goodGovernance: ['Set clear boundaries', 'Make a decision you have been avoiding', 'Organize your workspace', 'Create a personal policy']
        };

        const domainSuggestions = suggestions[lowestDomain.id] || ['Complete a meaningful task'];
        const randomSuggestion = domainSuggestions[Math.floor(Math.random() * domainSuggestions.length)];

        return {
            npc: npc,
            domain: lowestDomain,
            questName: randomSuggestion,
            xp: 15 + Math.floor(Math.random() * 10),
            gold: 5 + Math.floor(Math.random() * 5)
        };
    }

    async buyReward(index) {
        const s = this.settings;
        const reward = s.rewards[index];
        if (s.gold >= reward.cost) {
            s.gold -= reward.cost;

            // Log activity
            this.logActivity('shop_purchase', reward.name, { cost: reward.cost });

            new Notice(`🎁 Purchased: ${reward.name}!`);
            await this.saveSettings();
        } else {
            new Notice(`Not enough gold!`);
        }
    }

    async removeReward(index) {
        this.settings.rewards.splice(index, 1);
        await this.saveSettings();
    }

    // ============================================================================
    // JOURNAL INTELLIGENCE SYSTEM
    // ============================================================================

    async syncJournals() {
        const js = this.settings.journalSettings;
        if (!js.enabled) {
            new Notice('📓 Journal Intelligence is disabled. Enable it in settings.');
            return;
        }

        // Check if folder exists (for folder mode)
        if (js.scanMode === 'folder') {
            const folder = this.app.vault.getAbstractFileByPath(js.journalFolder);
            if (!folder) {
                new Notice(`📓 Journal folder "${js.journalFolder}" not found!\n\nCreate this folder or change it in Settings → The Journey → Journal Settings.`, 8000);
                return;
            }
        }

        // Check API key for AI features
        const hasApiKey = !!this.settings.ai?.openRouterApiKey;
        if (!hasApiKey) {
            console.log('⚠️ No API key - using offline analysis only. Skill discovery disabled.');
        }

        // Initialize aiService if API key exists
        const aiService = hasApiKey ? new AIService(this) : null;

        const analyzer = new JournalAnalyzer(this);
        // Set aiService on the plugin temporarily for the analyzer to use
        this.aiService = aiService;

        // Get all journal notes first to check
        const allJournals = await analyzer.getJournalNotes();
        console.log(`📓 Found ${allJournals.length} total journal files in "${js.journalFolder}"`);

        if (allJournals.length === 0) {
            new Notice(`📓 No journal files found in "${js.journalFolder}" folder.\n\nAdd markdown files to this folder and try again.`, 6000);
            return;
        }

        const newNotes = await analyzer.getNewNotes();
        console.log(`📓 ${newNotes.length} new/modified journals since last sync`);

        if (newNotes.length === 0) {
            const lastSync = js.lastSyncDate ? new Date(js.lastSyncDate).toLocaleString() : 'Never';
            new Notice(`📓 No new journal entries since last sync (${lastSync}).\n\nEdit a journal file or reset sync in settings.`, 5000);
            return;
        }

        new Notice(`📓 Analyzing ${newNotes.length} journal entries...`);

        let totalXP = 0;
        let totalGold = 0;
        let totalHPChange = 0;
        const domainImpacts = {};
        const recentAnalysis = [];

        for (const note of newNotes) {
            try {
                const analysis = await analyzer.analyzeNote(note);

                // Calculate rewards from analysis
                if (analysis.ai) {
                    // AI analysis available - use its suggestions
                    totalXP += analysis.ai.suggestedXP || 0;
                    totalHPChange += analysis.ai.suggestedHPChange || 0;

                    // Apply domain impacts
                    for (const [domain, score] of Object.entries(analysis.ai.domains || {})) {
                        if (score > 0) {
                            domainImpacts[domain] = (domainImpacts[domain] || 0) + score;
                        }
                    }

                    // Store for recent analysis display
                    recentAnalysis.push({
                        fileName: analysis.fileName,
                        sentiment: analysis.ai.sentiment || 0,
                        achievements: analysis.ai.achievements || [],
                        challenges: analysis.ai.challenges || [],
                        xp: analysis.ai.suggestedXP || 0,
                        date: analysis.modifiedDate
                    });
                } else {
                    // Offline analysis only
                    const sentiment = analysis.offline.sentiment;

                    // XP from positive sentiment
                    totalXP += Math.max(0, sentiment.score * 5);

                    // HP change from sentiment
                    if (sentiment.score < -2) {
                        totalHPChange -= Math.min(20, Math.abs(sentiment.score) * 2);
                    } else if (sentiment.score > 2) {
                        totalHPChange += Math.min(10, sentiment.score);
                    }

                    // Domain impacts from keyword matches
                    for (const [domain, data] of Object.entries(analysis.offline.domainScores)) {
                        if (data.count > 0) {
                            domainImpacts[domain] = (domainImpacts[domain] || 0) + data.count * 2;
                        }
                    }

                    // Store for recent analysis display
                    recentAnalysis.push({
                        fileName: analysis.fileName,
                        sentiment: sentiment.score,
                        positiveWords: sentiment.positiveWords,
                        negativeWords: sentiment.negativeWords,
                        xp: Math.max(0, sentiment.score * 5),
                        date: analysis.modifiedDate
                    });
                }

                // Gold from word count (journaling effort)
                totalGold += Math.floor(analysis.wordCount / 100);

                // Log to activity (individual journal)
                const journalXP = analysis.ai?.suggestedXP || Math.max(0, (analysis.offline?.sentiment?.score || 0) * 5);
                this.logActivity('journal_sync', `Analyzed: ${analysis.fileName}`, {
                    xp: journalXP,
                    gold: Math.floor(analysis.wordCount / 100)
                });

                // Create embedding for semantic search (if enabled and API key available)
                if (this.settings.ai?.embeddingEnabled && this.settings.ai?.openRouterApiKey) {
                    try {
                        const embeddingService = new EmbeddingService(this);
                        const content = await this.app.vault.read(note);
                        const embeddingData = await embeddingService.embedJournalEntry(
                            note.path,
                            note.basename,
                            content,
                            analysis.modifiedDate
                        );

                        // Store or update embedding
                        const existingIdx = js.embeddings.findIndex(e => e.filePath === note.path);
                        if (existingIdx >= 0) {
                            js.embeddings[existingIdx] = embeddingData;
                        } else {
                            js.embeddings.push(embeddingData);
                        }
                    } catch (embErr) {
                        console.log(`Embedding skipped for ${note.basename}:`, embErr.message);
                    }
                }

            } catch (e) {
                console.error(`Error analyzing note ${note.path}:`, e);
            }
        }

        const s = this.settings;

        // Apply XP and Gold
        if (totalXP > 0 || totalGold > 0) {
            this.gainXp(totalXP, totalGold);
        }

        // Apply HP changes
        if (totalHPChange < 0) {
            this.takeDamage(Math.abs(totalHPChange));
        } else if (totalHPChange > 0) {
            s.hp = Math.min(s.maxHp, s.hp + totalHPChange);
        }

        // Apply Energy changes based on journaling effort
        const energyGain = Math.min(30, newNotes.length * 5 + Math.floor(totalXP / 10));
        if (energyGain > 0) {
            s.energy = Math.min(s.maxEnergy || 100, (s.energy || 100) + energyGain);
        }

        // Apply domain score changes (gradual, capped at ±5 per sync)
        for (const [domainId, impact] of Object.entries(domainImpacts)) {
            const domain = s.domains.find(d => d.id === domainId);
            if (domain) {
                const change = Math.min(5, Math.max(-5, impact / newNotes.length));
                domain.score = Math.min(100, Math.max(0, domain.score + Math.round(change)));
            }
        }

        // Skill Discovery from journals (if enabled and API key available)
        let skillsDiscovered = 0;
        let skillsLeveledUp = 0;
        const apiKey = getActiveApiKey(this.settings);

        // Ensure skillsSettings exists with defaults
        if (!this.settings.skillsSettings) {
            this.settings.skillsSettings = { ...DEFAULT_SKILLS_SETTINGS };
        }

        const autoDiscovery = this.settings.skillsSettings.autoDiscovery !== false; // Default true
        console.log('Skill Discovery Check:', { autoDiscovery, hasApiKey: !!apiKey, notesCount: newNotes.length });

        if (autoDiscovery && apiKey) {
            new Notice('🎯 Discovering skills from journals...');
            const skillService = new SkillService(this);

            // Ensure analyzedJournals array exists
            if (!this.settings.skillsSettings.analyzedJournals) {
                this.settings.skillsSettings.analyzedJournals = [];
            }

            for (const note of newNotes) {
                try {
                    const content = await this.app.vault.read(note);
                    console.log(`Analyzing skills in: ${note.basename} (${content.length} chars)`);

                    const discovered = await skillService.discoverSkillsFromJournal(content, note.basename);
                    console.log(`Found ${discovered.length} skills in ${note.basename}:`, discovered);

                    if (discovered.length > 0) {
                        const results = await skillService.processDiscoveredSkills(discovered);

                        for (const result of results) {
                            if (result.action === 'discovered') {
                                skillsDiscovered++;
                                this.logActivity('skill_discovered', `Discovered skill: ${result.skill.name}`, {
                                    category: result.skill.category
                                });
                                new Notice(`🎯 New skill discovered: ${result.skill.name} (+${result.xpAdded || 20} XP)`);
                            } else if (result.action === 'evolved') {
                                skillsLeveledUp += result.levelsGained || 0;
                                this.logActivity('skill_evolved', `${result.oldName} evolved to ${result.skill.name}!`, {
                                    newLevel: result.skill.level
                                });
                                new Notice(`✨ Skill evolved: ${result.skill.name} (Lv.${result.skill.level})`);
                            } else if (result.action === 'xp_added') {
                                if (result.levelsGained > 0) {
                                    skillsLeveledUp += result.levelsGained;
                                    this.logActivity('skill_levelup', `${result.skill.name} leveled up!`, {
                                        newLevel: result.skill.level
                                    });
                                    new Notice(`⬆️ ${result.skill.name} leveled up to Lv.${result.skill.level}!`);
                                } else {
                                    // Show XP gain for existing skills
                                    new Notice(`🎯 ${result.skill.name} +${result.xpAdded} XP (Lv.${result.skill.level})`);
                                }
                            }
                        }
                    }

                    // Mark journal as analyzed for skills
                    const existingIdx = this.settings.skillsSettings.analyzedJournals.findIndex(j => j.path === note.path);
                    const analyzeRecord = { path: note.path, mtime: note.stat.mtime, analyzedAt: Date.now() };
                    if (existingIdx >= 0) {
                        this.settings.skillsSettings.analyzedJournals[existingIdx] = analyzeRecord;
                    } else {
                        this.settings.skillsSettings.analyzedJournals.push(analyzeRecord);
                    }

                } catch (skillErr) {
                    console.error(`Skill discovery error for ${note.basename}:`, skillErr);
                }
            }
        } else {
            console.log('Skill discovery skipped:', { autoDiscovery, hasApiKey: !!apiKey });
        }

        // Update journal settings
        js.lastSyncDate = new Date().toISOString();
        js.recentAnalysis = recentAnalysis.slice(0, 10); // Keep last 10

        await this.saveSettings();
        this.refreshViews();

        // Show summary with skills info
        const hpText = totalHPChange >= 0 ? `+${totalHPChange}` : totalHPChange;
        let summary = `📓 Journal Sync Complete!\n+${totalXP} XP, +${totalGold} Gold\n❤️ HP: ${hpText}, ⚡ Energy: +${energyGain}`;
        if (skillsDiscovered > 0 || skillsLeveledUp > 0) {
            summary += `\n🎯 Skills: ${skillsDiscovered > 0 ? `+${skillsDiscovered} new` : ''}${skillsDiscovered > 0 && skillsLeveledUp > 0 ? ', ' : ''}${skillsLeveledUp > 0 ? `${skillsLeveledUp} level ups` : ''}`;
        }
        if (!hasApiKey) {
            summary += '\n\n💡 Add API key for AI analysis & skill discovery';
        }
        new Notice(summary, 6000);
    }

    // Manual skill discovery from journals (button in Hero tab)
    async manualDiscoverSkills() {
        const apiKey = getActiveApiKey(this.settings);
        if (!apiKey) {
            new Notice('❌ API key required for skill discovery.\n\nAdd OpenRouter API key in Settings → The Journey.', 5000);
            return;
        }

        const js = this.settings.journalSettings;
        const analyzer = new JournalAnalyzer(this);

        // Ensure skillsSettings exists
        if (!this.settings.skillsSettings) {
            this.settings.skillsSettings = JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS));
        }
        if (!this.settings.skillsSettings.analyzedJournals) {
            this.settings.skillsSettings.analyzedJournals = [];
        }

        // Get all journal notes
        const allJournals = await analyzer.getJournalNotes();
        if (allJournals.length === 0) {
            new Notice(`📓 No journal files found in "${js.journalFolder}" folder.`, 4000);
            return;
        }

        // Filter out already-analyzed journals (by path and mtime)
        const analyzedMap = new Map(
            this.settings.skillsSettings.analyzedJournals.map(j => [j.path, j.mtime])
        );

        const newJournals = allJournals.filter(note => {
            const lastAnalyzed = analyzedMap.get(note.path);
            // Include if never analyzed OR if modified since last analysis
            return !lastAnalyzed || note.stat.mtime > lastAnalyzed;
        });

        if (newJournals.length === 0) {
            new Notice(`🎯 All ${allJournals.length} journals already analyzed.\n\nEdit a journal or click "Reset & Resync All" to re-analyze.`, 4000);
            return;
        }

        new Notice(`🎯 Discovering skills from ${newJournals.length} new journals...\n(${allJournals.length - newJournals.length} already analyzed)`);

        const skillService = new SkillService(this);
        let skillsDiscovered = 0;
        let skillsLeveledUp = 0;

        // Process each NEW journal
        for (const note of newJournals) {
            try {
                const content = await this.app.vault.read(note);
                console.log(`🎯 Discovering skills in: ${note.basename}`);

                const discovered = await skillService.discoverSkillsFromJournal(content, note.basename);

                if (discovered.length > 0) {
                    console.log(`Found ${discovered.length} skills:`, discovered);
                    const results = await skillService.processDiscoveredSkills(discovered);

                    for (const result of results) {
                        if (result.action === 'discovered') {
                            skillsDiscovered++;
                            new Notice(`🎯 New skill: ${result.skill.name}`, 2000);
                        } else if (result.action === 'evolved') {
                            skillsLeveledUp++;
                            new Notice(`✨ ${result.skill.name} evolved!`, 2000);
                        } else if (result.action === 'xp_added' && result.levelsGained > 0) {
                            skillsLeveledUp += result.levelsGained;
                        }
                    }
                }

                // Mark journal as analyzed (even if no skills found)
                const existingIdx = this.settings.skillsSettings.analyzedJournals.findIndex(j => j.path === note.path);
                const analyzeRecord = { path: note.path, mtime: note.stat.mtime, analyzedAt: Date.now() };
                if (existingIdx >= 0) {
                    this.settings.skillsSettings.analyzedJournals[existingIdx] = analyzeRecord;
                } else {
                    this.settings.skillsSettings.analyzedJournals.push(analyzeRecord);
                }

            } catch (err) {
                console.error(`Error discovering skills in ${note.basename}:`, err);
            }
        }

        await this.saveSettings();
        this.refreshViews();

        if (skillsDiscovered > 0 || skillsLeveledUp > 0) {
            new Notice(`🎯 Skill Discovery Complete!\n+${skillsDiscovered} new skills\n${skillsLeveledUp} level ups`, 5000);
        } else {
            new Notice(`🎯 No new skills discovered from ${newJournals.length} journals.\n\nWrite more about your activities!`, 4000);
        }
    }

    checkAchievements() {
        const s = this.settings;
        let unlocked = false;

        s.achievements.forEach(ach => {
            if (ach.unlocked) return;

            let shouldUnlock = false;

            switch (ach.id) {
                case 'first_habit':
                    shouldUnlock = s.totalHabitsCompleted >= 1;
                    break;
                case 'level_5':
                    shouldUnlock = s.level >= 5;
                    break;
                case 'level_10':
                    shouldUnlock = s.level >= 10;
                    break;
                case 'streak_7':
                    shouldUnlock = s.habits.some(h => h.streak >= 7 || h.bestStreak >= 7);
                    break;
                case 'streak_30':
                    shouldUnlock = s.habits.some(h => h.streak >= 30 || h.bestStreak >= 30);
                    break;
                case 'gold_500':
                    shouldUnlock = s.totalGoldEarned >= 500;
                    break;
                case 'habits_10':
                    shouldUnlock = s.habits.length >= 10;
                    break;
                case 'quests_5':
                    shouldUnlock = s.totalQuestsCompleted >= 5;
                    break;
                case 'character_created':
                    shouldUnlock = s.characterProfile?.assessmentComplete === true;
                    break;
                case 'all_domains_50':
                    shouldUnlock = s.domains.every(d => d.score >= 50);
                    break;
                case 'ai_coach_first':
                    shouldUnlock = (s.ai?.chatHistory?.length || 0) > 0;
                    break;
                case 'ai_quests_5':
                    shouldUnlock = (s.aiQuestsGenerated || 0) >= 5;
                    break;
            }

            if (shouldUnlock) {
                ach.unlocked = true;
                s.gold += ach.reward;
                s.totalGoldEarned += ach.reward;
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
                unlocked = true;
            }
        });

        if (unlocked) {
            this.saveSettings();
            this.refreshViews();
        }
    }

    updateStatusBar() {
        const s = this.settings;
        if (this.statusBarItem) {
            const name = s.characterProfile?.name ? `${s.characterProfile.name} ` : '';
            this.statusBarItem.setText(`${name}Lv${s.level} | ❤️${s.hp} | 💰${s.gold}`);
        }
    }

    refreshViews() {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_HERO).forEach((leaf) => {
            if (leaf.view instanceof HeroView) leaf.view.render();
        });
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_HERO)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false) || workspace.getLeaf('tab');
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_HERO, active: true });
            }
        }
        if (leaf) workspace.revealLeaf(leaf);
    }
};
