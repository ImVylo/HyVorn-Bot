# HyVornBot

A feature-rich, modular Discord bot combining the best of MEE6 and RedBot with extensive customization options.

## Features

### Core Features
- **Modular Plugin System** - Extend functionality with custom plugins
- **Advanced Command Handler** - Easy-to-use command structure with categories
- **Database Integration** - Persistent data storage using SQLite
- **Comprehensive Logging** - Track all bot activities and errors
- **Permission System** - Fine-grained control over command access

### Command Categories

#### 🛡️ Moderation
- Ban, kick, mute, and warn members
- Temporary bans and mutes
- Message purging and slowmode
- Channel lockdown
- Nickname management
- Role management

#### 📊 Leveling System
- XP and level tracking
- Leaderboards
- Rank cards
- Customizable rewards

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
- Eval command (owner only)
- Reload commands
- View logs
- Help system
- About and ping commands

#### 📝 Requests
- User request system
- Request management

## Installation

### Prerequisites
- Node.js v16.9.0 or higher
- npm or yarn
- A Discord bot token ([Get one here](https://discord.com/developers/applications))

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ImVylo/HyVornBot.git
cd HyVornBot
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
│   ├── example-plugin/
│   └── gameserver/
└── src/
    ├── commands/         # Command files
    │   ├── admin/
    │   ├── economy/
    │   ├── fun/
    │   ├── giveaway/
    │   ├── leveling/
    │   ├── moderation/
    │   ├── requests/
    │   └── utility/
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
    │   ├── Economy.js
    │   ├── Giveaways.js
    │   ├── Leveling.js
    │   ├── Logging.js
    │   ├── ReactionRoles.js
    │   ├── Requests.js
    │   └── Welcome.js
    └── utils/           # Utility functions
```

## Dependencies

- **discord.js** (v14.14.1) - Discord API library
- **better-sqlite3** (v9.4.3) - SQLite database
- **gamedig** (v5.0.0) - Game server query library

## Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/ImVylo/HyVornBot/issues)

## License

This project is licensed under the MIT License.

## Author

Created by [ImVylo](https://github.com/ImVylo)
