<script lang="ts">
    import { scale } from 'svelte/transition';
    import { isEnvBrowser } from '../../utils/env';
    
    let current = 0;
    let activeMenu: any[] = [];
    let activeTabs = ['Main Menu'];
    let currentTab = 0;
    let showing = false;

    let setMenuTop = '23vh';
    let setMenuLeft = '6.25vh';

    let wrapperEl: HTMLElement;
    let listEl: HTMLElement;
    let trackHeight = 0;
    let thumbTop = 0;
    let thumbHeight = 24;
    let hasOverflow = false;
    let MIN_THUMB = 100;

    let itemRefs: HTMLElement[] = [];
    let banner: string = 'https://r2.fivemanage.com/Z8B50VjDrkoAUPTQqy96i/4671a49bb8dbd061986d53c51832e7dc.jpg';

    let selectableMenu: any[] = [];
    let selectableIndices: number[] = [];

    $: selectableIndices = activeMenu.reduce<number[]>((acc, o, i) => {
        if (o?.type !== 'divider') acc.push(i);
        return acc;
    }, []);

    $: selectableMenu = selectableIndices.map((i) => activeMenu[i]);

    $: selectedOption = activeMenu[current];
    $: selectedMeta = selectedOption?.metaData ?? [];

    // --- Compatibility layer -------------------------------------------------
    // Your in-game Lua backend sends menu data shaped like the "Vanta" project
    // (type: "subMenu", "scrollable", "slider-checkbox", values/value, categories,
    // etc). This menu was built for a slightly different shape (type as an array,
    // options/selected instead of values/value). These helpers translate one into
    // the other so the *look* stays exactly as-is but real game messages work.

    function normalizeType(type: any): string[] | string {
        if (type === 'divider') return 'divider';
        if (Array.isArray(type)) return type;
        switch (type) {
            case 'subMenu': return ['submenu'];
            case 'scrollable': return ['scroll'];
            case 'scrollable-checkbox': return ['scroll', 'checkbox'];
            case 'slider-checkbox': return ['slider', 'checkbox'];
            case 'button': return [];
            default: return type ? [type] : [];
        }
    }

    function normalizeItem(item: any) {
        if (!item) return item;
        const type = normalizeType(item.type);
        const normalized: any = { ...item, type };
        if (type !== 'divider' && Array.isArray(item.values)) {
            normalized.options = item.values.map((v: string) => ({ label: v }));
            normalized.selected = item.value;
        }
        return normalized;
    }

    function applyItems(list: any[]) {
        activeMenu = (list || []).map(normalizeItem);
    }

    function applyCategories(cats: { label: string; tabs: any[] }[] | null | undefined, index = 0) {
        if (cats && cats.length) {
            activeTabs = cats.map((c) => c.label);
            currentTab = index;
        } else {
            activeTabs = ['Main Menu'];
            currentTab = 0;
        }
    }

    function applyBannerColor(color: string) {
        const root = document.documentElement;
        root.style.setProperty('--color-main', `rgba(${color},0.35)`);
        root.style.setProperty('--color-border', `rgba(${color},0.35)`);
        root.style.setProperty('--color-shadow', `rgba(${color},0.35)`);
        root.style.setProperty('--color-notify-main', `rgba(${color})`);
        root.style.setProperty('--color-notify-shadow', `rgba(${color},0.35)`);
        root.style.setProperty('--color-mainSolid', `rgba(${color})`);
        root.style.setProperty('--color-tab', `rgba(${color},0.35)`);
    }
    // --------------------------------------------------------------------------

    function counterCurrent() {
        if (!selectableIndices.length) return 0;
        const pos = selectableIndices.indexOf(current);
        if (pos !== -1) return pos + 1;
        const nearestPos = selectableIndices.reduce(
            (bestPos, idx, pos) =>
                Math.abs(idx - current) < Math.abs(selectableIndices[bestPos] - current) ? pos : bestPos,
            0
        );
        return nearestPos + 1;
    }

    let scrollIndex: number | null = null;
    const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

    function updateScrollbar() {
        if (!wrapperEl || !listEl) return;
        if (scrollIndex) return;
        scrollIndex = requestAnimationFrame(() => {
            trackHeight = Math.round(listEl.clientHeight);

            const clientH = listEl.clientHeight;
            const scrollH = listEl.scrollHeight;
            hasOverflow = scrollH > clientH + 1;

            const itemCount = activeMenu.length;
            const FULL_THUMB_COUNT = 7;

            if (hasOverflow) {
                thumbHeight = Math.max(MIN_THUMB, Math.round((clientH / scrollH) * trackHeight));
                thumbHeight = Math.min(thumbHeight, trackHeight);
                const maxScroll = Math.max(0, scrollH - clientH);
                const ratio = maxScroll ? clamp(listEl.scrollTop / maxScroll, 0, 1) : 0;
                const trackScrollable = Math.max(0, trackHeight - thumbHeight);
                thumbTop = Math.round(trackScrollable * ratio);
                thumbTop = clamp(thumbTop, 0, Math.max(0, trackHeight - thumbHeight));
            } else {
                thumbHeight = itemCount <= FULL_THUMB_COUNT ? trackHeight : Math.max(MIN_THUMB, Math.round(trackHeight * (FULL_THUMB_COUNT / itemCount)));
                thumbHeight = Math.min(thumbHeight, trackHeight);

                const trackScrollable = Math.max(0, trackHeight - thumbHeight);
                const count = Math.max(1, itemCount);
                const ratio = count > 1 ? clamp(current, 0, count - 1) / (count - 1) : 0;
                thumbTop = Math.round(trackScrollable * ratio);
                thumbTop = clamp(thumbTop, 0, Math.max(0, trackHeight - thumbHeight));
            }

            scrollIndex = null;
        });
    }

    const scheduleMeasure = () => updateScrollbar();

    const onListScroll = () => {
        if (!listEl || !hasOverflow) return;
        if (scrollIndex) return;
        scrollIndex = requestAnimationFrame(() => {
            const maxScroll = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
            const ratio = maxScroll ? clamp(listEl.scrollTop / maxScroll, 0, 1) : 0;
            const trackScrollable = Math.max(0, trackHeight - thumbHeight);
            thumbTop = Math.round(trackScrollable * ratio);
            thumbTop = clamp(thumbTop, 0, Math.max(0, trackHeight - thumbHeight));
            scrollIndex = null;
        });
    };

    let highlightEl: HTMLElement;
    let highlightTop = 0;
    let skipTransition = false;

    function moveHighlight(newTop: number) {
        if (!highlightEl) { highlightTop = newTop; return; }
        const fromTop = skipTransition? newTop: (parseFloat(window.getComputedStyle(highlightEl).top) || highlightTop);
        highlightEl.getAnimations().forEach(a => a.cancel());
        highlightTop = newTop;
        highlightEl.animate(
            [{ top: fromTop + 'px' }, { top: newTop + 'px' }],
            { duration: 220, easing: 'ease-out', fill: 'forwards' }
        );
    }

    $: if (itemRefs[current]) {
        moveHighlight(itemRefs[current].offsetTop);
    }


    window.addEventListener('message', (event) => {
        const data = event.data;
        const action = data.action;

        if (action === 'setCurrent') {
            current = data.current - 1;
            activeMenu = data.menu;
            showing = true;
            itemRefs[current]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });

            scheduleMeasure();        
        } else if (action === 'showMenu') {
            showing = data.visible;
            if (showing) {
                itemRefs[current]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });            
            }

            scheduleMeasure();
        } else if (action === 'setTabs') {
            activeTabs = data.tabs || [];
            currentTab = data.index;
        } else if (action === 'setTabIndex') {
            currentTab = data.index || 0;
        } else if (action == 'resetTabs') {
            activeTabs = ['Main Menu'];
            currentTab = 0;
        } else if (action === 'setMenuPos') {
            if (data.x !== undefined) setMenuLeft = data.x + 'vh';
            if (data.y !== undefined) setMenuTop = data.y + 'vh';
        } else if (action === 'setBanner') {
            if (data.url) banner = data.url;
        } else if (action === 'setMenuColor') {
            const r = data.r ?? 197;
            const g = data.g ?? 34;
            const b = data.b ?? 34;
            applyBannerColor(`${r},${g},${b}`);
        } else if (action === 'showUI') {
            showing = !!data.visible;
            if (data.visible) {
                if (data.elements) applyItems(data.elements);
                applyCategories(data.categories, data.categoryIndex || 0);
                current = typeof data.index === 'number' ? data.index : 0;
                itemRefs[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                scheduleMeasure();
            } else if (typeof data.index === 'number') {
                current = data.index;
            }
        } else if (action === 'updateElements') {
            if (data.elements) applyItems(data.elements);
            current = typeof data.index === 'number' ? data.index : 0;
            applyCategories(data.categories, data.categoryIndex || 0);
            itemRefs[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            scheduleMeasure();
        } else if (action === 'keydown') {
            if (typeof data.index === 'number') {
                current = data.index;
                itemRefs[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else if (action === 'updateBanner') {
            if (data.bannerLink) banner = data.bannerLink;
            if (data.bannerColor) applyBannerColor(data.bannerColor);
        }
    });

    if (isEnvBrowser()) {
        applyCategories([
            { label: 'Player', tabs: [] },
            { label: 'Miscellaneous', tabs: [] },
            { label: 'Wardrobe', tabs: [] }
        ], 0);

        applyItems([
            { type: 'button', label: 'Revive', desc: 'This will attempt to revive you.' },
            { type: 'slider', label: 'Health', value: 100, min: 0, max: 100 },
            { type: 'slider', label: 'Armour', value: 50, min: 0, max: 100 },
            { type: 'checkbox', label: 'Godmode', checked: true },
            { type: 'scrollable', label: 'Values', value: 1, values: ['Safe', 'Dangerous'] },
            { type: 'divider', label: 'Movement' },
            { type: 'slider-checkbox', label: 'Noclip', value: 2.5, min: 0.25, max: 5.0, step: 0.25 },
            { type: 'submenu', label: 'Equipment' },
            { type: 'divider', label: 'Nearby Players' },
            {
                type: 'checkbox', label: 'stuntdev - [1]', checked: false, name: 'J. Paul', dead: true,
                metaData: [
                    { key: 'Distance', value: '317.0m' },
                    { key: 'Server ID', value: '1' },
                    { key: 'Health', value: '75', color: '0, 255, 17' },
                    { key: 'Armour', value: '90', color: '0, 132, 255' },
                    { key: 'Weapon', value: 'Microsmg' },
                    { key: 'Vehicle', value: 'None' },
                    { key: 'Speed', value: '0.0 km/h' }
                ]
            },
            { type: 'checkbox', label: 'ion - [2]', checked: false, vehicle: true }
        ]);

        current = 0;
        showing = true;
    }
</script>

<svelte:head>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
</svelte:head>

{#if showing}
    <div bind:this={wrapperEl} class="menu-root" style="top: {setMenuTop}; left: {setMenuLeft}; transform-origin: top left;" transition:scale={{ start: 0.94, duration: 480 }}>
        <div class="menu-banner">
            <img src={banner} alt="" />
        </div>

        <div class="menu-tabs">
            {#each activeTabs as tab, i}
                <div class="tab-item {i === currentTab ? 'active' : ''}"
                        style="{activeTabs.length === 1 ? 'min-width: 8vh; flex-grow: 0; flex-basis: auto;' : ''}">
                    {tab}
                </div>
            {/each}
        </div>

        <div class="menu-scrollbar">
            <div class="scrollbar-track" style="height: {trackHeight}px;">
                <div class="scrollbar-thumb" style="top: {thumbTop}px; height: {thumbHeight}px;"></div>
            </div>
        </div>
        
        <div class="menu-body">
            <div class="menu-items" bind:this={listEl} on:scroll={onListScroll}>
                <div bind:this={highlightEl} class="selection-highlight" style="top: {highlightTop}px;"></div>

                {#each activeMenu as option, index}
                    {#if option.type == 'divider'}
                        <div class="separator-container">
                            <div class="separator-bar"></div>
                            <div class="separator-text">{option.label}</div>
                            <div class="separator-bar"></div>
                        </div>
                    {:else}
                        <div bind:this={itemRefs[index]} class="menu-item {current === index ? 'is-selected' : ''}">
                            <div class="item-label">
                                {#if option.dead}
                                    <i class="ph ph-skull dead-icon" title="Dead"></i>
                                {/if}
                                {#if option.vehicle}
                                    <i class="ph ph-car-simple vehicle-icon" title="In Vehicle"></i>
                                {/if}
                                {#if Array.isArray(option.type) && option.type.includes('slider') || option.type == 'slider'}
                                    <span class="name">
                                        {option.label}
                                        {#if current === index}<span class="slider-val">: {option.value}</span>{/if}
                                    </span>
                                {:else}
                                    <span class="name">{option.label}</span>
                                {/if}
                            </div>

                            <div class="components-container">
                                {#each (Array.isArray(option.type) ? option.type : [option.type]) as type}
                                    {#if type === 'submenu'}
                                        <div class="component">
                                            <i class="ph ph-caret-right caret-icon"></i>
                                        </div>
                                    {:else if type === 'checkbox'}
                                        <div class="component">
                                            <label class="toggle-switch">
                                                <input type="checkbox" bind:checked={option.checked} />
                                                <span class="toggle-track">
                                                    <span class="toggle-thumb"></span>
                                                </span>
                                            </label>
                                        </div>
                                    {:else if type === 'slider'}
                                        <div class="component">
                                            <div class="range-component">
                                                <div class="range-track"></div>
                                                <div class="range-fill" style="width: {option.max > option.min ? (((option.value - option.min) / (option.max - option.min)) * 100) + '%' : '0%'};"></div>
                                                <input type="range" bind:value={option.value} min={option.min} max={option.max} step={option.step} />
                                            </div>
                                        </div>
                                    {:else if type === 'scroll'}
                                        <div class="component">
                                            <div class="scroll-value">
                                                <span>
                                                    {option.options?.[option.selected - 1]?.label ||
                                                    option.options?.[0]?.label ||
                                                    ((!option.options || option.options.length === 0) ? 'Loading...' : 'None')}
                                                </span>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <div class="menu-footer">
            <span class="footer-brand">Venom - Menu</span>
            <span class="footer-counter">
                {selectableMenu.length ? counterCurrent() : 0}/{selectableMenu.length}
            </span>
        </div>
    </div>

    {#if selectedMeta.length}
        <div class="meta-panel" style="top: {setMenuTop}; left: calc({setMenuLeft} + 35vh);" transition:scale={{ start: 0.94, duration: 320 }}>
            <div class="meta-header">
                <span class="meta-name">{selectedOption.name ?? selectedOption.label}</span>
                {#if selectedOption.dead}<span class="meta-dead-tag">DEAD</span>{/if}
            </div>
            <div class="meta-body">
                {#each selectedMeta as row}
                    <div class="meta-row">
                        <span class="meta-key">{row.key}</span>
                        <div class="meta-val-wrap">
                            <span class="meta-val" style={row.color ? `color: rgb(${row.color})` : ''}>{row.value}</span>
                            {#if row.key === 'Health' || row.key === 'Armour'}
                                <div class="meta-bar">
                                    <div class="meta-bar-fill" style="width: {Math.max(0, Math.min(100, parseInt(row.value) || 0))}%; background: {row.color ? `rgb(${row.color})` : 'var(--color-mainSolid)'};"></div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
{/if}

<style>
    :root {
        --color-main: rgba(197, 34, 34, 0.35);
        --color-border: rgba(197, 34, 34, 0.35);
        --color-shadow: rgba(197, 34, 34, 0.35);
        --color-notify-main: rgba(197, 34, 34, 1);
        --color-notify-shadow: rgba(197, 34, 34, 0.35);
        --color-mainSolid: rgba(197, 34, 34, 1);
        --color-tab: rgba(197, 34, 34, 0.35);

        --bg-deep: #0a0a0a;
        --bg-mid: #111111;
        --bg-panel: rgba(13, 13, 13, 0.97);
        --text-primary: rgba(255, 255, 255, 0.92);
        --text-secondary: rgba(255, 255, 255, 0.42);
        --text-divider: rgba(255, 255, 255, 0.38);
        --divider-line: rgba(255, 255, 255, 0.12);
        --item-height: 2.75vh;
        --border-radius: 0.5vh;
        --font: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .menu-root {
        font-family: var(--font);
        color: var(--text-primary);
        position: fixed;
        width: 34vh;
        z-index: 1000;
        border-radius: 0.5vh;
    }

    .menu-root > :not(.menu-scrollbar):first-child {
        border-radius: 0.5vh 0.5vh 0 0;
        overflow: hidden;
    }

    .menu-banner {
        border-radius: 0.5vh 0.5vh 0 0;
        overflow: hidden;
    }

    .menu-tabs {
        overflow: hidden;
    }

    .menu-body {
        overflow: hidden;
    }

    .menu-footer {
        border-radius: 0 0 0.5vh 0.5vh;
        overflow: hidden;
    }

    .menu-banner {
        padding: 0;
        overflow: hidden;
    }

    .menu-banner img {
        width: 100%;
        height: 10vh;
        object-fit: cover;
        display: block;
        border-bottom: 0.1vh solid var(--color-mainSolid);
    }

    .menu-tabs {
        display: flex;
        background: var(--bg-deep);
        padding: 0.45vh 0.5vh;
        gap: 0.3vh;
        border-bottom: 0.05vh solid rgba(255,255,255,0.05);
    }

    .tab-item {
        flex: 1;
        padding: 0.55vh 0;
        font-size: 1.05vh;
        font-weight: 400;
        text-align: center;
        letter-spacing: 0.01em;
        border-radius: 0.3vh 0.3vh 0 0;
        color: var(--text-secondary);
        border: 0.08vh solid transparent;
        user-select: none;
    }

    .tab-item.active {
        color: var(--text-primary);
        font-weight: 500;
        background: var(--color-tab);
        border-color: var(--color-mainSolid);
    }

    .menu-scrollbar {
        position: absolute;
        left: -1.2vh;
        top: 13.7vh;
        width: 0.6vh;
        height: 39vh;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .scrollbar-track {
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 0.4vh;
        position: relative;
        transition: 0.5s;
    }

    .scrollbar-thumb {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background-color: var(--color-mainSolid);
        border-radius: 0.2vh;
        transition: top 0.25s ease-out, height 0.25s ease-out;
        min-height: 2vh;
    }

    .menu-body {
        background: var(--bg-panel);
        overflow: hidden;
    }

    .menu-items {
        position: relative;
        max-height: 38vh;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: none;
        padding-bottom: 0.5vh;
        padding-top: 0.5vh;
    }

    .menu-items::-webkit-scrollbar {
        display: none;
    }

    .selection-highlight {
        position: absolute;
        left: 0.35vh;
        right: 0.35vh;
        height: var(--item-height);
        border-radius: 0.4vh;
        background: rgba(255,255,255,0.07);
        border: 0.07vh solid rgba(255,255,255,0.11);
        z-index: 0;
        pointer-events: none;
        will-change: top;
        transform: translateZ(0);
    }

    .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 1.1vh;
        height: var(--item-height);
        box-sizing: border-box;
        position: relative;
        z-index: 1;
    }

    .item-label {
        display: flex;
        align-items: center;
        gap: 0.5vh;
        min-width: 0;
        flex: 1;
    }

    .menu-item .name {
        font-size: 1.12vh;
        color: var(--text-primary);
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .slider-val {
        color: var(--text-secondary);
        font-size: 1.0vh;
    }

    .components-container {
        display: flex;
        align-items: center;
        gap: 0.8vh;
        flex-shrink: 0;
    }

    .component {
        display: flex;
        align-items: center;
    }

    .caret-icon {
        font-size: 1.1vh;
        color: var(--text-secondary);
    }

    .toggle-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
    }

    .toggle-switch input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-track {
        display: block;
        width: 3.4vh;
        height: 1.5vh;
        background: #2a2a2a;
        border-radius: 1vh;
        position: relative;
        transition: background 0.22s ease;
        border: 0.07vh solid rgba(255,255,255,0.08);
    }

    .toggle-thumb {
        position: absolute;
        top: 50%;
        left: 0.18vh;
        transform: translateY(-50%);
        width: 1.05vh;
        height: 1.05vh;
        border-radius: 50%;
        background: #888;
        transition: left 0.22s ease, background 0.22s ease;
    }

    .toggle-switch input:checked ~ .toggle-track {
        background: var(--color-mainSolid);
        border-color: transparent;
    }

    .toggle-switch input:checked ~ .toggle-track .toggle-thumb {
        left: calc(100% - 1.18vh - 0.18vh);
        background: #fff;
    }

    .range-component {
        position: relative;
        width: 9vh;
        height: 1.6vh;
        display: flex;
        align-items: center;
    }

    .range-track {
        position: absolute;
        left: 0;
        width: 100%;
        height: 0.35vh;
        background: rgba(255,255,255,0.15);
        border-radius: 0.2vh;
        z-index: 1;
    }

    .range-fill {
        position: absolute;
        left: 0;
        height: 0.35vh;
        background: var(--color-mainSolid);
        border-radius: 0.2vh;
        z-index: 2;
        pointer-events: none;
    }

    .range-component input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        position: relative;
        width: 100%;
        height: 0.35vh;
        background: transparent;
        outline: none;
        margin: 0;
        padding: 0;
        cursor: pointer;
        z-index: 3;
    }

    .range-component input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 1.2vh;
        height: 1.2vh;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 0.1vh rgba(0,0,0,0.4);
        margin-top: -0.125vh;
        cursor: pointer;
    }

    .range-component input[type="range"]::-moz-range-thumb {
        width: 1.2vh;
        height: 1.2vh;
        border-radius: 50%;
        background: #fff;
        border: none;
        cursor: pointer;
    }

    .scroll-value span {
        background: rgba(255,255,255,0.09);
        border-radius: 0.3vh;
        padding: 0.15vh 0.6vh;
        color: rgba(255,255,255,0.82);
        font-size: 1.02vh;
        max-width: 13vh;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
    }

    .separator-container {
        display: flex;
        align-items: center;
        height: 2.75vh;
        padding: 0 1.4vh;
        gap: 0.9vh;
        box-sizing: border-box;
    }

    .separator-bar {
        flex: 1;
        height: 0.08vh;
        background: var(--color-mainSolid);
        border-radius: 0.2vh;
    }

    .separator-text {
        color: white;
        font-size: 0.9vh;
        font-weight: 600;
        white-space: nowrap;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .menu-footer {
        background-color: #0d0d0d;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5vh 1.1vh;
        font-size: 1.05vh;
        color: rgba(255, 255, 255, 0.4);
        border-top: 0.05vh solid rgba(255, 255, 255, 0.06);
        height: 2vh;
    }

    .footer-brand {
        font-size: 1.0vh;
        color: var(--text-secondary);
        font-weight: 400;
    }

    .footer-counter {
        font-size: 1.0vh;
        color: var(--text-secondary);
        font-weight: 400;
    }

    .dead-icon {
        font-size: 1.05vh;
        color: #ff4d4d;
        flex-shrink: 0;
    }

    .vehicle-icon {
        font-size: 1.05vh;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .meta-panel {
        font-family: var(--font);
        position: fixed;
        width: 20vh;
        background: var(--bg-panel);
        border: 0.07vh solid rgba(255, 255, 255, 0.08);
        border-radius: var(--border-radius);
        overflow: hidden;
        z-index: 999;
        transform-origin: top left;
    }

    .meta-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 2.75vh;
        padding: 0 1.1vh;
        background: var(--bg-deep);
        border-bottom: 0.1vh solid var(--color-mainSolid);
    }

    .meta-name {
        font-size: 1.12vh;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .meta-dead-tag {
        font-size: 0.9vh;
        font-weight: 600;
        color: #ff4d4d;
        letter-spacing: 0.06em;
        flex-shrink: 0;
    }

    .meta-body {
        display: flex;
        flex-direction: column;
        padding: 0.6vh 0;
    }

    .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.8vh;
        padding: 0.4vh 1.1vh;
    }

    .meta-key {
        font-size: 1.0vh;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .meta-val-wrap {
        display: flex;
        align-items: center;
        gap: 0.6vh;
        min-width: 0;
    }

    .meta-val {
        font-size: 1.02vh;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .meta-bar {
        width: 5vh;
        height: 0.5vh;
        border-radius: 0.3vh;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
        flex-shrink: 0;
    }

    .meta-bar-fill {
        height: 100%;
        border-radius: 0.3vh;
        transition: width 0.25s ease;
    }
</style>