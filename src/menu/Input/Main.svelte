<script lang="ts">
    import { fade, scale } from "svelte/transition";

    let showInput = false;
    let setTitle: string = 'Vehicle Model';
    let setValue = '';
    let inputEl: HTMLInputElement;
    export let inputBlocking = false;

    window.addEventListener('message', (event) => {
        const data = event.data;
        const action = data.action;

        if (action === 'showInputPrompt') {
            showInput = data.showInput;
            setTitle = data.title;
            setValue = data.value;
            if (!showInput) setValue = '';

            if (data.showInput) {
                inputBlocking = true;
            } else {
                setTimeout(() => { inputBlocking = false; }, 350);
            }
        } else if (action === 'hideInputPrompt') {
            showInput = false;
            setTimeout(() => { inputBlocking = false; }, 350);
        } else if (action === 'updateInputPrompt') {
            setTitle = data.title;
            setValue = data.value;
        } else if (action === 'updateKeyboard') {
            showInput = data.visible;
            setTitle = data.title;
            setValue = data.value ?? '';

            if (data.visible) {
                inputBlocking = true;
            } else {
                setValue = '';
                setTimeout(() => { inputBlocking = false; }, 350);
            }
        }
    });
</script>

<main>
    {#if showInput}
        <div class="input-overlay" transition:fade>
            <div class="input-box" transition:scale={{ start: 0.94, duration: 480 }}>
                <div class="input-header">
                    <div class="input-header-inner">
                        <!-- <span>I</span>
                        <div class="input-divider"></div> -->
                        <div class="input-header-text">Venom Menu - {setTitle}</div>
                    </div>
                </div>
                <input type="text" bind:this={inputEl} bind:value={setValue} />
            </div>
        </div>
    {/if}
</main>

<style>
    .input-overlay {
        position: fixed;
        top: 0;
        left: 0;
        transform: none;
        width: 100%;
        height: 100%;
        background: rgb(0, 0, 0, 0.5);
        z-index: 999999;
        color: white;
        font-weight: 500;
        font-family: sans-serif;
        font-size: 1.2vh;
    }

    .input-box {
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 0.25vh;
        display: flex;
        flex-direction: column;
        position: fixed;
        bottom: 17.5vh;
        left: 50%;
        transform: translateX(-50%);
        height: auto;
        width: 55vh;
        overflow: hidden;
    }

    .input-box > .input-header {
        padding: 0.8vh 1vh 0.8vh 1vh;
        border-bottom: 0.1vh solid var(--color-mainSolid);
        width: 100%;
        font-size: 1.2vh;
    }

    .input-header-inner {
        display: flex;
        align-items: center;
        gap: 0.5vh;
    }

    /* .input-header-inner img {
        width: auto;
        height: 2vh;
        object-fit: contain;
    }

    .input-divider {
        width: 0.2vh;
        height: 1.5vh;
        background: var(--color-mainSolid);
    } */

    .input-header-text {
        color: white;
    }

    .input-box input {
        padding: 1.25vh 1vh 1.25vh 1vh;
        border: none;
        outline: none;
        background: transparent;
        color: white;
        font-size: 1.2vh;
        display: block;
        margin: 0;
    }
</style>