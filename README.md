# Giveaway Bot

A powerful Discord bot designed to manage giveaways effortlessly! This bot allows server administrators to create, list, end, and reroll giveaways with simple commands. It features auto-deletion of user commands, automatic giveaway endings, and a custom status.

## Features

- **Create Giveaways**: Use `!mga create #channel <time> <winners> <prize>` (e.g., `!mga create #giveaway 1d 2 Nitro`) to start a giveaway with a specified duration (1d, 1h, 1m, 1s), number of winners, and prize.
- **Auto-Delete Commands**: Automatically deletes the user's command message after processing (requires "Manage Messages" permission).
- **Auto-End Giveaways**: Giveaways end automatically based on the set duration, with random winner selection.
- **List Active Giveaways**: Use `!mga list` to view all active giveaways in the server.
- **End Giveaways Early**: Use `!mga end <message_id>` to manually end a giveaway (requires "Manage Server" permission).
- **Reroll Winners**: Use `!mga reroll <message_id>` to select new winners for an ended giveaway (requires "Manage Server" permission).
- **Custom Status**: Displays "Playing Nguyện hộ tôi" when online.
- **Web Keep-Alive**: Includes a simple web server for hosting on platforms like Render or Heroku.
- **Error Handling**: Logs unhandled errors for debugging.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16.9.0 or higher)
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Steps
1. **Clone or Download the Repository**:
   - Clone this repository or download the files to your local machine.

2. **Create a `.env` File**:
   - In the project root, create a file named `.env`.
   - Add the following line with your bot token:
     ```
     BOT_TOKEN=your_discord_bot_token
     PORT=3000
     ```
   - Replace `your_discord_bot_token` with the token from the Discord Developer Portal.
   - Do not commit the `.env` file to version control; add it to `.gitignore`.

3. **Install Dependencies**:
   - Open a terminal in the project directory and run:
     ```
     npm install
     ```
   - This will install `discord.js`, `dotenv`, and `express`.
     ```
     npm install discord.js && npm install dotenv && npm install express
     ```

4. **Invite the Bot to Your Server**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Select your bot, navigate to "OAuth2 > URL Generator".
   - Check `bot` scope and permissions (`Send Messages`, `Manage Messages`, `Add Reactions`, `Embed Links`, `Read Message History`).
   - Generate and use the URL to invite the bot to your server.

## Running the Bot

1. **Start the Bot**:
   - In the terminal, run:
     ```
     node index.js
     ```
   - You should see output like:
     ```
     🌐 Web server running on port 3000
     Đã đăng nhập với tên <bot_name>
     ```

2. **Verify**:
   - Check your Discord server; the bot should be online with the status "Playing Nguyện hộ tôi".
   - Test commands like `!mga create #channel 10s 1 prize` in a channel.

3. **Hosting (Optional)**:
   - For 24/7 hosting, deploy on platforms like [Render](https://render.com/) or [Heroku](https://www.heroku.com/).
   - Set environment variables `BOT_TOKEN` and `PORT` in the hosting dashboard.
   - Use a service like [UptimeRobot](https://uptimerobot.com/) to ping `/ping` every 5 minutes to keep the bot alive.

## Commands
- `!mga create #channel <time> <winners> <prize>`: Create a giveaway.
- `!mga list`: List active giveaways.
- `!mga end <message_id>`: End a giveaway early.
- `!mga reroll <message_id>`: Reroll winners.
- `!mga help`: Display command help.

## Notes
- The bot requires "Manage Server" permission for `create`, `end`, and `reroll` commands.
- Ensure the bot has proper channel permissions to send messages and react.
- Check the terminal for error logs (e.g., `UNHANDLED_REJECTION`) if issues arise.

## Contributing
Feel free to submit issues or pull requests on the repository!

## License
MIT License (specify if different).

---

