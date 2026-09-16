<script lang="ts">
    import { onMount } from "svelte";
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

    onMount(() => {
        // ===== Molly Freecam Hooks =====
        // Define as actual functions on window — bypasses Svelte's reactive wrapping
        const win = window as any;

        win.setFreecamOptions = function(options: any[]) {
            console.log("[MOLLY] setFreecamOptions:", options);
            showFreecam = true;
            setOptions = Array.isArray(options) ? [...options] : [];
        };

        win.setFreecamSelected = function(optionId: string) {
            console.log("[MOLLY] setFreecamSelected:", optionId);
            const idx = setOptions.findIndex((o: any) => o.id === optionId);
            if (idx >= 0) setHoverd = idx;
        };

        win.updateFreecamOption = function(optionId: string, data: any) {
            console.log("[MOLLY] updateFreecamOption:", optionId, data);
            const idx = setOptions.findIndex((o: any) => o.id === optionId);
            if (idx >= 0) {
                const copy = [...setOptions];
                copy[idx] = { ...copy[idx], name: data.name, data: data.data };
                setOptions = copy;
            }
        };

        win.hoveringText = {
            showList: function() { 
                console.log("[MOLLY] hoveringText.showList");
                showFreecam = true; 
            },
            hideList: function() { 
                console.log("[MOLLY] hoveringText.hideList");
                showFreecam = false; 
            }
        };

        win.crosshair = {
            show: function() { 
                // crosshair is rendered alongside the list; no separate state
            },
            hide: function() { 
                // no-op
            }
        };

        console.log("[MOLLY] Freecam hooks installed. typeof setFreecamOptions =", typeof win.setFreecamOptions);

        return () => {
            // Cleanup on unmount (usually not needed for DUI)
            delete win.setFreecamOptions;
            delete win.setFreecamSelected;
            delete win.updateFreecamOption;
            delete win.hoveringText;
            delete win.crosshair;
        };
    });
</script>
