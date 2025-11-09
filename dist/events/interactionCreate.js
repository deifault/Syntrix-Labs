"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../index");
exports.default = {
    name: discord_js_1.Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = index_1.commands.get(interaction.commandName);
            if (!command)
                return;
            try {
                await command.execute(interaction);
            }
            catch (error) {
                const reply = {
                    content: 'There was an error executing this command.',
                    ephemeral: true
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                }
                else {
                    await interaction.reply(reply);
                }
            }
        }
        else if (interaction.isButton()) {
            const buttonHandlers = await Promise.resolve().then(() => __importStar(require('../handlers/buttonHandler')));
            await buttonHandlers.default(interaction);
        }
        else if (interaction.isStringSelectMenu()) {
            const selectHandlers = await Promise.resolve().then(() => __importStar(require('../handlers/selectHandler')));
            await selectHandlers.default(interaction);
        }
        else if (interaction.isModalSubmit()) {
            const modalHandlers = await Promise.resolve().then(() => __importStar(require('../handlers/modalHandler')));
            await modalHandlers.default(interaction);
        }
    }
};
