<p align="center">
  <img src="assets/logo.png" alt="HyVorn" width="400">
</p>

<p align="center">
  <a href="https://buymeacoffee.com/imvylo">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee">
  </a>
</p>

# HyVornBot

A feature-rich, modular Discord bot combining the best of MEE6 and RedBot with extensive customization options.

## Features

### Core Features
- **Modular Plugin System** - Extend functionality with custom plugins
- **Advanced Command Handler** - Easy-to-use command structure with categories
- **Database Integration** - Persistent data storage using SQLite
- **Comprehensive Logging** - Track all bot activities and errors
- **Permission System** - Fine-grained control over command access
- **Channel Restrictions** - Limit command categories to specific channels

### Command Categories

#### 🛡️ Moderation & AutoMod
- Ban, kick, mute, and warn members
- Temporary bans and mutes
- Message purging and slowmode
- Channel lockdown
- Nickname management
- Role management
- **AutoMod** - Automated moderation system
  - Anti-spam protection
  - Discord invite blocking
  - External link filtering
  - Excessive caps detection
  - Mention spam prevention
  - Configurable thresholds and whitelists

#### 📊 Leveling System
- XP and level tracking
- Leaderboards
- Rank cards
- Customizable role rewards at specific levels
- Admin commands to manage rewards and set levels

#### 💰 Economy System
- Virtual currency (wallet & bank)
- Daily rewards
- Work and earn commands
- Gambling (blackjack, slots)
- Shop system with items
- User inventories
- Player-to-player transactions
- Rob system

#### 🎉 Giveaways
- Create and manage giveaways
- Automatic winner selection
- Reroll functionality
- List active giveaways

#### 🎮 Fun Commands
- 8ball predictions
- Coin flip
- Dice rolling
- Random facts
- Jokes and quotes
- Meme generator
- Social interactions (hug, pat, kiss, slap, highfive, poke)

#### 🔧 Utility
- Server and user info
- Avatar and banner display
- Custom embeds
- Polls
- Reminders
- AFK status
- Custom tags
- Role information

#### ⚙️ Admin
- Bot configuration
- Command prefix management
- Plugin management
- Channel restrictions per category (`/config channels`)
- Notification channels (`/config notifications`)
- Log channels (`/logs channels`)
- Eval command (owner only)
- Reload commands
- Help system
- About and ping commands

#### 📝 Unified Request System
- **Tickets** - Support ticket creation and management
- **Suggestions** - Community suggestion system with voting
- **Bug Reports** - Report bugs with detailed information
- **Player Reports** - Report rule-breaking players
- **Staff Applications** - Multi-page application system
- Request tracking and management
- Status updates and notifications
- Configurable categories and roles

#### 🎤 Voice Features
- Temporary voice channels
- Auto-delete when empty
- User ownership and control
- Custom naming formats
- Lobby-based creation system

#### 🎂 Birthday System
- Birthday tracking and reminders
- Automatic birthday announcements
- Optional birthday role
- Upcoming birthday list
- Age calculation
- Hourly birthday checks

#### 👋 Welcome System
- Customizable welcome and goodbye messages
- Embed or plain text format
- Channel configuration
- Enable/disable toggles
- Variable support ({user}, {username}, {server})
- Test command to preview messages

#### 🎭 Reaction Roles
- Self-assignable roles via reactions
- Create reaction roles on any message
- Support for custom and standard emojis
- List all reaction roles
- Easy management and removal

### Plugins

#### 🎮 Game Server Plugin
- Monitor game servers (Minecraft, FiveM, Hytale, Source games)
- Live player counts in voice channels
- Auto-updating status embeds
- Support for multiple servers per guild

#### 🌍 Hytale Community Plugin
- **News Feed** - Automatic Hytale news from hytale.com with pagination
- **Lore Database** - Zones, factions, creatures, and weapons info
- **Trivia System** - 34+ questions with leaderboards
- **Faction Roles** - Self-assignable roles for all 8 factions
- **Build Ideas** - Random Hytale-themed building challenges
- **Fan Art Gallery** - Community art submission system
- **Developer Quotes** - Quotes from Hypixel Studios
- **Development Timeline** - Hytale's development history
- **Soundtrack Info** - Music details by Oscar Garvin
- **Concept Art Gallery** - Browse official Hytale art
- **Channel Restrictions** - `/hytale setchannel` to limit commands

**Factions included:** Kweebecs, Ferans, Trorks, Scaraks, Outlanders, Slothians, Fauns, Klops

#### 🎭 Community Plugin
- **RPG System** - Character classes, adventures, dungeons, and boss fights
- **Pet Collection** - Hunt, collect, level up, and evolve 15+ unique pets
- **Card Collecting** - Open packs, trade cards, complete collections
- **Reputation System** - Give and receive karma with leaderboards
- **Achievements** - 15 unlockable badges with coin rewards
- **Starboard** - Automatically highlight popular messages
- **Time Capsules** - Send messages to the future
- **Prediction Market** - Create and bet on community predictions
- **Boss Raids** - Cooperative server-wide boss battles
- **Channel Restrictions** - `/community setchannel` to limit commands

