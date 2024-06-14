const { dateEqual } = require('@sapphire/shapeshift');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require("node:fs");

// Developer tool, used to either ban users from using the bot
// Or to fix issues that arise due to buggy discord <-> game linking

module.exports = {
    data: new SlashCommandBuilder()
        .setName('2114devtool')
        .setDescription("Dev-Tool")
        .addUserOption(option =>
            option.setName("user")
            .setDescription("user")
            .setRequired(true))
        .addStringOption(option =>
            option.setName("logreason")
            .setDescription("Reason for logging their interactions")
            .setRequired(true))
        .addIntegerOption(option => 
            option.setName("action")
            .setDescription("Action to take")
            .addChoices(
				{ name: 'Sorry... Not Sorry', value: 0 },
				{ name: 'Problem Child Workaround', value: 1 }
			)
            .setRequired(true))
        .addStringOption(option =>
            option.setName("id")
            .setDescription("CH UserID")),
    async execute(interaction, bot) {
        console.log(`${interaction.user.id} tried to use the devtool!`);
        if (interaction.user.id != "264060404118978562") return interaction.reply({content: "Sorry this tool is exclusively for developers of the bot!", ephemeral: true});
        const user = interaction.options.getUser("user", true).id;
        const reason = interaction.options.getString("logreason", true);
        const action = interaction.options.getInteger("action", true);
        const id = interaction.options.getString("id");

        switch (action)
        {
            case 0:
                await ban(user, reason, interaction, bot);
                break;
            case 1:
                await fix(user, id, interaction, bot)
                break;
        }
        
    },
};

async function ban(user, reason, interaction)
{
    let detailed = {"id": user, "reason": reason}

    bot.banned.ids.push(user);
    bot.banned.detailed.push(detailed);

    await fs.writeFileSync(`./data/banned.json`, JSON.stringify(bot.banned, null, 4), (err) => {if (err) throw err});

    await interaction.reply({content: `User banned!`, ephemeral: true});
}

async function fix(user, id, interaction, bot)
{
    let detailed = {"userID": id, "discordID": user}
    
    bot.userFix.push(detailed);

    await fs.writeFileSync(`./data/knownProblemUsers.json`, JSON.stringify(bot.userFix, null, 4), (err) => {if (err) throw err});

    await interaction.reply(`User discordID fixed! Fixed ${id} with discord:${user}`);
}
