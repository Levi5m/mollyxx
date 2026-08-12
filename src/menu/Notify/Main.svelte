<script lang="ts">
    import { fly } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    import { isEnvBrowser } from "../../utils/env";

    type NotificationType = 'info' | 'error' | 'success';

    interface Notification {
        index: number;
        type: NotificationType;
        header: string;
        message: string;
        duration: number;
        progress: number;
        visible: boolean;
    }

    const typeConfig: Record<NotificationType, { icon: string; color: string }> = {
        info: { icon: 'fa-info',  color: '#3d9bff' },
        error: { icon: 'fa-times', color: '#ff3d3d' },
        success: { icon: 'fa-check', color: '#3ddc68' },
    };

    let notifications: Notification[] = [];
    let setIndex = 1;

    const notify = (header: string, message: string, duration: number, type: NotificationType = 'info') => {
        const notification: Notification = { index: setIndex, type, header, message, duration, progress: 100, visible: true };
        setIndex++;
        notifications = [notification, ...notifications];

        const step = 100 / (duration / 100);
        const interval = setInterval(() => {
            const idx = notifications.findIndex((n) => n.index === notification.index);

            if (idx === -1) {
                clearInterval(interval);
                return;
            }

            if (notifications[idx].progress > 0) {
                notifications[idx].progress = Math.max(notifications[idx].progress - step, 0);
                notifications = [...notifications];
            } else {
                clearInterval(interval);
                notifications[idx].visible = false;
                notifications = [...notifications];
                setTimeout(() => {
                    notifications = notifications.filter((n) => n.index !== notification.index);
                }, 100);
            }
        }, 100);
    };

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.action === 'notify' || data.action === 'showNotification') {
            const header = data.header ?? data.title ?? 'Info';
            const message = data.message ?? data.desc ?? '';
            notify(header, message, data.duration || 4000, data.type || 'info');
        }
    });

    if (isEnvBrowser()) {
        notify('Success', 'You have successfully loaded Venom Menu, welcome!', 4000, 'success');
        notify('Info', 'Your license will never expire, thanks for using Venom Menu.', 4000, 'info');
        notify('Error', 'Loaded Staff/Developer Modules!', 4000, 'error');
    }
</script>

<main>
    <div class="notify-stack">
        {#each notifications as notification (notification.index)}
            {@const cfg = typeConfig[notification.type]}
            <div
                class="notify-card"
                style="--accent: {cfg.color};"
                animate:flip={{ duration: 300, easing: cubicOut }}
                in:fly={{ x: 80, duration: 350, easing: cubicOut }}
                out:fly={{ x: 80, duration: 250, easing: cubicOut }}
            >
                <div class="notify-body">
                    <div class="notify-icon-wrap">
                        <i class="fa {cfg.icon} notify-icon"></i>
                    </div>
                    <div class="notify-text">
                        <span class="notify-header">{notification.header}</span>
                        <span class="notify-message">{notification.message}</span>
                    </div>
                </div>
                <div class="notify-bar">
                    <div class="notify-bar-fill" style="width: {notification.progress}%;"></div>
                </div>
            </div>
        {/each}
    </div>
</main>

<style>
    :global(body), :global(main) {
        all: unset;
        display: block;
    }
    :global(main) {
        all: unset;
    }

    .notify-stack {
        position: fixed;
        bottom: 2vh;
        right: 2vh;
        display: flex;
        flex-direction: column;
        gap: 0.8vh;
        z-index: 9999;
        pointer-events: none;
    }

    .notify-card {
        background: rgba(0, 0, 0, 0.62);
        border-left: 0.25vh solid var(--accent);
        color: #fff;
        font-family: sans-serif;
        width: 32vh;
        max-width: 85vw;
        overflow: hidden;
        outline: none;
        border-top: none;
        border-right: none;
        border-bottom: none;
    }

    .notify-body {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 1vh 1.2vh 0.9vh 1.2vh;
        gap: 1vh;
    }

    .notify-icon-wrap {
        width: 2.2vh;
        height: 2.2vh;
        min-width: 2.2vh;
        border-radius: 50%;
        background: var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .notify-icon {
        font-size: 1.1vh;
        color: #fff;
        line-height: 1;
        display: block;
        text-align: center;
        width: 1.1vh;
        height: 1.1vh;
    }

    .notify-text {
        display: flex;
        flex-direction: column;
        gap: 0.2vh;
        min-width: 0;
    }

    .notify-header {
        font-size: 1.35vh;
        font-weight: 530;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.02em;
    }

    .notify-message {
        font-size: 1.05vh;
        font-weight: 300;
        color: rgba(200, 200, 200, 0.85);
        line-height: 1.4;
    }

    .notify-bar {
        height: 0.25vh;
        width: 100%;
        background: rgba(255, 255, 255, 0.06);
    }

    .notify-bar-fill {
        height: 100%;
        background: var(--accent);
        transition: width 0.1s linear;
        will-change: width;
    }
</style>