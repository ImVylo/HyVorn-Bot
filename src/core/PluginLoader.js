// Plugin Loader for HyVornBot
// Created by ImVylo

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PluginLoader {
  constructor(client) {
    this.client = client;
    this.log = client.logger.child('Plugins');
    this.pluginsPath = path.join(__dirname, '../../plugins');
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadPlugins() {
    this.log.info('Loading plugins...');

    // Ensure plugins directory exists
    if (!fs.existsSync(this.pluginsPath)) {
      fs.mkdirSync(this.pluginsPath, { recursive: true });
      this.log.warn('Plugins directory created');
      return;
    }

    const pluginFolders = fs.readdirSync(this.pluginsPath).filter(file => {
      const filePath = path.join(this.pluginsPath, file);
      return fs.statSync(filePath).isDirectory();
    });

    let loadedCount = 0;

    for (const folder of pluginFolders) {
      try {
        const pluginPath = path.join(this.pluginsPath, folder);
        const manifestPath = path.join(pluginPath, 'plugin.json');

        // Check for plugin manifest
        if (!fs.existsSync(manifestPath)) {
          this.log.warn(`Plugin ${folder} is missing plugin.json`);
          continue;
        }

        // Load manifest
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        // Validate manifest
        if (!manifest.name || !manifest.version || !manifest.main) {
          this.log.warn(`Plugin ${folder} has invalid manifest`);
          continue;
        }

        // Load plugin
        const mainPath = path.join(pluginPath, manifest.main);
        const fileUrl = pathToFileURL(mainPath).href;
        const plugin = await import(fileUrl);

        if (plugin.default) {
          const pluginInstance = {
            manifest,
            path: pluginPath,
            instance: null,
            loaded: false
          };

          // Initialize plugin
          if (typeof plugin.default === 'function') {
            pluginInstance.instance = new plugin.default(this.client);
          } else if (typeof plugin.default === 'object') {
            pluginInstance.instance = plugin.default;
          }

          // Call init if available
          if (pluginInstance.instance && typeof pluginInstance.instance.init === 'function') {
            await pluginInstance.instance.init();
          }

          pluginInstance.loaded = true;
          this.client.plugins.set(manifest.name, pluginInstance);
          loadedCount++;

          this.log.debug(`Loaded plugin: ${manifest.name} v${manifest.version}`);
        }
      } catch (error) {
        this.log.error(`Failed to load plugin ${folder}:`, error.message);
      }
    }

    this.log.success(`Loaded ${loadedCount} plugins`);
  }

  /**
   * Load a specific plugin
   * @param {string} name - Plugin name or folder name
   * @returns {boolean} Success
   */
  async loadPlugin(name) {
    const pluginPath = path.join(this.pluginsPath, name);

    if (!fs.existsSync(pluginPath)) {
      this.log.error(`Plugin folder not found: ${name}`);
      return false;
    }

    const manifestPath = path.join(pluginPath, 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      this.log.error(`Plugin ${name} is missing plugin.json`);
      return false;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Check if already loaded
      if (this.client.plugins.has(manifest.name)) {
        this.log.warn(`Plugin ${manifest.name} is already loaded`);
        return false;
      }

      const mainPath = path.join(pluginPath, manifest.main);
      const fileUrl = pathToFileURL(mainPath).href;
      const plugin = await import(`${fileUrl}?t=${Date.now()}`);

      if (plugin.default) {
        const pluginInstance = {
          manifest,
          path: pluginPath,
          instance: null,
          loaded: false
        };

        if (typeof plugin.default === 'function') {
          pluginInstance.instance = new plugin.default(this.client);
        } else {
          pluginInstance.instance = plugin.default;
        }

        if (pluginInstance.instance && typeof pluginInstance.instance.init === 'function') {
          await pluginInstance.instance.init();
        }

        pluginInstance.loaded = true;
        this.client.plugins.set(manifest.name, pluginInstance);

        this.log.success(`Loaded plugin: ${manifest.name} v${manifest.version}`);
        return true;
      }
    } catch (error) {
      this.log.error(`Failed to load plugin ${name}:`, error.message);
    }

    return false;
  }

  /**
   * Unload a plugin
   * @param {string} name - Plugin name
   * @returns {boolean} Success
   */
  async unloadPlugin(name) {
    const plugin = this.client.plugins.get(name);

    if (!plugin) {
      this.log.error(`Plugin not found: ${name}`);
      return false;
    }

    try {
      // Call cleanup if available
      if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
        await plugin.instance.cleanup();
      }

      // Unregister any commands registered by the plugin
      if (plugin.instance && plugin.instance.commands) {
        for (const cmdName of plugin.instance.commands) {
          this.client.commands.delete(cmdName);
          this.client.slashCommands.delete(cmdName);
        }
      }

      this.client.plugins.delete(name);
      this.log.success(`Unloaded plugin: ${name}`);
      return true;
    } catch (error) {
      this.log.error(`Failed to unload plugin ${name}:`, error.message);
    }

    return false;
  }

  /**
   * Reload a plugin
   * @param {string} name - Plugin name
   * @returns {boolean} Success
   */
  async reloadPlugin(name) {
    const plugin = this.client.plugins.get(name);

    if (!plugin) {
      this.log.error(`Plugin not found: ${name}`);
      return false;
    }

    const folderName = path.basename(plugin.path);

    // Unload then load
    const unloaded = await this.unloadPlugin(name);
    if (!unloaded) return false;

    return await this.loadPlugin(folderName);
  }

  /**
   * Get list of loaded plugins
   * @returns {Object[]} Plugin info array
   */
  getLoadedPlugins() {
    return Array.from(this.client.plugins.values()).map(p => ({
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description || 'No description',
      author: p.manifest.author || 'Unknown',
      loaded: p.loaded
    }));
  }

  /**
   * Get list of available plugins (including not loaded)
   * @returns {Object[]} Plugin info array
   */
  getAvailablePlugins() {
    const plugins = [];

    if (!fs.existsSync(this.pluginsPath)) return plugins;

    const pluginFolders = fs.readdirSync(this.pluginsPath).filter(file => {
      const filePath = path.join(this.pluginsPath, file);
      return fs.statSync(filePath).isDirectory();
    });

    for (const folder of pluginFolders) {
      const manifestPath = path.join(this.pluginsPath, folder, 'plugin.json');

      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          const loaded = this.client.plugins.has(manifest.name);

          plugins.push({
            folder,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description || 'No description',
            author: manifest.author || 'Unknown',
            loaded
          });
        } catch (error) {
          plugins.push({
            folder,
            name: folder,
            version: 'Unknown',
            description: 'Failed to read manifest',
            author: 'Unknown',
            loaded: false,
            error: true
          });
        }
      }
    }

    return plugins;
  }
}

export default PluginLoader;
export { PluginLoader };
