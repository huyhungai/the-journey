# The Journey

> Your personal hero's journey - Transform daily life into an epic RPG adventure

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22the-journey%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![GitHub License](https://img.shields.io/github/license/huyhungai/the-journey)
![GitHub release](https://img.shields.io/github/v/release/huyhungai/the-journey)

The Journey is an Obsidian plugin that gamifies your personal development using RPG mechanics. Create your hero, track habits, complete quests, fight life bosses, and watch yourself grow through the 9 domains of Gross National Happiness.

## What's New in v0.10.9

- **Rest & Recovery** - Daily mood and sleep tracking with energy bonuses
- **27 Boss Templates** - Pre-made bosses across 8 life categories
- **Quest Rewards** - Earn XP, Gold, and deal boss damage
- **AI Quest Generation** - Get personalized quest suggestions
- **Run Away Button** - Strategic retreat (but boss recovers HP!)
- **Improved Bad Habits UI** - Bigger, clearer tracking buttons

## Features

### Character Creation & Assessment
- **37-question assessment** based on the 9 GNH (Gross National Happiness) domains
- Personalized character profile with strengths and growth areas
- Starting stats (HP, Energy, XP) based on your assessment

### 9 Life Domains (GNH Framework)
Track and develop across all aspects of life:
1. **Psychological Wellbeing** - Mental health, mindfulness, emotional balance
2. **Health** - Physical fitness, sleep, nutrition
3. **Education** - Learning, skills, knowledge growth
4. **Time Use** - Work-life balance, time management
5. **Cultural Resilience** - Heritage, traditions, cultural connection
6. **Good Governance** - Ethics, responsibility, civic engagement
7. **Community Vitality** - Relationships, social connections
8. **Ecological Diversity** - Environmental awareness, sustainability
9. **Living Standards** - Financial health, material wellbeing

### HUMAN 3.0 Framework
Progress through development tiers:
- **HUMAN 1.0** - Survival mode, basic needs focus
- **HUMAN 2.0** - Growth mode, active self-improvement
- **HUMAN 3.0** - Thriving mode, helping others flourish

### Four Quadrants Balance
Track balance across:
- **Mind** - Cognitive abilities, learning, mental health
- **Body** - Physical health, energy, vitality
- **Spirit** - Purpose, meaning, connection
- **Vocation** - Career, skills, life's work

### Habit Tracking
- **Good habits** with XP/Gold/HP rewards
- **Bad habits** with HP/XP penalties (improved UI with big "I did it" button)
- Streak tracking and rewards
- Daily habit dashboard
- Encouragement messages for staying on track

### Quest System
- Create quests linked to your life goals
- **AI-enhanced quest generation** with personalized suggestions
- Link quests to boss fights for bonus damage
- **Difficulty levels** with scaled rewards:
  - Easy: +10 XP, +5 Gold, 10 boss damage
  - Medium: +20 XP, +10 Gold, 20 boss damage
  - Hard: +30 XP, +15 Gold, 30 boss damage
- "Add All" button to quickly add multiple quests

### Boss Fights
- Transform life challenges into epic boss battles
- **27 pre-made boss templates** across 8 categories:
  - ⏰ Productivity (Lazy Dragon, Distraction Hydra, Perfectionism Titan)
  - 🧠 Mental Health (Fog Giant, Anxiety Specter, Imposter Shadow, Burnout Phoenix)
  - 💪 Health & Body (Sloth Beast, Sugar Serpent, Insomnia Wraith, Junk Food Golem)
  - 💼 Career (Career Chimera, Project Kraken, Skill Gap Void)
  - 💰 Finance (Debt Demon, Spending Vampire, Income Ceiling)
  - 👥 Social (Isolation Wraith, Conflict Cerberus, Networking Sphinx)
  - 📚 Learning (Ignorance Golem, Language Barrier, Creative Block)
  - 🌟 Life Goals (Clutter Colossus, Habit Hydra, Fear Dragon)
- **Fight button** - Deal direct damage to bosses
- **Run Away button** - Strategic retreat (boss recovers 5-15 HP)
- Earn massive rewards (+50 XP, +25 Gold) on victory

### Rest & Recovery
- **Mood check-in** - Track how you're feeling (Great to Exhausted)
- **Sleep logging** - Log sleep quality for HP/Energy bonuses
- **Recovery actions** - Meditation, walks, breaks, hydration
- Daily energy management system

### Skill Discovery
- **Manual skill creation** - Add skills you're developing
- **AI-powered discovery** - Automatically discover skills from your journals
- Skill categories: Mind, Body, Spirit, Vocation
- Level up skills through practice
- Skill evolution at level 5

### The Elder (AI Guide)
- **Guide Mode** - Seek wisdom and guidance
- **Storyteller Mode** - Narrate your journey as an epic tale
- Reflects on your progress and patterns
- Supports multiple AI providers:
  - OpenRouter (100+ models)
  - OpenAI (GPT)
  - Anthropic (Claude)
  - Google AI (Gemini)

### Journal Integration
- Sync with your daily journal folder
- Automatic XP, HP, Energy gains from journaling
- AI-powered skill discovery from journal entries
- Activity logging and history

### Chronicle Tab
- Activity log tracking all changes
- Filter by activity type
- See your journey's history

## Installation

> **Note**: The Journey is currently under review for the Obsidian Community Plugins directory. For now, please use manual installation.

### Manual Installation (Current Method)

**Step 1: Download Plugin Files**
1. Go to the [latest release](https://github.com/huyhungai/the-journey/releases/latest)
2. Download these 3 files:
   - `main.js`
   - `manifest.json`
   - `styles.css`

**Step 2: Install in Your Vault**
1. Open your Obsidian vault folder in file explorer
2. Navigate to the `.obsidian/plugins/` folder
   - If the `plugins` folder doesn't exist, create it
3. Create a new folder named `the-journey`
4. Place the 3 downloaded files inside: `.obsidian/plugins/the-journey/`

**Step 3: Enable the Plugin**
1. Open Obsidian
2. Go to Settings → Community Plugins
3. Turn off "Restricted Mode" if it's enabled
4. Click "Browse" or reload the plugins list
5. Find "The Journey" and toggle it ON

**For Mobile (iOS/Android)**
- If you sync your vault (iCloud, Dropbox, Obsidian Sync), the plugin files will sync automatically
- Enable the plugin in Settings → Community Plugins on your mobile device
- AI features require internet connection and API keys

### From Community Plugins (Coming Soon)
Once approved, you'll be able to install directly:
1. Open Obsidian Settings → Community Plugins
2. Search for "The Journey"
3. Click Install, then Enable

## Getting Started

1. **Enable the plugin** in Obsidian Settings > Community Plugins
2. **Open The Journey panel** using the command palette (Ctrl/Cmd+P) and search "The Journey: Open"
3. **Create your character** by answering the 37-question assessment
4. **Set up your journal folder** in plugin settings for journal sync
5. **(Optional) Add an AI API key** in settings for enhanced features

## Configuration

### Basic Settings
- **Character Profile** - Your hero's stats and progress
- **Journal Folder** - Path to your daily journal folder
- **Gold per XP** - Gold reward ratio

### AI Settings (Optional)
Enable AI features by adding an API key:
- **OpenRouter** - Access 100+ models with one key (recommended)
- **OpenAI** - Direct access to GPT models
- **Anthropic** - Direct access to Claude models
- **Google AI** - Access to Gemini models

AI features include:
- The Elder wisdom guide
- AI-enhanced quest creation
- Automatic skill discovery from journals

## Commands

- `The Journey: Open` - Open the main panel
- `The Journey: Log Sleep` - Quick sleep logging
- `The Journey: Log Mood` - Quick mood logging
- `The Journey: Sync Journals` - Manual journal sync

## Screenshots

*Coming soon*

## Tips

- **Journal regularly** to gain passive XP and discover new skills
- **Create meaningful quests** that align with your real goals
- **Fight your fears** by creating boss battles for life challenges
- **Check The Elder** for personalized guidance and motivation
- **Track your Chronicle** to see how far you've come

## Support

- [Report Issues](https://github.com/huyhungai/the-journey/issues)
- [Request Features](https://github.com/huyhungai/the-journey/issues)
- [Discussions](https://github.com/huyhungai/the-journey/discussions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the **Gross National Happiness** framework from Bhutan
- Built with love for the Obsidian community
- Thanks to all early testers and contributors

---

*Transform your daily grind into an epic adventure. Your journey begins now.*
