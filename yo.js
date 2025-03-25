// ==SE_module==
// name: snapchatopener
// displayName: snapchatopener
// description: a script that opens all snaps INSTANTLY
// version: 1.0
// author: jxyytf
// ==/SE_module==

class AutoOpenSnaps {
    constructor(context) {
        this.context = context;
        this.snapQueue = [];
        this.snapQueueSize = 0;
        this.openedSnaps = new Set();
        this.notificationId = Math.floor(Math.random() * 100000);
        this.init();
    }

    sendStatusNotification(count) {
        console.log(`Auto Open Snaps: ${count} snaps opened.`);
    }

    async processQueue() {
        while (this.snapQueue.length > 0) {
            let { conversationId, messageId } = this.snapQueue.shift();
            this.snapQueueSize--;
            await new Promise(res => setTimeout(res, Math.random() * 50 + 50));
            
            let result = null;
            for (let i = 0; i < 5; i++) {
                if (!this.context.messaging.conversationManager) {
                    await new Promise(res => setTimeout(res, 0));
                    continue;
                }

                result = await this.context.messaging.conversationManager.updateMessage(conversationId, messageId, "READ");
                
                if (result && result !== "DUPLICATEREQUEST") {
                    console.warn("Failed to mark snap as read, retrying...");
                    await new Promise(res => setTimeout(res, 3000));
                    continue;
                }
                break;
            }

            if (this.snapQueueSize <= 5) {
                this.openedSnaps.clear();
            } else {
                this.sendStatusNotification(this.openedSnaps.size);
            }
        }
    }

    init() {
        this.context.event.subscribe("BuildMessageEvent", (event) => {
            if (event.message.senderId?.toString() === this.context.database.myUserId) return;
            let conversationId = event.message.messageDescriptor?.conversationId?.toString();
            let messageId = event.message.messageDescriptor?.messageId;

            if (!conversationId || !messageId || 
                event.message.messageContent?.contentType !== "SNAP" || 
                event.message.messageMetadata?.openedBy?.includes(this.context.database.myUserId)) {
                return;
            }

            if (this.openedSnaps.has(messageId)) return;
            this.openedSnaps.add(messageId);
            this.snapQueueSize++;
            this.snapQueue.push({ conversationId, messageId });
            this.processQueue();
        });
    }
}

// Usage example
const autoOpener = new AutoOpenSnaps({
    messaging: { conversationManager: { updateMessage: async (cid, mid, status) => "DUPLICATEREQUEST" } },
    event: { subscribe: (event, callback) => console.log(`Subscribed to ${event}`) },
    database: { myUserId: "12345" }
});
