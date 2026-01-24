import { messaging } from "@/lib/firebase";

export async function sendHighPriorityAndroid() {
  const message = {
    android: {
      priority: "high" as const,
      //   ttl: 5 * 60 * 1000,
      //   notification: {
      //     title: "Blocked Update",
      //     body: "Your block list has been updated",
      //     channelId: "blockedUpdates",
      //   },
    },
    topic: "blockedUpdates",
    data: {
      type: "blockedUpdates",
    },
  };

  await messaging.send(message);
}
