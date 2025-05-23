const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require("./config.json");

const bot = new Client({ disableEveryone: true, intents:[GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]});

//Create a new collection for the commands this bot recognizes based on files in the ./commands directory
bot.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');``
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    bot.commands.set(command.data.name, command);
}

//required data utilizes JSON.parse instead of require to be able to edit it in runtime
bot.pbs = JSON.parse(fs.readFileSync(`./data/pbs.json`, (err) => {if (err) throw err}));
bot.stats = JSON.parse(fs.readFileSync(`./data/stats.json`, (err) => {if (err) throw err}));
bot.banned = JSON.parse(fs.readFileSync(`./data/banned.json`, (err) => {if (err) throw err}));
bot.levels = JSON.parse(fs.readFileSync(`./data/levels.json`, (err) => {if (err) throw err}));
bot.updateData = JSON.parse(fs.readFileSync(`./data/updateData.json`, (err) => {if (err) throw err}));
bot.userFix = JSON.parse(fs.readFileSync(`./data/knownProblemUsers.json`, (err) => {if (err) throw err}));
bot.loginMessages = JSON.parse(fs.readFileSync(`./data/loginMessages.json`, (err) => {if (err) throw err}));

//Once the bot is ready to recieve commands from the discord server,
//send a console output stating bot is logged in.
bot.once('ready', async () => {
    console.log("Numero is now logged in!");
    //let server = (await bot.guilds.fetch("574999598158839809"));
    //let channel = await server.channels.fetch("951197744763142164");
    //channel.send(bot.loginMessages[Math.floor(Math.random()*bot.loginMessages.length)]);
});

//Whenever a / command is run in one of the two servers this bot is part of
//perform a few checks to make sure it is in the correct channel(specified by server owner),
//and that it is a command this bot handles. If it is, attempt to handle the command.
bot.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.channelId != '951197744763142164' && interaction.channelId != '471500099080683541') return interaction.reply({content: `I'm sorry but you are not allowed to use this bot in this channel!`, ephemeral: true});;

    if (bot.banned.ids.includes(interaction.user.id)) return bannedMessage(interaction, bot, interaction.user.id);

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return interaction.reply({content: 'I have no fucking clue how you got this message', ephemeral: true});
    //console.log(interaction.options._hoistedOptions);
    try {
        await command.execute(interaction, bot);
    } catch (error) {
        console.error(error);
        try {
            await interaction.reply({content: `There was an error while executing this command! Please let Synithea know\n\`\`\`\n${error}\`\`\``, ephemeral: true});
        } catch (err) {
            await interaction.editReply({content: `There was an error while executing this command! Please let Synithea know\n\`\`\`\n${error}\`\`\``, ephemeral: true})
        }
    }
});

//w1ndzs simulator (This is a joke function, designed to recreate what a member of a community did to every new post in a specific channel.)
bot.on('messageCreate', async message => {
    if (message.channelId == "736931235061825617") message.react("🐒");
});

bot.login(token);

//Any user who is banned from using this bot, will get this message.
//which includes the reason they were banned from using the bot, and it will only be visible to them.
async function bannedMessage(interaction, bot, id)
{
    let reason = bot.banned.detailed[bot.banned.ids.indexOf(id)].reason;

    interaction.reply({content: `I'm sorry but you are not allowed to use this bot due to: ${reason}.`, ephemeral: true});
}
