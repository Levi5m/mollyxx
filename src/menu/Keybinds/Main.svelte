<script lang="ts">
    import { fade } from "svelte/transition";
    import { isEnvBrowser } from "../../utils/env";

    interface Keybind {
        keyLabel: string;
        type: string;
        label: string;
        checked?: boolean;
    }

    let showing = false;
    let binds: Keybind[] = [];

    window.addEventListener('message', (event) => {
        const data = event.data;
        const action = data.action;

        if (action === 'displayBinds') {
            showing = data.visible;
            if (typeof data.binds !== 'undefined') binds = data.binds;
        } else if (action === 'updateBind') {
            if (typeof data.index === 'number' && binds[data.index]) {
                binds[data.index] = { ...binds[data.index], ...data.bind };
                binds = [...binds];
            }
        }
    });

    if (isEnvBrowser()) {
        binds = [
            { keyLabel: 'U', type: 'checkbox', label: 'Noclip', checked: true },
            { keyLabel: 'H', type: 'checkbox', label: 'Freecam', checked: false },
            { keyLabel: 'Z', type: 'button', label: 'Refill Health' },
            { keyLabel: 'Z', type: 'button', label: 'Refill Armour' }
        ];
        showing = true;
    }
</script>

<main>
    {#if showing && binds.length}
        <div class="kb-wrapper" transition:fade={{ duration: 250 }}>
            <div class="kb-header">
                <span>Keybinds</span>
            </div>
            <div class="kb-list">
                {#each binds as bind}
                    <div class="kb-row {bind.checked ? 'is-active' : ''}">
                        <span class="kb-label">{bind.label}</span>
                        <div class="kb-right">
                            <span class="kb-key">({bind.keyLabel})</span>
                            {#if bind.type === 'checkbox' || bind.type === 'slider-checkbox'}
                                <span class="kb-status">({bind.checked ? 'On' : 'Off'})</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</main>

<style>
    main {
        all: unset;
    }

    .kb-wrapper {
        position: fixed;
        top: 2vh;
        right: 2vh;
        min-width: 15vh;
        width: auto;
        display: flex;
        flex-direction: column;
        background: var(--bg-panel, rgba(13, 13, 13, 0.97));
        border-radius: var(--border-radius, 0.5vh);
        border: 0.07vh solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        font-family: var(--font, 'Inter', sans-serif);
        z-index: 998;
        white-space: nowrap;
    }

    .kb-header {
        display: flex;
        align-items: center;
        height: 2.4vh;
        padding: 0 1vh;
        background: var(--bg-deep, #0a0a0a);
        border-bottom: 0.05vh solid rgba(255, 255, 255, 0.06);
    }

    .kb-header span {
        font-size: 1.05vh;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-secondary, rgba(255, 255, 255, 0.42));
    }

    .kb-list {
        display: flex;
        flex-direction: column;
        padding: 0.3vh 0;
    }

    .kb-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.2vh;
        height: 2.5vh;
        padding: 0 1vh;
        transition: background 0.15s ease;
    }

    .kb-row.is-active {
        background: var(--color-main, rgba(197, 34, 34, 0.35));
    }

    .kb-row.is-active .kb-status {
        color: var(--color-mainSolid, rgba(197, 34, 34, 1));
    }

    .kb-label {
        font-size: 1.1vh;
        font-weight: 400;
        color: var(--text-primary, rgba(255, 255, 255, 0.92));
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .kb-right {
        display: flex;
        align-items: center;
        gap: 0.4vh;
        flex-shrink: 0;
    }

    .kb-key {
        font-size: 1.0vh;
        color: var(--text-primary, rgba(255, 255, 255, 0.92));
    }

    .kb-status {
        font-size: 1.0vh;
        color: var(--text-secondary, rgba(255, 255, 255, 0.42));
    }
</style>
