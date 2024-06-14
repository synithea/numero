const { SlashCommandBuilder } = require('discord.js');

/*
* This command was requested by a member of the community.
* This command specifically does not serve the original intent of this bot.
* Just here to hopefully make someones day or have a quick laugh with a few options under `positivity`
*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ihaveselfesteemissues')
        .setDescription("I know, so do I..."),
    async execute(interaction, bot) {
        let i = Math.floor(Math.random()*5)
        let positivity = [
            "You are cool",
            "You are valid",
            "You should have high elf esteem",
            "Go out there and be great",
            "Good job you managed to type this!",
        ]
        await interaction.reply({content: `${positivity[i]}`, ephemeral: false});
    },
};