**RPG Classes:** Warrior, Mage, Rogue, Cleric

## Installation

### Prerequisites
- Node.js v16.9.0 or higher
- npm or yarn
- A Discord bot token ([Get one here](https://discord.com/developers/applications))

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ImVylo/HyVorn-Bot.git
cd HyVorn-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure the bot:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your bot credentials:
```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "defaultPrefix": "!",
  "devGuildId": "",
  "debug": false
}
```

5. Start the bot:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

### config.json
- `token` - Your Discord bot token
- `clientId` - Your bot's client ID
- `ownerId` - Your Discord user ID (for bot owner commands)
- `botName` - Custom name for the bot (default: `HyVornBot`)
- `defaultPrefix` - Default command prefix (default: `!`)
- `devGuildId` - Guild ID for testing slash commands (optional)
- `debug` - Enable debug logging (default: `false`)

## Plugin System

HyVornBot supports custom plugins for extended functionality.

### Creating a Plugin

1. Create a new folder in the `plugins/` directory
2. Add an `index.js` file with your plugin code
3. Add a `plugin.json` file with plugin metadata:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "author": "Your Name",
  "enabled": true
}
```

### Plugin Structure

```javascript
export default {
  name: 'my-plugin',

  // Called when plugin is loaded
  async onLoad(client) {
    console.log('Plugin loaded!');
  },

  // Called when plugin is unloaded
  async onUnload(client) {
    console.log('Plugin unloaded!');
  },

  // Add custom commands, events, etc.
  commands: [],
  events: []
};
```

## Project Structure

```
HyVornBot/
├── bot.js                 # Main entry point
├── config.json           # Bot configuration
├── package.json          # Dependencies
├── data/                 # Database files
├── logs/                 # Log files
├── plugins/              # Custom plugins
│   ├── community/        # RPG, pets, cards, achievements
│   ├── example-plugin/
│   ├── gameserver/
│   └── hytale/
└── src/
    ├── commands/         # Command files
    │   ├── admin/
    │   ├── birthdays/
    │   ├── economy/
    │   ├── fun/
    │   ├── giveaway/
    │   ├── leveling/
    │   ├── moderation/
    │   ├── requests/
    │   ├── suggestions/
    │   ├── tickets/
    │   ├── utility/
    │   └── voice/
    ├── core/            # Core bot systems
    │   ├── Client.js
    │   ├── CommandHandler.js
    │   ├── Database.js
    │   ├── EventHandler.js
    │   ├── Logger.js
    │   ├── Permissions.js
    │   └── PluginLoader.js
    ├── events/          # Discord event handlers
    ├── modules/         # Feature modules
    │   ├── AutoMod.js
    │   ├── Birthdays.js
    │   ├── Economy.js
    │   ├── Giveaways.js
    │   ├── Leveling.js
    │   ├── Logging.js
    │   ├── ReactionRoles.js
    │   ├── Requests.js
    │   ├── TempVoice.js
    │   └── Welcome.js
    └── utils/           # Utility functions
        ├── constants.js
        ├── embeds.js
        ├── pagination.js
        └── time.js
```

## Dependencies

- **discord.js** (v14.14.1) - Discord API library
- **better-sqlite3** (v9.4.3) - SQLite database
- **gamedig** (v5.0.0) - Game server query library

## Recent Updates

### Latest Changes
- ✅ **Module Integration Overhaul** - Unified all module and command property names
- ✅ **New Command Suite** - Added AutoMod, Welcome, and Reaction Roles commands
- ✅ **Leveling Rewards** - Fixed and improved level reward system
- ✅ **Bug Fixes** - Resolved method name mismatches in giveaway and leveling commands
- ✅ **Consistent Logging** - Replaced console.error with proper logger throughout
- ✅ Consolidated notification settings into `/config notifications`
- ✅ Consolidated log channel settings into `/logs channels`
- ✅ Added channel restrictions - limit commands to specific channels
- ✅ Configurable bot name and owner ID via config.json

### New Commands
- 🛡️ **AutoMod**: `/automod-setup`, `/automod-toggle`, `/automod-whitelist`
- 👋 **Welcome**: `/welcome-setup`, `/welcome-test`
- 🎭 **Reaction Roles**: `/reactionrole-create`, `/reactionrole-remove`, `/reactionrole-list`
- ⭐ **Leveling**: `/addreward`, `/rewards` (manage role rewards for levels)
- 📝 Unified request system (tickets, suggestions, bug reports, applications)
- 🎮 Game server status integration via plugin system

## Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/ImVylo/HyVorn-Bot/issues)

## License

This project is licensed under the MIT License.

## Author

Created by [ImVylo](https://github.com/ImVylo)
