import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// Splide is loaded via CDN — use `any` for its instance type
type SplideInstance = any

type AlignKey =
    | "topLeft"
    | "topCenter"
    | "topRight"
    | "centerLeft"
    | "center"
    | "centerRight"
    | "bottomLeft"
    | "bottomCenter"
    | "bottomRight"

interface NavigationArrows {
    arrowFill?: string
    arrowSize?: number
    arrowRadius?: number
    arrowBorderColor?: string
    arrowBorderWidth?: number
    arrowBorderStyle?: string
    iconSize?: number
    arrowGap?: number
    arrowPosition?: string
    arrowAlign?: AlignKey
    arrowOffsetX?: number
    arrowOffsetY?: number
    arrowIconPrev?: string
    arrowIconNext?: string
}

interface ProgressIndicatorOptions {
    show?: boolean
    stepSize?: number
    stepRadius?: number
    stepGap?: number
    position?: AlignKey
    offsetX?: number
    offsetY?: number
    activeColor?: string
    inactiveColor?: string
}

interface CarouselProps {
    slideFrames?: React.ReactNode[]
    gap?: number
    type?: string
    dragMode?: string
    motion?: { speed: number; momentum: number }
    padding?: { left: number; right: number }
    snapFocus?: string
    parentOverflow?: string
    showArrows?: boolean
    navigationArrows?: NavigationArrows
    progressIndicator?: ProgressIndicatorOptions
    wheelScrollEnabled?: boolean
    width?: number | string
    height?: number | string
    [key: string]: unknown
}

interface ArrowButtonProps {
    onClick: () => void
    icon?: string
    style?: React.CSSProperties
    disabled?: boolean
}

