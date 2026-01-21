// Event Handler for HyVornBot
// Created by ImVylo

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EventHandler {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Events');
    this.eventsPath = path.join(__dirname, '../events');
  }

  /**
   * Load all events from the events directory
   */
  async loadEvents() {
    this.log.info('Loading events...');

    // Ensure events directory exists
    if (!fs.existsSync(this.eventsPath)) {
      fs.mkdirSync(this.eventsPath, { recursive: true });
      this.log.warn('Events directory created');
      return;
    }

    const eventFiles = fs.readdirSync(this.eventsPath).filter(file => file.endsWith('.js'));
    let loadedCount = 0;

    for (const file of eventFiles) {
      try {
        const filePath = path.join(this.eventsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const event = await import(fileUrl);

        if (event.default) {
          const eventData = event.default;
          const eventName = eventData.name || file.replace('.js', '');

          if (eventData.once) {
            this.client.once(eventName, (...args) => eventData.execute(this.client, ...args));
          } else {
            this.client.on(eventName, (...args) => eventData.execute(this.client, ...args));
          }

          loadedCount++;
          this.log.debug(`Loaded event: ${eventName}${eventData.once ? ' (once)' : ''}`);
        }
      } catch (error) {
        this.log.error(`Failed to load event ${file}:`, error.message);
      }
    }

    this.log.success(`Loaded ${loadedCount} events`);
  }

  /**
   * Reload all events
   */
  async reloadEvents() {
    // Remove all event listeners except internal ones
    const internalEvents = ['error', 'warn', 'debug'];

    for (const eventName of this.client.eventNames()) {
      if (!internalEvents.includes(eventName)) {
        this.client.removeAllListeners(eventName);
      }
    }

    // Reload events
    await this.loadEvents();
  }
}

export default EventHandler;
export { EventHandler };
