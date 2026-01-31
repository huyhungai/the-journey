/* DiscoveryService - Gradual Domain Discovery System */

// Maps question IDs to their domains for discovery tracking
const QUESTION_TO_DOMAIN = {};

// Build question-to-domain mapping from QUESTION_BANK
function buildQuestionDomainMap(questionBank) {
    for (const [domainId, questions] of Object.entries(questionBank)) {
        for (const q of questions) {
            QUESTION_TO_DOMAIN[q.id] = domainId;
        }
    }
}

class DiscoveryService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Get or initialize discovery data
    getDiscoveryData() {
        const s = this.plugin.settings;
        if (!s.characterProfile) return null;

        // Initialize discovery object if not exists
        if (!s.characterProfile.discovery) {
            s.characterProfile.discovery = {
                currentQuestionIndex: 0,
                questionResponses: {},
                discoveredDomains: [],
                domainDataPoints: {},
                questionsToday: 0,
                lastQuestionDate: null,
                skippedQuestions: []
            };
        }

        return s.characterProfile.discovery;
    }

    // Get today's date string for comparison
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // Check and reset daily question counter if new day
    checkDailyReset() {
        const discovery = this.getDiscoveryData();
        if (!discovery) return;

        const today = this.getTodayString();
        if (discovery.lastQuestionDate !== today) {
            discovery.questionsToday = 0;
            discovery.lastQuestionDate = today;
        }
    }

    // Get count of questions answered today
    getDailyQuestionCount() {
        this.checkDailyReset();
        const discovery = this.getDiscoveryData();
        return discovery ? discovery.questionsToday : 0;
    }

    // No daily limit - users can answer as many as they want
    isDailyLimitReached() {
        return false; // No limit
    }

    // Get the next unanswered question (from core bank or AI-generated)
    getCurrentQuestion(questionBank, domainOrder) {
        const discovery = this.getDiscoveryData();
        if (!discovery) {
            console.log('[Discovery] No discovery data');
            return null;
        }

        console.log('[Discovery] getCurrentQuestion - responses:', Object.keys(discovery.questionResponses).length);

        // Build all core questions in order
        const allQuestions = [];
        for (const domainId of domainOrder) {
            const domainQuestions = questionBank[domainId] || [];
            for (const q of domainQuestions) {
                allQuestions.push({ ...q, domain: domainId });
            }
        }

        // Find first unanswered core question that's not skipped
        for (const q of allQuestions) {
            if (!discovery.questionResponses[q.id] && !discovery.skippedQuestions.includes(q.id)) {
                console.log('[Discovery] Next question:', q.id);
                return q;
            }
        }

        // If all core questions answered or skipped, try skipped ones first
        if (discovery.skippedQuestions.length > 0) {
            const skippedId = discovery.skippedQuestions[0];
            for (const q of allQuestions) {
                if (q.id === skippedId) {
                    return q;
                }
            }
        }

        // Check for pending AI-generated question
        if (discovery.pendingAiQuestion) {
            return discovery.pendingAiQuestion;
        }

        // All core questions done - return null to trigger AI generation
        return { needsAiGeneration: true };
    }

    // Check if all core questions are completed
    areCoreQuestionsComplete(questionBank, domainOrder) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;

        for (const domainId of domainOrder) {
            const domainQuestions = questionBank[domainId] || [];
            for (const q of domainQuestions) {
                if (!discovery.questionResponses[q.id]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Generate AI question for a specific domain (or weakest domain)
    async generateAiQuestion(domainOrder, domains) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return null;

        // Find the domain with lowest score (needs most exploration)
        const domainScores = {};
        for (const d of domains) {
            domainScores[d.id] = d.score;
        }

        // Sort domains by score (lowest first) to focus on growth areas
        const sortedDomains = [...domainOrder].sort((a, b) =>
            (domainScores[a] || 50) - (domainScores[b] || 50)
        );

        // Pick one of the 3 weakest domains randomly for variety
        const weakestDomains = sortedDomains.slice(0, 3);
        const targetDomainId = weakestDomains[Math.floor(Math.random() * weakestDomains.length)];
        const targetDomain = domains.find(d => d.id === targetDomainId);

        // Generate unique question ID
        const aiQuestionCount = discovery.aiQuestionsAnswered || 0;
        const questionId = `ai_${targetDomainId}_${aiQuestionCount + 1}`;

        // Check if we have API key for AI generation
        const apiKey = getActiveApiKey(this.plugin.settings);
        if (!apiKey) {
            // Fallback to template questions if no API key
            return this.getFallbackQuestion(targetDomainId, targetDomain, questionId);
        }

        try {
            const question = await this.callAiForQuestion(targetDomainId, targetDomain, discovery);
            if (question) {
                return {
                    id: questionId,
                    text: question.text,
                    hint: question.hint || null,
                    domain: targetDomainId,
                    weight: 1.0,
                    positiveFraming: true,
                    isAiGenerated: true
                };
            }
        } catch (e) {
            console.error('AI question generation failed:', e);
        }

        // Fallback if AI fails
        return this.getFallbackQuestion(targetDomainId, targetDomain, questionId);
    }

    // Call AI to generate a personalized question
    async callAiForQuestion(domainId, domain, discovery) {
        const s = this.plugin.settings;
        const apiKey = getActiveApiKey(s);
        const provider = s.ai?.provider || 'openrouter';
        const model = getActiveChatModel(s);

        const domainDescriptions = {
            psychologicalWellbeing: 'mental health, emotional well-being, life satisfaction, stress management, self-awareness',
            health: 'physical health, exercise, sleep, nutrition, energy levels, body care',
            timeUse: 'work-life balance, time management, leisure, productivity, rest and recovery',
            education: 'learning, skill development, intellectual growth, curiosity, knowledge acquisition',
            culturalResilience: 'cultural identity, authenticity, traditions, self-expression, heritage',
            goodGovernance: 'self-leadership, decision-making, boundaries, personal responsibility, values',
            communityVitality: 'relationships, social connections, community, belonging, support systems',
            ecologicalAwareness: 'environmental consciousness, nature connection, sustainability',
            livingStandards: 'financial well-being, career, material security, professional growth'
        };

        const prompt = `You are a life coach helping someone discover their strengths and growth areas through the HUMAN 3.0 framework and GNH (Gross National Happiness) domains.

Generate ONE reflective question for the "${domain?.name || domainId}" domain.
Domain focus: ${domainDescriptions[domainId] || domainId}

The question should:
1. Be introspective and encourage self-reflection
2. Be answerable on a 1-5 scale (Strongly Disagree to Strongly Agree)
3. Be positively framed (higher score = better)
4. Be different from typical assessment questions
5. Feel personal and meaningful

User's current ${domain?.name} score: ${domain?.score || 50}%
Questions answered so far: ${Object.keys(discovery.questionResponses).length}

Respond in JSON format only:
{"text": "Your question here", "hint": "Optional helpful hint"}`;

        const providerConfig = AI_PROVIDERS[provider];
        let endpoint = providerConfig.chatEndpoint;

        // Handle Google's different URL format
        if (provider === 'google') {
            endpoint = endpoint.replace('{model}', model);
        }

        const headers = {
            'Content-Type': 'application/json',
            ...providerConfig.extraHeaders
        };

        if (providerConfig.authHeader) {
            headers[providerConfig.authHeader] = `${providerConfig.authPrefix}${apiKey}`;
        }

        let body;
        if (provider === 'google') {
            endpoint += `?key=${apiKey}`;
            body = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 200 }
            });
        } else if (provider === 'anthropic') {
            body = JSON.stringify({
                model: model,
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }]
            });
        } else {
            body = JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 200
            });
        }

        const response = await requestUrl({
            url: endpoint,
            method: 'POST',
            headers: headers,
            body: body
        });

        let content = '';
        if (provider === 'google') {
            content = response.json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else if (provider === 'anthropic') {
            content = response.json?.content?.[0]?.text || '';
        } else {
            content = response.json?.choices?.[0]?.message?.content || '';
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return null;
    }

    // Fallback questions when AI is not available
    getFallbackQuestion(domainId, domain, questionId) {
        const fallbackQuestions = {
            psychologicalWellbeing: [
                { text: 'I feel emotionally balanced even when facing challenges', hint: 'Consider your emotional resilience' },
                { text: 'I have a clear sense of purpose in my daily life', hint: 'Think about what drives you' },
                { text: 'I practice self-compassion when I make mistakes', hint: 'How do you treat yourself?' }
            ],
            health: [
                { text: 'I listen to my body\'s signals and respond appropriately', hint: 'Consider hunger, fatigue, stress signals' },
                { text: 'I have consistent energy throughout my day', hint: 'Think about your typical energy patterns' },
                { text: 'I prioritize recovery and rest as much as activity', hint: 'Balance is key' }
            ],
            timeUse: [
                { text: 'I spend my time on activities that align with my values', hint: 'Consider how you allocate your hours' },
                { text: 'I rarely feel rushed or overwhelmed by my schedule', hint: 'Think about your pace of life' },
                { text: 'I make time for things that bring me joy', hint: 'Not just obligations, but genuine enjoyment' }
            ],
            education: [
                { text: 'I actively seek out new knowledge and perspectives', hint: 'Consider your curiosity level' },
                { text: 'I apply what I learn to improve my life', hint: 'Learning that creates change' },
                { text: 'I enjoy being challenged intellectually', hint: 'Growth through mental challenge' }
            ],
            culturalResilience: [
                { text: 'I express my authentic self in most situations', hint: 'Being true to who you are' },
                { text: 'I feel connected to something larger than myself', hint: 'Culture, community, or meaning' },
                { text: 'I honor traditions that are meaningful to me', hint: 'Personal or cultural rituals' }
            ],
            goodGovernance: [
                { text: 'I make decisions based on my values, not others\' expectations', hint: 'Self-directed choices' },
                { text: 'I follow through on commitments I make to myself', hint: 'Personal integrity' },
                { text: 'I can say no without feeling guilty', hint: 'Healthy boundaries' }
            ],
            communityVitality: [
                { text: 'I have people I can count on during difficult times', hint: 'Your support network' },
                { text: 'I contribute positively to my communities', hint: 'Giving, not just receiving' },
                { text: 'I feel genuinely connected to others in my life', hint: 'Quality of relationships' }
            ],
            ecologicalAwareness: [
                { text: 'I feel connected to nature and the environment', hint: 'Your relationship with the natural world' },
                { text: 'I consider environmental impact in my choices', hint: 'Daily decisions and their effects' },
                { text: 'Spending time in nature improves my well-being', hint: 'The healing power of nature' }
            ],
            livingStandards: [
                { text: 'I feel financially secure in my current situation', hint: 'Not wealthy, but stable' },
                { text: 'My work contributes meaningfully to my life', hint: 'Beyond just income' },
                { text: 'I have enough resources to pursue what matters to me', hint: 'Freedom to choose' }
            ]
        };

        const domainFallbacks = fallbackQuestions[domainId] || fallbackQuestions.psychologicalWellbeing;
        const discovery = this.getDiscoveryData();
        const aiCount = discovery?.aiQuestionsAnswered || 0;
        const fallback = domainFallbacks[aiCount % domainFallbacks.length];

        return {
            id: questionId,
            text: fallback.text,
            hint: fallback.hint,
            domain: domainId,
            weight: 1.0,
            positiveFraming: true,
            isAiGenerated: false,
            isFallback: true
        };
    }

    // Store pending AI question
    setPendingAiQuestion(question) {
        const discovery = this.getDiscoveryData();
        if (discovery) {
            discovery.pendingAiQuestion = question;
        }
    }

    // Clear pending AI question after it's answered
    clearPendingAiQuestion() {
        const discovery = this.getDiscoveryData();
        if (discovery) {
            discovery.pendingAiQuestion = null;
        }
    }

    // Answer a question and potentially discover a domain
    async answerQuestion(questionId, value, questionBank, currentQuestion = null) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return { success: false };

        // Record the response
        discovery.questionResponses[questionId] = value;
        discovery.questionsToday++;
        discovery.lastQuestionDate = this.getTodayString();
        console.log('[Discovery] Recorded answer:', questionId, '=', value, 'Total responses:', Object.keys(discovery.questionResponses).length);

        // Remove from skipped if it was there
        const skippedIdx = discovery.skippedQuestions.indexOf(questionId);
        if (skippedIdx >= 0) {
            discovery.skippedQuestions.splice(skippedIdx, 1);
        }

        // Find the domain and question details for this question
        let domainId = null;
        let questionData = null;
        let isAiQuestion = false;

        // Check if it's an AI-generated question (passed directly)
        if (currentQuestion && (currentQuestion.isAiGenerated || currentQuestion.isFallback)) {
            domainId = currentQuestion.domain;
            questionData = currentQuestion;
            isAiQuestion = true;
            // Track AI questions answered
            discovery.aiQuestionsAnswered = (discovery.aiQuestionsAnswered || 0) + 1;
            // Clear pending AI question
            this.clearPendingAiQuestion();
        } else {
            // Search in core question bank
            for (const [dId, questions] of Object.entries(questionBank)) {
                const q = questions.find(q => q.id === questionId);
                if (q) {
                    domainId = dId;
                    questionData = q;
                    break;
                }
            }
        }

        // Track data point for domain and discover if new
        let domainDiscovered = false;
        if (domainId) {
            discovery.domainDataPoints[domainId] = (discovery.domainDataPoints[domainId] || 0) + 1;

            // Discover domain if this is the first data point
            if (!this.isDomainDiscovered(domainId)) {
                domainDiscovered = true;
                discovery.discoveredDomains.push(domainId);
            }

            // Update the domain score based on this answer
            this.updateDomainScoreFromAnswer(domainId, value, questionData, questionBank, isAiQuestion);
        }

        // Save discovery data first (important!)
        await this.plugin.saveSettings();

        // Award XP using plugin's gainXp method (handles level ups, notices, saves settings)
        // AI questions give slightly more XP to encourage continued exploration
        const xpReward = isAiQuestion ? 7 : 5;
        const goldReward = isAiQuestion ? 2 : 1;
        this.plugin.gainXp(xpReward, goldReward, domainId);

        return {
            success: true,
            xpReward,
            goldReward,
            domainId,
            domainDiscovered,
            isAiQuestion
        };
    }

    // Update domain score based on a single answer
    updateDomainScoreFromAnswer(domainId, value, questionData, questionBank, isAiQuestion = false) {
        const s = this.plugin.settings;
        const domain = s.domains?.find(d => d.id === domainId);
        if (!domain) {
            console.log('[Discovery] Domain not found:', domainId);
            return;
        }
        console.log('[Discovery] Updating domain:', domainId, 'value:', value, 'current score:', domain.score);

        // Get all responses for this domain
        const discovery = this.getDiscoveryData();
        const domainQuestions = questionBank[domainId] || [];

        // For AI questions, directly update score based on single answer
        if (isAiQuestion && questionData) {
            let score = value;
            if (questionData.positiveFraming === false) {
                score = 6 - score;
            }
            // Convert 1-5 to 0-100 scale
            const answerPercent = (score - 1) * 25;
            // Blend with existing score (AI questions have less weight individually)
            const aiWeight = 0.1; // 10% influence per AI question
            domain.score = Math.round(domain.score * (1 - aiWeight) + answerPercent * aiWeight);
            domain.score = Math.max(0, Math.min(100, domain.score));
            return;
        }

        let totalWeight = 0;
        let weightedSum = 0;
        let responseCount = 0;

        for (const q of domainQuestions) {
            if (discovery.questionResponses[q.id] !== undefined) {
                let score = discovery.questionResponses[q.id];
                // Reverse score for negatively framed questions
                if (q.positiveFraming === false) {
                    score = 6 - score;
                }
                const weight = q.weight || 1;
                totalWeight += weight;
                weightedSum += score * weight;
                responseCount++;
            }
        }

        if (responseCount > 0) {
            // Calculate weighted average, then scale to 0-100
            const avgScore = weightedSum / totalWeight; // 1-5 scale
            const percentScore = Math.round((avgScore - 1) * 25); // Convert to 0-100
            const oldScore = domain.score;
            domain.score = Math.max(0, Math.min(100, percentScore));
            console.log('[Discovery] Updated', domainId, 'from', oldScore, 'to', domain.score, '(responses:', responseCount, 'avgScore:', avgScore.toFixed(2), ')');
        } else {
            console.log('[Discovery] No responses found for domain:', domainId);
        }
    }

    // Skip a question for now
    async skipQuestion(questionId) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return;

        if (!discovery.skippedQuestions.includes(questionId)) {
            discovery.skippedQuestions.push(questionId);
        }

        await this.plugin.saveSettings();
    }

    // Check if a domain has been discovered
    isDomainDiscovered(domainId) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;
        return discovery.discoveredDomains.includes(domainId);
    }

    // Discover a domain from various sources
    async discoverDomain(domainId, source = 'question') {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;

        if (discovery.discoveredDomains.includes(domainId)) {
            // Already discovered - just add data point
            discovery.domainDataPoints[domainId] = (discovery.domainDataPoints[domainId] || 0) + 1;
            return false;
        }

        // Discover the domain
        discovery.discoveredDomains.push(domainId);
        discovery.domainDataPoints[domainId] = (discovery.domainDataPoints[domainId] || 0) + 1;

        // Log the discovery
        this.plugin.logActivity?.('domain_discovered', `Discovered ${domainId} from ${source}`, {
            domain: domainId,
            source
        });

        await this.plugin.saveSettings();
        return true; // Domain was newly discovered
    }

    // Check if domain has enough data to show score
    canShowDomainScore(domainId) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;

        // Need at least 2 data points to show a score
        return (discovery.domainDataPoints[domainId] || 0) >= 2;
    }

    // Get the number of data points for a domain
    getDomainDataPoints(domainId) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return 0;
        return discovery.domainDataPoints[domainId] || 0;
    }

    // Get total answered questions count
    getTotalAnsweredQuestions() {
        const discovery = this.getDiscoveryData();
        if (!discovery) return 0;
        return Object.keys(discovery.questionResponses).length;
    }

    // Get discovered domains list
    getDiscoveredDomains() {
        const discovery = this.getDiscoveryData();
        if (!discovery) return [];
        return discovery.discoveredDomains;
    }

    // Get quadrant discovery status (unlocked when at least 1 domain in quadrant discovered)
    isQuadrantDiscovered(quadrantId, domainToQuadrant) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;

        // Find all domains in this quadrant
        for (const [domainId, qId] of Object.entries(domainToQuadrant)) {
            if (qId === quadrantId && discovery.discoveredDomains.includes(domainId)) {
                return true;
            }
        }
        return false;
    }

    // Calculate domain score from answered questions
    calculateDomainScore(domainId, questionBank) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return 50; // Default neutral score

        const domainQuestions = questionBank[domainId] || [];
        const responses = [];

        for (const q of domainQuestions) {
            if (discovery.questionResponses[q.id] !== undefined) {
                let score = discovery.questionResponses[q.id];
                // Reverse score for negatively framed questions
                if (q.positiveFraming === false) {
                    score = 6 - score;
                }
                // Apply weight
                const weight = q.weight || 1;
                responses.push({ score, weight });
            }
        }

        if (responses.length === 0) {
            // No question responses, return existing domain score or default
            const domain = this.plugin.settings.domains?.find(d => d.id === domainId);
            return domain?.score || 50;
        }

        // Calculate weighted average, then scale to 0-100
        const totalWeight = responses.reduce((sum, r) => sum + r.weight, 0);
        const weightedSum = responses.reduce((sum, r) => sum + (r.score * r.weight), 0);
        const avgScore = weightedSum / totalWeight; // 1-5 scale
        const percentScore = Math.round((avgScore - 1) * 25); // Convert to 0-100

        return Math.max(0, Math.min(100, percentScore));
    }

    // Migrate existing users who completed the old assessment
    migrateFromLegacyAssessment(assessmentResponses, questionBank) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return;

        // Already migrated or has discovery data
        if (discovery.discoveredDomains.length > 0 || Object.keys(discovery.questionResponses).length > 0) {
            return;
        }

        // Convert old responses array to new format
        if (assessmentResponses && assessmentResponses.length > 0) {
            for (const response of assessmentResponses) {
                discovery.questionResponses[response.questionId] = response.value;

                // Find and track domain
                for (const [domainId, questions] of Object.entries(questionBank)) {
                    const q = questions.find(q => q.id === response.questionId);
                    if (q) {
                        discovery.domainDataPoints[domainId] = (discovery.domainDataPoints[domainId] || 0) + 1;
                        if (!discovery.discoveredDomains.includes(domainId)) {
                            discovery.discoveredDomains.push(domainId);
                        }
                        break;
                    }
                }
            }
        }
    }

    // Check if all domains have been discovered
    areAllDomainsDiscovered(domainOrder) {
        const discovery = this.getDiscoveryData();
        if (!discovery) return false;

        return domainOrder.every(domainId => discovery.discoveredDomains.includes(domainId));
    }
}

// Export for use in main-core.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiscoveryService };
}
