const { SlashCommandBuilder } = require('discord.js');

// Ping!


// Pong!

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Replies with Pong!"),
    async execute(interaction, bot) {
        await interaction.reply({content: "Pong!", ephemeral: true});
    },
};