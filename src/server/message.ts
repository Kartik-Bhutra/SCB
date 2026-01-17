import { messaging } from "../lib/firebase";

export async function sendHighPriorityAndroid() {
  const message = {
    android: {
      priority: "high" as const,
      ttl: 300,
      notification: {
        channelId: "blockedUpdates",
      },
    },

    topic: "blockedUpdates",
  };

  await messaging.send(message);
}
