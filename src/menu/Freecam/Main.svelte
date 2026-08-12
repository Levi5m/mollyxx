<script lang="ts">
    import { fade, fly } from "svelte/transition";

    let showFreecam = false
    let weaponIndex = 0
    let vehicleIndex = 0
    let setHoverd = 0
    let setWeaponList = ["WEAPON_TRANQUILIZER"];
    let setVehicleList = ["Dump"];
    let setOptions: any[] = [];
    let setItemRefs: HTMLElement[] = [];

    $: if (setOptions && setItemRefs.length !== setOptions.length) setItemRefs = Array(setOptions.length);
    $: if (showFreecam && setItemRefs[setHoverd]) {
        try {
        const setEl = setItemRefs[setHoverd] as HTMLElement;
        const container = setEl?.parentElement as HTMLElement | null;

        if (container && container.scrollHeight > container.clientHeight) {
            const setTop = setEl.offsetTop;
            const setBottom = setTop + setEl.offsetHeight;
            const setViewTop = container.scrollTop;
            const setViewBottom = setViewTop + container.clientHeight;

            if (setTop < setViewTop) {
                container.scrollTo({ top: setTop, behavior: 'smooth' });
            } else if (setBottom > setViewBottom) {
                container.scrollTo({ top: setBottom - container.clientHeight, behavior: 'smooth' });
            }
        } else {
            setEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        } catch (e) {}
    }

    window.addEventListener('message', (event) => {
        const data = event.data;
        const action = data.action;

        if (action === 'displayFreecam') {
            showFreecam = data.visible;
            setOptions = data.options;
            setWeaponList = data.weaponOptions
            setVehicleList = data.vehicleOptions
            if (data.weaponIndex !== undefined) weaponIndex = data.weaponIndex - 1;
            if (data.vehicleIndex !== undefined) vehicleIndex = data.vehicleIndex - 1;
        } else if (action === "updateWeapon") {
            weaponIndex = data.index - 1
        } else if (action === "updateVehicle") {
            vehicleIndex = data.index - 1
        } else if (action === "scroll") {
            if (data.direction === "up") {
                setHoverd = (setHoverd - 1 + setOptions.length) % setOptions.length;
            } else {
                setHoverd = (setHoverd + 1) % setOptions.length;
            }
        }
    });
</script>

<main>
    {#if showFreecam}
        <div in:fly={{ y: 8, duration: 350 }} out:fly={{ y: 8, duration: 350 }} class="hovering-text-wrap">
            <ul class="hovering-text-list" style="-webkit-mask-image: linear-gradient(transparent 0%, black 0%, black 95%, transparent 100%);">
                {#each setOptions as option, i}
                    <li bind:this={setItemRefs[i]} style="color: white;" class="hovering-text-item {i === setHoverd ? 'hovering-text-selected' : 'hovering-text-inactive'}" data-id={option.label.toLowerCase().replace(/\s+/g, '_')} data-data={option.label} id="hovering-text-opt-{i}" aria-current={i === setHoverd ? 'true' : 'false'}>
                        {#if i === setHoverd && option.label === 'Spawn Car'}
                            <span style="color: #fff;">-</span>
                            {option.label} (<span style="color: rgba(197, 34, 34);">{setVehicleList[vehicleIndex]}</span>)
                            <span style="color: #fff;">-</span>
                        {:else if i === setHoverd && option.label === 'Shoot Weapon'}
                            <span style="color: #fff;">-</span>
                            {option.label} (<span style="color: rgba(197, 34, 34);">{setWeaponList[weaponIndex]}</span>)
                            <span style="color: #fff;">-</span>
                        {:else if i === setHoverd}
                            <span style="color: #fff;">-</span>
                            <span style="color: rgba(197, 34, 34);">{option.label}</span>
                            <span style="color: #fff;">-</span>
                        {:else}
                            <span style="color: #fff;">{option.label}</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>

        <div in:fade={{ duration: 350 }} out:fade={{ duration: 350 }} style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0.9259vh; height: 0.9259vh; pointer-events: none; z-index: 10000; display: block;">
            <div style="position: absolute; top: 50%; left: 0px; width: 100%; height: 0.185vh; background-color: white; transform: translateY(-50%);"></div>
            <div style="position: absolute; left: 50%; top: 0px; width: 0.185vh; height: 100%; background-color: white; transform: translateX(-50%);"></div>
        </div>
    {/if}
</main>