// GameServer Plugin for HyVornBot
// Created by ImVylo

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';

const SERVER_TYPES = [
  { name: 'FiveM', value: 'fivem' },
  { name: 'Minecraft', value: 'minecraft' },
  { name: 'Hytale', value: 'hytale' },
  { name: 'Rust', value: 'rust' },
  { name: 'ARK', value: 'ark' },
  { name: 'Source (CS2, TF2, etc)', value: 'source' }
];

const Colors = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  ERROR: 0xED4245
};

class GameServerPlugin {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('GameServer');
    this.updateInterval = null;
    this.UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    this.commands = []; // Track registered commands for cleanup
  }

  async init() {
    this.log.info('GameServer plugin initializing...');

    // Register the /server command
    this.registerCommands();

    // Start auto-update loop
    this.startAutoUpdate();

    this.log.success('GameServer plugin loaded!');
  }

  registerCommands() {
    const serverCommand = {
      name: 'server',
      description: 'Game server management',
      category: 'plugins',
      cooldown: 10,
      guildOnly: true,

      data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Game server management')
        .addSubcommand(sub =>
          sub.setName('setup')
            .setDescription('Setup a game server to monitor')
            .addStringOption(opt =>
              opt.setName('type')
                .setDescription('Server type')
                .setRequired(true)
                .addChoices(...SERVER_TYPES)
            )
            .addStringOption(opt =>
              opt.setName('name').setDescription('Server name').setRequired(true)
            )
            .addStringOption(opt =>
              opt.setName('ip').setDescription('Server IP address').setRequired(true)
            )
            .addIntegerOption(opt =>
              opt.setName('port').setDescription('Server port').setRequired(true)
            )
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Status channel for embed updates')
                .addChannelTypes(ChannelType.GuildText)
            )
            .addChannelOption(opt =>
              opt.setName('voicechannel')
                .setDescription('Voice channel for player count display')
                .addChannelTypes(ChannelType.GuildVoice)
            )
        )
        .addSubcommand(sub =>
          sub.setName('status')
            .setDescription('Get server status')
            .addStringOption(opt =>
              opt.setName('server').setDescription('Server name').setAutocomplete(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('players')
            .setDescription('Get player list')
            .addStringOption(opt =>
              opt.setName('server').setDescription('Server name').setAutocomplete(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('list')
            .setDescription('List all configured servers')
        )
        .addSubcommand(sub =>
          sub.setName('remove')
            .setDescription('Remove a server')
            .addIntegerOption(opt =>
              opt.setName('id').setDescription('Server ID').setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub.setName('setvoice')
            .setDescription('Set voice channel for player count display')
            .addIntegerOption(opt =>
              opt.setName('id').setDescription('Server ID').setRequired(true)
            )
            .addChannelOption(opt =>
              opt.setName('channel')
                .setDescription('Voice channel (leave empty to remove)')
                .addChannelTypes(ChannelType.GuildVoice)
            )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

      execute: this.handleCommand.bind(this),
      autocomplete: this.handleAutocomplete.bind(this)
    };

    this.client.commands.set(serverCommand.name, serverCommand);
    this.client.slashCommands.set(serverCommand.name, serverCommand);
    this.commands.push(serverCommand.name);

    this.log.debug('Registered command: server');
  }

  startAutoUpdate() {
    // Initial update after 30 seconds
    setTimeout(() => {
      this.updateAllServers();
    }, 30000);

    // Then update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateAllServers();
    }, this.UPDATE_INTERVAL_MS);

    this.log.info(`Auto-update started (every ${this.UPDATE_INTERVAL_MS / 1000 / 60} minutes)`);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getServers() {
    return this.client.db.getAllGameServers();
  }

  async updateAllServers() {
    const servers = this.getServers();

    for (const server of servers) {
      try {
        await this.updateServerStatus(server);
      } catch (error) {
        this.log.error(`Error updating server ${server.name}:`, error.message);
      }
    }
  }

  async updateServerStatus(server) {
    const status = await this.queryServer(server);

    if (server.voice_channel) {
      await this.updateVoiceChannel(server, status);
    }

    if (server.status_channel) {
      await this.updateStatusEmbed(server, status);
    }
  }

  async queryServer(server) {
    const { type, ip, port } = server;

    try {
      switch (type.toLowerCase()) {
        case 'minecraft':
          return await this.queryMinecraft(ip, port);
        case 'fivem':
        case 'redm':
          return await this.queryFiveM(ip, port);
        case 'hytale':
          return await this.queryHytale(ip, port);
        case 'source':
          return await this.querySource(ip, port);
        default:
          return await this.queryGamedig(type, ip, port);
      }
    } catch (error) {
      this.log.error(`Failed to query ${type} server ${ip}:${port}:`, error.message);
      return { online: false, error: error.message };
    }
  }

  async queryMinecraft(ip, port = 25565) {
    try {
      const response = await fetch(`https://api.mcsrvstat.us/2/${ip}:${port}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();

        if (data.online) {
          return {
            online: true,
            players: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            playerList: data.players?.list || [],
            version: data.version || 'Unknown',
            motd: data.motd?.clean?.[0] || ''
          };
        }
      }

      return { online: false };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  async queryFiveM(ip, port = 30120) {
    try {
      const response = await fetch(`http://${ip}:${port}/players.json`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) throw new Error('Failed to fetch players');

      const players = await response.json();

      const infoResponse = await fetch(`http://${ip}:${port}/info.json`, {
        signal: AbortSignal.timeout(5000)
      });

      let serverInfo = {};
      if (infoResponse.ok) {
        serverInfo = await infoResponse.json();
      }

      return {
        online: true,
        players: players.length,
        maxPlayers: serverInfo.vars?.sv_maxClients || 32,
        playerList: players.map(p => p.name),
        serverName: serverInfo.vars?.sv_projectName || 'Unknown'
      };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  async queryHytale(ip, port) {
    const dgram = await import('dgram');

    return new Promise((resolve) => {
      const DISCOVERY_PORT = 5510;
      const REQUEST_HEADER = Buffer.from('HYTALE_DISCOVER_REQUEST', 'ascii');
      const REPLY_HEADER = Buffer.from('HYTALE_DISCOVER_REPLY', 'ascii');

      const socket = dgram.createSocket('udp4');
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.close();
          resolve({ online: false, players: 0, maxPlayers: 0 });
        }
      }, 5000);

      socket.on('message', (data) => {
        if (resolved) return;

        try {
          if (!data.slice(0, REPLY_HEADER.length).equals(REPLY_HEADER)) {
            return;
          }

          let offset = REPLY_HEADER.length;
          offset += 1; // Protocol version
          const addressType = data.readUInt8(offset);
          offset += 1;
          offset += addressType; // Skip address bytes
          const serverPort = data.readUInt16LE(offset);
          offset += 2;
          const nameLength = data.readUInt16LE(offset);
          offset += 2;
          const serverName = data.slice(offset, offset + nameLength).toString('utf8');
          offset += nameLength;
          const playerCount = data.readInt32LE(offset);
          offset += 4;
          const maxPlayers = data.readInt32LE(offset);

          resolved = true;
          clearTimeout(timeout);
          socket.close();

          resolve({
            online: true,
            players: playerCount,
            maxPlayers: maxPlayers,
            hostname: serverName,
            serverName: serverName
          });
        } catch (error) {
          // Parse error
        }
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.close();
          resolve({ online: false, players: 0, maxPlayers: 0 });
        }
      });

      socket.send(REQUEST_HEADER, DISCOVERY_PORT, ip, (err) => {
        if (err && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.close();
          resolve({ online: false, players: 0, maxPlayers: 0 });
        }
      });
    });
  }

  async querySource(ip, port = 27015) {
    try {
      const GameDig = await import('gamedig');
      const result = await GameDig.default.query({
        type: 'protocol-valve',
        host: ip,
        port: port
      });

      return {
        online: true,
        players: result.players.length,
        maxPlayers: result.maxplayers,
        playerList: result.players.map(p => p.name),
        map: result.map,
        game: result.raw?.game || 'Source'
      };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  async queryGamedig(type, ip, port) {
    try {
      const GameDig = await import('gamedig');
      const result = await GameDig.default.query({
        type: type,
        host: ip,
        port: port
      });

      return {
        online: true,
        players: result.players?.length || 0,
        maxPlayers: result.maxplayers || 0,
        playerList: result.players?.map(p => p.name || p) || [],
        map: result.map,
        name: result.name
      };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  async updateVoiceChannel(server, status) {
    try {
      const channel = await this.client.channels.fetch(server.voice_channel).catch(() => null);

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return;
      }

      let newName;
      if (status.online) {
        newName = `🎮 ${server.name}: ${status.players}/${status.maxPlayers}`;
      } else {
        newName = `🔴 ${server.name}: Offline`;
      }

      if (channel.name !== newName) {
        await channel.setName(newName).catch(err => {
          this.log.warn(`Failed to update voice channel name: ${err.message}`);
        });
      }
    } catch (error) {
      this.log.error(`Error updating voice channel for ${server.name}:`, error.message);
    }
  }

  async updateStatusEmbed(server, status) {
    try {
      const channel = await this.client.channels.fetch(server.status_channel).catch(() => null);

      if (!channel) return;

      const embed = this.createStatusEmbed(server, status);

      if (server.status_message) {
        try {
          const message = await channel.messages.fetch(server.status_message);
          await message.edit({ embeds: [embed] });
        } catch {
          const message = await channel.send({ embeds: [embed] });
          this.client.db.updateServerStatusMessage(server.id, message.id);
        }
      } else {
        const message = await channel.send({ embeds: [embed] });
        this.client.db.updateServerStatusMessage(server.id, message.id);
      }
    } catch (error) {
      this.log.error(`Error updating status embed for ${server.name}:`, error.message);
    }
  }

  createStatusEmbed(server, status) {
    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${server.name}`)
      .setColor(status.online ? Colors.SUCCESS : Colors.ERROR)
      .addFields(
        { name: 'Status', value: status.online ? '🟢 Online' : '🔴 Offline', inline: true },
        { name: 'Type', value: server.type.toUpperCase(), inline: true },
        { name: 'Address', value: `\`${server.ip}:${server.port}\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Last updated' });

    if (status.online) {
      embed.addFields(
        { name: 'Players', value: `${status.players}/${status.maxPlayers}`, inline: true }
      );

      if (status.map) {
        embed.addFields({ name: 'Map', value: status.map, inline: true });
      }

      if (status.version) {
        embed.addFields({ name: 'Version', value: status.version, inline: true });
      }

      if (status.serverName || status.hostname) {
        embed.setDescription(status.serverName || status.hostname);
      }

      if (status.playerList && status.playerList.length > 0 && status.playerList.length <= 30) {
        embed.addFields({
          name: `Players Online (${status.players})`,
          value: status.playerList.join(', ').slice(0, 1000) || 'None',
          inline: false
        });
      }
    }

    return embed;
  }

  async handleAutocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const servers = this.client.db.getGameServers(interaction.guild.id);

    const choices = servers
      .filter(s => s.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(s => ({ name: `${s.name} (${s.type})`, value: s.name }));

    await interaction.respond(choices);
  }

  async handleCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;

    switch (subcommand) {
      case 'setup': {
        const type = interaction.options.getString('type');
        const name = interaction.options.getString('name');
        const ip = interaction.options.getString('ip');
        const port = interaction.options.getInteger('port');
        const channel = interaction.options.getChannel('channel');
        const voiceChannel = interaction.options.getChannel('voicechannel');

        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!ipRegex.test(ip)) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ Invalid IP address or hostname!')],
            flags: MessageFlags.Ephemeral
          });
        }

        const serverId = this.client.db.addGameServer({
          guildId: guild.id,
          name: name,
          type: type,
          ip: ip,
          port: port,
          statusChannel: channel?.id || null,
          voiceChannel: voiceChannel?.id || null,
          rconPassword: null
        });

        const embed = new EmbedBuilder()
          .setColor(Colors.SUCCESS)
          .setTitle('✅ Server Added')
          .addFields(
            { name: 'Name', value: name, inline: true },
            { name: 'Type', value: type.toUpperCase(), inline: true },
            { name: 'Address', value: `${ip}:${port}`, inline: true },
            { name: 'Status Channel', value: channel ? `${channel}` : 'None', inline: true },
            { name: 'Voice Channel', value: voiceChannel ? `${voiceChannel}` : 'None', inline: true },
            { name: 'ID', value: `#${serverId}`, inline: true }
          )
          .setFooter({ text: 'Use /server status to check server status' })
          .setTimestamp();

        if (channel) {
          try {
            const server = { id: serverId, name, type, ip, port };
            const status = await this.queryServer(server);
            const statusEmbed = this.createStatusEmbed(server, status);
            const statusMsg = await channel.send({ embeds: [statusEmbed] });
            this.client.db.updateServerStatusMessage(serverId, statusMsg.id);
          } catch (e) {
            // Ignore errors
          }
        }

        return interaction.reply({ embeds: [embed] });
      }

      case 'status': {
        const serverName = interaction.options.getString('server');
        const servers = this.client.db.getGameServers(guild.id);

        let server;
        if (serverName) {
          server = servers.find(s => s.name.toLowerCase() === serverName.toLowerCase());
        } else {
          server = servers[0];
        }

        if (!server) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ No server found. Use `/server setup` to add one.')],
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply();

        const status = await this.queryServer(server);

        const embed = new EmbedBuilder()
          .setColor(status.online ? Colors.SUCCESS : Colors.ERROR)
          .setTitle(`🎮 ${server.name}`)
          .setDescription(status.online ? '🟢 **Online**' : '🔴 **Offline**')
          .addFields(
            { name: 'Address', value: `\`${server.ip}:${server.port}\``, inline: true },
            { name: 'Type', value: server.type.toUpperCase(), inline: true }
          )
          .setTimestamp();

        if (status.online) {
          embed.addFields(
            { name: 'Players', value: `${status.players}/${status.maxPlayers}`, inline: true }
          );
          if (status.map) {
            embed.addFields({ name: 'Map', value: status.map, inline: true });
          }
          if (status.hostname) {
            embed.setDescription(`🟢 **Online**\n${status.hostname}`);
          }
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'players': {
        const serverName = interaction.options.getString('server');
        const servers = this.client.db.getGameServers(guild.id);

        let server;
        if (serverName) {
          server = servers.find(s => s.name.toLowerCase() === serverName.toLowerCase());
        } else {
          server = servers[0];
        }

        if (!server) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ No server found.')],
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply();

        const status = await this.queryServer(server);

        if (!status.online) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ Server is offline.')]
          });
        }

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle(`👥 Players on ${server.name}`)
          .setDescription(`**${status.players}/${status.maxPlayers}** players online`)
          .setTimestamp();

        if (status.playerList && status.playerList.length > 0) {
          const playerNames = status.playerList.slice(0, 50).map(p => p.name || p).join('\n');
          embed.addFields({ name: 'Player List', value: playerNames || 'Unable to fetch player names', inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'list': {
        const servers = this.client.db.getGameServers(guild.id);

        if (servers.length === 0) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ No servers configured. Use `/server setup` to add one.')],
            flags: MessageFlags.Ephemeral
          });
        }

        const serverList = servers.map(s => {
          let info = `**#${s.id}** - ${s.name}\n\`${s.type.toUpperCase()}\` | \`${s.ip}:${s.port}\``;
          if (s.voice_channel) info += ` | 🔊 <#${s.voice_channel}>`;
          if (s.status_channel) info += ` | 📝 <#${s.status_channel}>`;
          return info;
        }).join('\n\n');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle('🎮 Configured Servers')
          .setDescription(serverList)
          .setFooter({ text: `${servers.length} server(s)` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'remove': {
        const serverId = interaction.options.getInteger('id');
        const servers = this.client.db.getGameServers(guild.id);
        const server = servers.find(s => s.id === serverId);

        if (!server) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ Server not found.')],
            flags: MessageFlags.Ephemeral
          });
        }

        this.client.db.deleteGameServer(serverId);
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`✅ Server **${server.name}** has been removed.`)]
        });
      }

      case 'setvoice': {
        const serverId = interaction.options.getInteger('id');
        const voiceChannel = interaction.options.getChannel('channel');
        const servers = this.client.db.getGameServers(guild.id);
        const server = servers.find(s => s.id === serverId);

        if (!server) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.ERROR).setDescription('❌ Server not found.')],
            flags: MessageFlags.Ephemeral
          });
        }

        this.client.db.updateServerVoiceChannel(serverId, voiceChannel?.id || null);

        if (voiceChannel) {
          const status = await this.queryServer(server);
          await this.updateVoiceChannel({ ...server, voice_channel: voiceChannel.id }, status);

          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`✅ Voice channel for **${server.name}** set to ${voiceChannel}.\nPlayer count will update every 5 minutes.`)]
          });
        } else {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setDescription(`✅ Voice channel removed for **${server.name}**.`)]
          });
        }
      }
    }
  }

  cleanup() {
    this.stopAutoUpdate();
    this.log.info('GameServer plugin cleaned up');
  }
}

export default GameServerPlugin;
