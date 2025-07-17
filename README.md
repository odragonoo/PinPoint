# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.






## Documentation of the chat: (Inspired by instagram Dms)
- Chat function has access to users/inchat and chat(the global file)
- Global file "Chat" has the chats of every account and they are ided
- inChat has the ids of the "cache" or meta data of the chats the user associated.
   + Basically an array of cache and they are ided
   + That incldues:
   1. name of person
   2. time stamp of last message
   3. last message itself
   4. Picture of the person's profile
   5. chatID (This makes it so when you press the chat it fetches the whole intire chat)

- Reason: We didn't want all the messages to be fetched when you press the chat tab. Doing so will cause lag or lower frames. Basically we are loading assets in the splash screen (the page where it shows the icon). Remember the reason the chat tab is the only option is because when you go through the chat tab it should have an image of the people you dm and the photos of the group chats. We also want to fetch the last message that was sent in the dm/gc. This also allows us to sort it based on the time of message. So the top dm/gc is the one that got the most recent text.
