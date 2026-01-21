// Interaction create event - handles slash commands, buttons, modals, etc.
// Created by ImVylo

export default {
  name: 'interactionCreate',
  once: false,

  async execute(client, interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      return client.commandHandler.handleSlashCommand(interaction);
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      return handleAutocomplete(client, interaction);
    }

    // Handle buttons
    if (interaction.isButton()) {
      return handleButton(client, interaction);
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      return handleSelectMenu(client, interaction);
    }

    // Handle modals
    if (interaction.isModalSubmit()) {
      return handleModal(client, interaction);
    }
  }
};

/**
 * Handle autocomplete interactions
 */
async function handleAutocomplete(client, interaction) {
  const command = client.slashCommands.get(interaction.commandName);

  if (!command || !command.autocomplete) return;

  try {
    await command.autocomplete(interaction, client);
  } catch (error) {
    client.logger.error('Autocomplete', `Error in ${interaction.commandName}:`, error.message);
  }
}

/**
 * Handle button interactions
 */
async function handleButton(client, interaction) {
  const [action, ...args] = interaction.customId.split('_');

  // Handle ticket buttons
  if (action === 'ticket') {
    const ticketModule = client.getModule('tickets');
    if (ticketModule) {
      return ticketModule.handleButton(interaction, args);
    }
  }

  // Handle giveaway buttons
  if (action === 'giveaway') {
    const giveawayModule = client.getModule('giveaways');
    if (giveawayModule) {
      return giveawayModule.handleButton(interaction, args);
    }
  }

  // Handle reaction role buttons
  if (action === 'role') {
    const reactionRolesModule = client.getModule('reactionroles');
    if (reactionRolesModule) {
      return reactionRolesModule.handleButton(interaction, args);
    }
  }

  // Handle verification buttons
  if (action === 'verify') {
    const welcomeModule = client.getModule('welcome');
    if (welcomeModule) {
      return welcomeModule.handleVerification(interaction);
    }
  }

  // Handle suggestion buttons
  if (action === 'suggestion') {
    const suggestionsModule = client.getModule('suggestions');
    if (suggestionsModule) {
      return suggestionsModule.handleButton(interaction, args);
    }
  }

  // Handle application buttons
  if (action === 'application') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      return applicationsModule.handleButton(interaction, args);
    }
  }

  // Handle bug report button
  if (action === 'bugreport') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      return applicationsModule.showBugReportModal(interaction);
    }
  }

  // Handle play report button
  if (action === 'playreport') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      return applicationsModule.showPlayReportModal(interaction);
    }
  }

  // Handle unified request system buttons
  if (action === 'request') {
    const requestsModule = client.getModule('requests');
    if (requestsModule) {
      return requestsModule.handleButton(interaction, args);
    }
  }

  // Check for command-specific button handlers
  const commandName = action;
  const command = client.slashCommands.get(commandName) || client.commands.get(commandName);

  if (command && command.handleButton) {
    try {
      await command.handleButton(interaction, args, client);
    } catch (error) {
      client.logger.error('Button', `Error handling button for ${commandName}:`, error.message);
    }
  }
}

/**
 * Handle select menu interactions
 */
async function handleSelectMenu(client, interaction) {
  const [action, ...args] = interaction.customId.split('_');

  // Handle ticket category selection
  if (action === 'ticket' && args[0] === 'category') {
    const ticketModule = client.getModule('tickets');
    if (ticketModule) {
      return ticketModule.handleCategorySelect(interaction);
    }
  }

  // Handle reaction role selection
  if (action === 'roles') {
    const reactionRolesModule = client.getModule('reactionroles');
    if (reactionRolesModule) {
      return reactionRolesModule.handleSelectMenu(interaction);
    }
  }

  // Handle config menu selections
  if (action === 'config') {
    const configCommand = client.slashCommands.get('config');
    if (configCommand && configCommand.handleSelectMenu) {
      return configCommand.handleSelectMenu(interaction, args, client);
    }
  }

  // Handle unified request system select menus
  if (action === 'request') {
    const requestsModule = client.getModule('requests');
    if (requestsModule) {
      return requestsModule.handleSelectMenu(interaction, args);
    }
  }
}

/**
 * Handle modal submissions
 */
async function handleModal(client, interaction) {
  const [action, ...args] = interaction.customId.split('_');

  // Handle ticket modal
  if (action === 'ticket') {
    const ticketModule = client.getModule('tickets');
    if (ticketModule) {
      return ticketModule.handleModal(interaction, args);
    }
  }

  // Handle giveaway modal
  if (action === 'giveaway') {
    const giveawayModule = client.getModule('giveaways');
    if (giveawayModule) {
      return giveawayModule.handleModal(interaction, args);
    }
  }

  // Handle embed builder modal
  if (action === 'embed') {
    const embedCommand = client.slashCommands.get('embed');
    if (embedCommand && embedCommand.handleModal) {
      return embedCommand.handleModal(interaction, args, client);
    }
  }

  // Handle tag modal
  if (action === 'tag') {
    const tagCommand = client.slashCommands.get('tag');
    if (tagCommand && tagCommand.handleModal) {
      return tagCommand.handleModal(interaction, args, client);
    }
  }

  // Handle application modal (multi-page system)
  if (action === 'application') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      if (args[0] === 'modal') {
        const positionName = args.slice(1).join('_');
        return applicationsModule.handleModalSubmit(interaction, positionName);
      } else if (args[0] === 'page') {
        const page = parseInt(args[1], 10);
        return applicationsModule.handlePageSubmit(interaction, page);
      }
    }
  }

  // Handle bug report modal
  if (action === 'bugreport') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      return applicationsModule.handleBugReportSubmit(interaction);
    }
  }

  // Handle play report modal
  if (action === 'playreport') {
    const applicationsModule = client.getModule('applications');
    if (applicationsModule) {
      return applicationsModule.handlePlayReportSubmit(interaction);
    }
  }

  // Handle unified request system modals
  if (action === 'request') {
    const requestsModule = client.getModule('requests');
    if (requestsModule) {
      if (args[0] === 'modal') {
        // Handle ticket modals: request_modal_ticket_{categoryId}
        if (args[1] === 'ticket') {
          const categoryId = args[2];
          return requestsModule.handleTicketModalSubmit(interaction, categoryId);
        }
        // Handle other modals: request_modal_{type}
        const type = args.slice(1).join('_');
        return requestsModule.handleModalSubmit(interaction, type);
      } else if (args[0] === 'apppage') {
        const page = parseInt(args[1], 10);
        return requestsModule.handleApplicationPageSubmit(interaction, page);
      } else if (args[0] === 'reason') {
        // Handle reason modal: request_reason_{requestId}_{status}
        const requestId = args[1];
        const status = args[2];
        return requestsModule.handleReasonModalSubmit(interaction, requestId, status);
      }
    }
  }
}