export default function BetterCarousel(props: CarouselProps) {
    const {
        slideFrames,
        gap = 16,
        type = "loop",
        dragMode = "free",
        motion = { speed: 3, momentum: 600 },
        padding = { left: 0, right: 0 },
        snapFocus = "center",
        parentOverflow = "hidden",
        showArrows = false,
        navigationArrows = {},
        progressIndicator = {},
        wheelScrollEnabled = true,
    } = props

    const {
        arrowFill,
        arrowSize,
        arrowRadius,
        arrowBorderColor,
        arrowBorderWidth,
        arrowBorderStyle,
        iconSize,
        arrowGap,
        arrowPosition,
        arrowAlign,
        arrowOffsetX,
        arrowOffsetY,
        arrowIconPrev,
        arrowIconNext,
    } = navigationArrows

    const splideRef = React.useRef<HTMLDivElement>(null)
    const [splideInstance, setSplideInstance] =
        React.useState<SplideInstance>(null)
    const splideInstanceRef = React.useRef<SplideInstance>(null)
    const [isDragging, setIsDragging] = React.useState(false)
    const [canGoPrev, setCanGoPrev] = React.useState(true)
    const [canGoNext, setCanGoNext] = React.useState(true)
    const [progressState, setProgressState] = React.useState({
        step: 0,
        steps: 1,
    })

    // Keep ref in sync with state so effects/handlers always have latest instance
    React.useEffect(() => {
        splideInstanceRef.current = splideInstance
    }, [splideInstance])

    // Destroy Splide on unmount
    React.useEffect(() => {
        return () => {
            try {
                splideInstanceRef.current?.destroy(true)
            } catch {}
        }
    }, [])

    // Load Splide CSS + JS from CDN
    React.useEffect(() => {
        const win = window as any
        if (!document.querySelector('link[href*="splide.min.css"]')) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href =
                "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css"
            document.head.appendChild(link)
        }

        if (!win.Splide) {
            const script = document.createElement("script")
            script.src =
                "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"
            document.body.appendChild(script)
            script.onload = () => mountSplide()
        } else {
            mountSplide()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-mount Splide when key options change
    React.useEffect(() => {
        const win = window as any
        if (win.Splide && splideRef.current) mountSplide()
    }, [ // eslint-disable-line react-hooks/exhaustive-deps
        slideFrames,
        gap,
        type,
        dragMode,
        motion.speed,
        motion.momentum,
        padding.left,
        padding.right,
        snapFocus,
        parentOverflow,
    ])

    // Trackpad / wheel scroll:
    // • Moves the track in real-time via Move.translate() for a free-drag feel
    // • In non-loop mode, overscrolling past the boundary applies rubber-band resistance
    //   (iOS-style: the further you pull, the less it moves) instead of hard-clamping
    // • After 150 ms of no wheel events, springs back to the boundary (if overscrolled)
    //   with an easeOutBack animation, then snaps to the nearest slide
    React.useEffect(() => {
        const el = splideRef.current
        if (!el) return

        let wheelEndTimer: ReturnType<typeof setTimeout> | null = null
        let springRafId: number | null = null

        const cancelSpring = () => {
            if (springRafId !== null) {
                cancelAnimationFrame(springRafId)
                springRafId = null
            }
        }

        // Spring physics simulation — runs per-frame so the bounce feels physical.
        // stiffness controls how fast it snaps back; damping controls how quickly
        // it settles. Slightly underdamped (damping < 2*sqrt(stiffness)) gives a
        // subtle overshoot that reads as natural motion.
        const animateSpringBack = (startPos: number, targetPos: number) => {
            cancelSpring()
            let pos = startPos
            let velocity = 0
            const stiffness = 500
            const damping = 35
            let lastTime = performance.now()

            const frame = (now: number) => {
                // Cap dt so a tab switch or long frame doesn't cause a huge jump
                const dt = Math.min((now - lastTime) / 1000, 0.064)
                lastTime = now

                const displacement = pos - targetPos
                velocity += (-stiffness * displacement - damping * velocity) * dt
                pos += velocity * dt

                const s: SplideInstance = splideInstanceRef.current
                if (!s) return
                const M = s.Components?.Move
                if (!M) return

                M.translate(pos)

                // Settle once motion is negligible
                if (Math.abs(displacement) < 0.5 && Math.abs(velocity) < 5) {
                    springRafId = null
                    M.translate(targetPos)
                    // Restore transition so Splide can animate the final snap
                    const listEl = el?.querySelector(".splide__list") as HTMLElement | null
                    if (listEl) listEl.style.transition = ""
                    let closestIndex = 0
                    let closestDist = Infinity
                    for (let i = 0; i < s.length; i++) {
                        const dist = Math.abs(targetPos - M.toPosition(i, true))
                        if (dist < closestDist) {
                            closestDist = dist
                            closestIndex = i
                        }
                    }
                    s.Components.Controller.go(closestIndex, true)
                } else {
                    springRafId = requestAnimationFrame(frame)
                }
            }

            springRafId = requestAnimationFrame(frame)
        }

        const handleWheel = (e: WheelEvent) => {
            if (!wheelScrollEnabled) return

            const dx = e.deltaX
            const dy = e.deltaY

            // Only handle predominantly horizontal scrolls
            if (Math.abs(dx) <= Math.abs(dy)) return

            e.preventDefault()

            // Cancel any ongoing spring-back so next getPosition() is accurate
            cancelSpring()

            const splide: SplideInstance = splideInstanceRef.current
            if (!splide) return

            const Move = splide.Components?.Move
            if (!Move) return

            // Read mid-animation position via DOMMatrix so we get the live visual
            // position even if a CSS snap transition is still running, then clear
            // the transition so subsequent translate() calls are instant.
            const list = el.querySelector('.splide__list') as HTMLElement | null
            let currentPos: number = Move.getPosition()
            if (list) {
                const transformStr = getComputedStyle(list).transform
                if (transformStr && transformStr !== 'none') {
                    currentPos = new DOMMatrix(transformStr).m41
                }
                list.style.transition = 'none'
            }
            const newPos = currentPos - dx

            const isLoop: boolean = splide.options?.type === "loop"
            if (!isLoop) {
                const pos0: number = Move.toPosition(0, true)
                const posLast: number = Move.toPosition(splide.length - 1, true)
                const lo = Math.min(pos0, posLast)
                const hi = Math.max(pos0, posLast)

                let translatedPos: number
                if (newPos < lo) {
                    // Past start — rubber band: resistance grows with excess distance
                    const excess = lo - newPos
                    translatedPos = lo - excess / (1 + excess / 80)
                } else if (newPos > hi) {
                    // Past end — rubber band
                    const excess = newPos - hi
                    translatedPos = hi + excess / (1 + excess / 80)
                } else {
                    translatedPos = newPos
                }
                Move.translate(translatedPos)
            } else {
                Move.translate(newPos)
            }

            // Debounce: after scrolling stops, spring back (if overscrolled) or snap
            if (wheelEndTimer !== null) clearTimeout(wheelEndTimer)
            wheelEndTimer = setTimeout(() => {
                wheelEndTimer = null
                const s: SplideInstance = splideInstanceRef.current
                if (!s) return
                const M = s.Components?.Move
                if (!M) return

                const pos: number = M.getPosition()
                const isLoopMode: boolean = s.options?.type === "loop"

                if (!isLoopMode) {
                    const p0: number = M.toPosition(0, true)
                    const pLast: number = M.toPosition(s.length - 1, true)
                    const lo = Math.min(p0, pLast)
                    const hi = Math.max(p0, pLast)

                    if (pos < lo || pos > hi) {
                        // Overscrolled — spring back to boundary then snap
                        animateSpringBack(pos, pos < lo ? lo : hi)
                        return
                    }
                }

                // Restore transition so Splide can animate the snap
                if (list) list.style.transition = ""

                // Normal snap to nearest slide
                let closestIndex = 0
                let closestDist = Infinity
                for (let i = 0; i < s.length; i++) {
                    const targetPos: number = M.toPosition(i, true)
                    const dist = Math.abs(pos - targetPos)
                    if (dist < closestDist) {
                        closestDist = dist
                        closestIndex = i
                    }
                }
                // allowSameIndex=true ensures snap fires even when index didn't change
                s.Components.Controller.go(closestIndex, true)
            }, 150)
        }

        el.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            el.removeEventListener("wheel", handleWheel)
            if (wheelEndTimer !== null) clearTimeout(wheelEndTimer)
            cancelSpring()
        }
    }, [wheelScrollEnabled, splideInstance])

    const isLastFullyVisible = React.useCallback((): boolean => {
        try {
            const track = splideRef.current?.querySelector(".splide__track")
            const slides =
                splideRef.current?.querySelectorAll(".splide__slide")
            if (!track || !slides?.length) return false

            const trackRect = track.getBoundingClientRect()
            const lastRect =
                slides[slides.length - 1].getBoundingClientRect()

            let rightPad = 0
            const padOpt = splideInstanceRef.current?.options?.padding
            if (padOpt && typeof padOpt === "object") {
                const val = (padOpt as Record<string, unknown>).right
                if (typeof val === "number") {
                    rightPad = val
                } else if (typeof val === "string" && val.endsWith("px")) {
                    rightPad = parseInt(val, 10) || 0
                }
            }

            return lastRect.right <= trackRect.right - rightPad + 1
        } catch {
            return false
        }
    }, [])

    const mountSplide = () => {
        const win = window as any
        if (!win.Splide || !splideRef.current) return

        try {
            splideInstanceRef.current?.destroy(true)
        } catch {}

        const speed = 300 + motion.speed * 100

        let focusValue: boolean | string = false
        if (dragMode === "snap" && (type === "loop" || type === "slide")) {
            focusValue = snapFocus === "center"
        }

        const containerWidth = splideRef.current.clientWidth
        const calculatedPerPage = Math.floor(containerWidth / (200 + gap))
        const perPage = calculatedPerPage > 0 ? calculatedPerPage : 1

        const splideOptions: Record<string, unknown> = {
            type,
            drag: dragMode === "free" ? "free" : true,
            autoWidth: true,
            autoHeight: true,
            gap: gap + "px",
            speed,
            pagination: false,
            arrows: false,
            focus: focusValue,
            flickPower: motion.momentum,
            flickVelocityThreshold: 0.2,
            flickMaxPages: 1,
            padding:
                type === "slide"
                    ? {
                          left: padding.left + "px",
                          right: padding.right + "px",
                      }
                    : 0,
            perMove: 1,
        }

        if (!splideOptions.autoWidth) {
            splideOptions.perPage = perPage
        }

        const splide: SplideInstance = new win.Splide(
            splideRef.current,
            splideOptions
        )
        splide.mount()
        splide.on("drag", () => setIsDragging(true))
        splide.on("dragged", () => setIsDragging(false))
        setSplideInstance(splide)
    }

    const recomputeProgress = React.useCallback(() => {
        if (!splideInstance) return

        let end = 0
        try {
            end = splideInstance.Components.Controller.getEnd()
        } catch {
            const perPage: number = splideInstance.options.perPage || 1
            end = Math.max(0, splideInstance.length - perPage)
        }

        const atEndByView = isLastFullyVisible()

        // In free drag mode derive the active index from visual position so
        // dots update continuously while dragging, not only on release.
        let idx: number = splideInstance.index
        const isFree = splideInstance.options.drag === "free"
        if (isFree) {
            const M = splideInstance.Components?.Move
            if (M) {
                const pos = M.getPosition()
                let closestDist = Infinity
                for (let i = 0; i < splideInstance.length; i++) {
                    const dist = Math.abs(pos - M.toPosition(i, true))
                    if (dist < closestDist) { closestDist = dist; idx = i }
                }
            }
        }

        const step = atEndByView ? end : Math.min(idx, end)
        setProgressState({ step, steps: end + 1 })
    }, [splideInstance, isLastFullyVisible])

    const updateArrowState = React.useCallback(() => {
        if (!splideInstance) return

        const isLoop: boolean = splideInstance.options.type === "loop"

        let end = 0
        try {
            end = splideInstance.Components.Controller.getEnd()
        } catch {
            const perPage: number = splideInstance.options.perPage || 1
            end = Math.max(0, splideInstance.length - perPage)
        }

        const idx: number = splideInstance.index
        const atEndByIndex = idx >= end
        const atEndByView = isLastFullyVisible()

        setCanGoPrev(isLoop || idx > 0)
        setCanGoNext(isLoop || !(atEndByIndex || atEndByView))

        const step = atEndByIndex || atEndByView ? end : Math.min(idx, end)
        const steps = end + 1
        setProgressState((p) =>
            p.step === step && p.steps === steps ? p : { step, steps }
        )
    }, [splideInstance, isLastFullyVisible])

    // Wire Splide events — single effect to avoid duplicate listeners
    React.useEffect(() => {
        if (!splideInstance) return
        updateArrowState()
        recomputeProgress()

        // Full update: arrow state + progress (includes getBoundingClientRect)
        const cb = () => {
            updateArrowState()
            recomputeProgress()
        }

        // Cheap scroll callback — position math only, no DOM reads.
        // Used for the high-frequency scroll event during free drag so we
        // don't trigger forced reflows on every animation frame.
        const scrollCb = () => {
            const isFree = splideInstance.options.drag === "free"
            if (!isFree) return
            const M = splideInstance.Components?.Move
            if (!M) return
            let end = 0
            try { end = splideInstance.Components.Controller.getEnd() } catch {}
            const pos = M.getPosition()
            let idx = 0, closestDist = Infinity
            for (let i = 0; i < splideInstance.length; i++) {
                const dist = Math.abs(pos - M.toPosition(i, true))
                if (dist < closestDist) { closestDist = dist; idx = i }
            }
            const step = Math.min(idx, end)
            setProgressState(p =>
                p.step === step && p.steps === end + 1 ? p : { step, steps: end + 1 }
            )
        }

        splideInstance.on("mounted", cb)
        splideInstance.on("move", cb)
        splideInstance.on("moved", cb)
        splideInstance.on("scroll", scrollCb)
        splideInstance.on("resized", cb)
        splideInstance.on("updated", cb)

        return () => {
            splideInstance.off("mounted", cb)
            splideInstance.off("move", cb)
            splideInstance.off("moved", cb)
            splideInstance.off("scroll", scrollCb)
            splideInstance.off("resized", cb)
            splideInstance.off("updated", cb)
        }
    }, [splideInstance, updateArrowState, recomputeProgress])

    const slideItems = (slideFrames || []).map((frame, index) => (
        <li
            className="splide__slide"
            key={index}
            style={{
                display: "inline-block",
                overflow: "visible",
                pointerEvents: isDragging ? "none" : "auto",
            }}
        >
            {frame}
        </li>
    ))

    const renderPlaceholder = () => {
        const placeholderWidths = [80, 100, 185, 90, 110]
        return (
            <div
                style={{
                    width: "100%",
                    height: (props.height as number) || "100%",
                    backgroundColor: "#8658d833",
                    border: "1px solid #8658D8",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "16px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                <ul
                    style={{
                        width: "100%",
                        flexGrow: 1,
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: `${gap}px`,
                    }}
                >
                    {placeholderWidths.map((width, i) => (
                        <li
                            key={i}
                            style={{
                                width: `${width}px`,
                                height: "185px",
                                backgroundColor: "#8658D8AA",
                                borderRadius: 8,
                                flexShrink: 0,
                            }}
                        />
                    ))}
                </ul>
            </div>
        )
    }

    const handlePrev = () => {
        if (!splideInstance) return
        const isLoop: boolean = splideInstance.options.type === "loop"
        if (isLoop || splideInstance.index > 0) splideInstance.go("<")
    }

    const handleNext = () => {
        if (!splideInstance) return
        const isLoop: boolean = splideInstance.options.type === "loop"

        let end = 0
        try {
            end = splideInstance.Components.Controller.getEnd()
        } catch {
            const perPage: number = splideInstance.options.perPage || 1
            end = Math.max(0, splideInstance.length - perPage)
        }

        if (isLoop || splideInstance.index < end) splideInstance.go(">")
    }

    const ArrowButton = React.useMemo(() => {
        return function ArrowBtn({
            onClick,
            icon,
            style = {},
            disabled,
        }: ArrowButtonProps) {
            return (
                <button
                    onClick={disabled ? undefined : onClick}
                    disabled={disabled}
                    style={{
                        background: arrowFill,
                        borderColor: arrowBorderColor,
                        borderWidth: arrowBorderWidth,
                        borderStyle: arrowBorderStyle,
                        width: arrowSize,
                        height: arrowSize,
                        borderRadius: arrowRadius,
                        cursor: disabled ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        opacity: disabled ? 0.3 : 1,
                        transition: "opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
                        willChange: "opacity",
                        pointerEvents: disabled ? "none" : "auto",
                        ...style,
                    }}
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled}
                >
                    {icon ? (
                        <img
                            src={icon}
                            style={{
                                width: iconSize,
                                height: iconSize,
                                objectFit: "contain",
                                opacity: disabled ? 0.3 : 1,
                                transition:
                                    "opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
                                willChange: "opacity",
                                pointerEvents: "none",
                            }}
                            draggable={false}
                            alt=""
                        />
                    ) : null}
                </button>
            )
        }
    }, [
        arrowFill,
        arrowSize,
        arrowRadius,
        arrowBorderColor,
        arrowBorderWidth,
        arrowBorderStyle,
        iconSize,
    ])

    const getGroupPositionStyles = (
        align: AlignKey,
        offsetX = 0,
        offsetY = 0
    ): React.CSSProperties => {
        const styles: Record<AlignKey, React.CSSProperties> = {
            topLeft: { top: offsetY, left: offsetX },
            topCenter: {
                top: offsetY,
                left: "50%",
                transform: "translateX(-50%)",
            },
            topRight: { top: offsetY, right: offsetX },
            centerLeft: {
                top: "50%",
                left: offsetX,
                transform: "translateY(-50%)",
            },
            center: {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            },
            centerRight: {
                top: "50%",
                right: offsetX,
                transform: "translateY(-50%)",
            },
            bottomLeft: { bottom: offsetY, left: offsetX },
            bottomCenter: {
                bottom: offsetY,
                left: "50%",
                transform: "translateX(-50%)",
            },
            bottomRight: { bottom: offsetY, right: offsetX },
        }
        return styles[align] ?? styles.centerLeft
    }

    return (
        <div
            style={{
                display: "block",
                position: "relative",
                overflow: parentOverflow,
                boxSizing: "border-box",
                width: "100%",
                height: "auto",
                touchAction: "pan-y",
            }}
        >
            {slideFrames && slideFrames.length > 0 ? (
                <div
                    className="splide"
                    ref={splideRef}
                    style={{
                        width: "100%",
                        height: "auto",
                        cursor: isDragging ? "grabbing" : "grab",
                        overflow: "visible",
                        touchAction: "pan-y",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    <div
                        className="splide__track"
                        style={{ overflow: "visible" }}
                    >
                        <ul
                            className="splide__list"
                            style={{
                                overflow: "visible",
                                pointerEvents: isDragging ? "none" : "auto",
                            }}
                        >
                            {slideItems}
                        </ul>
                    </div>
                </div>
            ) : (
                renderPlaceholder()
            )}

            {showArrows && arrowPosition === "space" && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingLeft: arrowOffsetX,
                        paddingRight: arrowOffsetX,
                        gap: arrowGap,
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                    }}
                >
                    <ArrowButton
                        onClick={handlePrev}
                        icon={arrowIconPrev}
                        disabled={!canGoPrev}
                        style={{ pointerEvents: "auto" }}
                    />
                    <ArrowButton
                        onClick={handleNext}
                        icon={arrowIconNext}
                        disabled={!canGoNext}
                        style={{ pointerEvents: "auto" }}
                    />
                </div>
            )}

            {showArrows && arrowPosition === "group" && (
                <div
                    style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "row",
                        gap: arrowGap,
                        ...getGroupPositionStyles(
                            arrowAlign ?? "centerLeft",
                            arrowOffsetX,
                            arrowOffsetY
                        ),
                    }}
                >
                    <ArrowButton
                        onClick={handlePrev}
                        icon={arrowIconPrev}
                        disabled={!canGoPrev}
                    />
                    <ArrowButton
                        onClick={handleNext}
                        icon={arrowIconNext}
                        disabled={!canGoNext}
                    />
                </div>
            )}

            {progressIndicator?.show && progressState && (
                <div
                    style={{
                        position: "absolute",
                        display: "flex",
                        gap: progressIndicator.stepGap,
                        ...getGroupPositionStyles(
                            progressIndicator.position ?? "bottomCenter",
                            progressIndicator.offsetX ?? 0,
                            progressIndicator.offsetY ?? 0
                        ),
                    }}
                >
                    {Array.from({
                        length: Math.max(1, progressState.steps),
                    }).map((_, i) => (
                        <div
                            key={i}
                            onClick={() => splideInstance?.go(i)}
                            style={{
                                width:
                                    i === progressState.step
                                        ? (progressIndicator.stepSize ?? 8) * 2
                                        : progressIndicator.stepSize,
                                height: progressIndicator.stepSize,
                                borderRadius: progressIndicator.stepRadius,
                                backgroundColor:
                                    i === progressState.step
                                        ? progressIndicator.activeColor
                                        : progressIndicator.inactiveColor,
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

BetterCarousel.defaultProps = {
    slideFrames: [],
    gap: 16,
    type: "loop",
    dragMode: "free",
    snapFocus: "center",
    motion: { speed: 3, momentum: 600 },
    padding: { left: 0, right: 0 },
    parentOverflow: "hidden",
    showArrows: false,
    wheelScrollEnabled: true,
    // Cast as typed interfaces so TypeScript sees AlignKey correctly
    navigationArrows: {
        arrowFill: "#000",
        arrowSize: 32,
        arrowRadius: 16,
        iconSize: 24,
        arrowGap: 8,
        arrowPosition: "space",
        arrowAlign: "centerLeft",
        arrowOffsetX: 0,
        arrowOffsetY: 0,
        arrowIconPrev: "",
        arrowIconNext: "",
        arrowBorderColor: "#000",
        arrowBorderWidth: 1,
        arrowBorderStyle: "solid",
    } as NavigationArrows,
    progressIndicator: {
        show: false,
        stepSize: 8,
        stepRadius: 4,
        stepGap: 6,
        position: "bottomCenter",
        offsetX: 0,
        offsetY: 0,
        activeColor: "#8658D8",
        inactiveColor: "#DADADA",
    } as ProgressIndicatorOptions,
}

addPropertyControls(BetterCarousel, {
    slideFrames: {
        type: ControlType.Array,
        title: "Content",
        control: { type: ControlType.ComponentInstance },
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    type: {
        type: ControlType.SegmentedEnum,
        title: "Type",
        options: ["slide", "loop"],
        optionTitles: ["Slider", "Infinity"],
    },
    dragMode: {
        type: ControlType.SegmentedEnum,
        title: "Drag",
        options: ["snap", "free"],
        optionTitles: ["Snap", "Free"],
    },
    snapFocus: {
        type: ControlType.SegmentedEnum,
        title: "Snap Focus",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        hidden: (props) =>
            !(
                ["loop", "slide"].includes(props.type as string) &&
                props.dragMode === "snap"
            ),
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 1,
                max: 5,
                step: 1,
                displayStepper: true,
            },
            momentum: {
                type: ControlType.Number,
                title: "Momentum",
                min: 100,
                max: 1000,
                step: 50,
                displayStepper: true,
            },
        },
    },
    padding: {
        type: ControlType.Object,
        title: "Padding",
        controls: {
            left: { type: ControlType.Number, title: "Left", min: 0, max: 200 },
            right: {
                type: ControlType.Number,
                title: "Right",
                min: 0,
                max: 200,
            },
        },
    },
    parentOverflow: {
        type: ControlType.SegmentedEnum,
        title: "Overflow",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },
    wheelScrollEnabled: {
        type: ControlType.Boolean,
        title: "Trackpad Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
    },
    navigationArrows: {
        type: ControlType.Object,
        title: "Arrows",
        hidden: (props) => !props.showArrows,
        controls: {
            arrowFill: { type: ControlType.Color, title: "Fill" },
            arrowSize: { type: ControlType.Number, title: "Size", min: 16, max: 100 },
            arrowRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 100 },
            iconSize: { type: ControlType.Number, title: "Icon Size", min: 8, max: 100 },
            arrowPosition: {
                type: ControlType.SegmentedEnum,
                title: "Layout",
                options: ["space", "group"],
                optionTitles: ["Split", "Group"],
            },
            arrowGap: { type: ControlType.Number, title: "Gap", min: 0, max: 100, defaultValue: 8 },
            arrowAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["topLeft","topCenter","topRight","centerLeft","center","centerRight","bottomLeft","bottomCenter","bottomRight"],
                optionTitles: ["Top Left","Top Center","Top Right","Center Left","Center","Center Right","Bottom Left","Bottom Center","Bottom Right"],
                hidden: (props) => props.navigationArrows?.arrowPosition === "space",
            },
            arrowOffsetX: { type: ControlType.Number, title: "Offset X", step: 1, min: -500, max: 500 },
            arrowOffsetY: { type: ControlType.Number, title: "Offset Y", step: 1, min: -500, max: 500 },
            arrowIconPrev: { type: ControlType.Image, title: "Prev Icon" },
            arrowIconNext: { type: ControlType.Image, title: "Next Icon" },
            arrowBorderColor: { type: ControlType.Color, title: "Border Color" },
            arrowBorderWidth: { type: ControlType.Number, title: "Border Width", min: 0, max: 10, step: 1 },
            arrowBorderStyle: {
                type: ControlType.Enum,
                title: "Border Style",
                options: ["solid","dashed","dotted","double","groove","ridge","none"],
                optionTitles: ["Solid","Dashed","Dotted","Double","Groove","Ridge","None"],
            },
        },
    },
    progressIndicator: {
        type: ControlType.Object,
        title: "Progress",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: false },
            stepSize: { type: ControlType.Number, title: "Size", defaultValue: 8, min: 2, max: 100 },
            stepRadius: { type: ControlType.Number, title: "Radius", defaultValue: 4, min: 0, max: 50 },
            stepGap: { type: ControlType.Number, title: "Gap", defaultValue: 6, min: 0, max: 100 },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["topLeft","topCenter","topRight","centerLeft","center","centerRight","bottomLeft","bottomCenter","bottomRight"],
                optionTitles: ["Top Left","Top Center","Top Right","Center Left","Center","Center Right","Bottom Left","Bottom Center","Bottom Right"],
            },
            offsetX: { type: ControlType.Number, title: "Offset X", min: -500, max: 500, step: 1, defaultValue: 0 },
            offsetY: { type: ControlType.Number, title: "Offset Y", min: -500, max: 500, step: 1, defaultValue: 0 },
            activeColor: { type: ControlType.Color, title: "Active Color", defaultValue: "#8658D8" },
            inactiveColor: { type: ControlType.Color, title: "Inactive Color", defaultValue: "#DADADA" },
        },
    },
})
