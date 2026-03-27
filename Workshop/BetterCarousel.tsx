// Add inactive arrow navigation handling: when previous/next arrow can't be clicked, lower its opacity to 0.3
import * as React from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

export default function BetterCarousel(props) {
    const {
        slideFrames,
        gap,
        type,
        dragMode,
        motion,
        padding,
        snapFocus,
        parentOverflow,
        showArrows,
        arrowFill,
        arrowSize,
        arrowRadius,
        arrowGap,
        arrowPosition,
        arrowAlign,
        arrowOffsetX,
        arrowOffsetY,
        arrowIconPrev,
        arrowIconNext,
    } = props

    const splideRef = React.useRef(null)
    const [splideInstance, setSplideInstance] = React.useState(null)
    const splideInstanceRef = React.useRef(null)
    const [isDragging, setIsDragging] = React.useState(false)
    const [canGoPrev, setCanGoPrev] = React.useState(true)
    const [canGoNext, setCanGoNext] = React.useState(true)

    // Keep ref in sync with state
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

    React.useEffect(() => {
        if (
            typeof window !== "undefined" &&
            !document.querySelector('link[href*="splide.min.css"]')
        ) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href =
                "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css"
            document.head.appendChild(link)
        }

        const isSplideLoaded = typeof window !== "undefined" && window["Splide"]
        let script
        if (typeof window !== "undefined" && !isSplideLoaded) {
            script = document.createElement("script")
            script.src =
                "https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"
            document.body.appendChild(script)
            script.onload = () => {
                mountSplide()
            }
        } else if (typeof window !== "undefined" && isSplideLoaded) {
            mountSplide()
        }
    }, [])

    React.useEffect(() => {
        if (
            typeof window !== "undefined" &&
            window["Splide"] &&
            splideRef.current
        ) {
            mountSplide()
        }
    }, [
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

    const mountSplide = () => {
        if (
            typeof window === "undefined" ||
            !window["Splide"] ||
            !splideRef.current
        )
            return

        // Use ref to avoid stale closure when destroying previous instance
        try {
            splideInstanceRef.current?.destroy(true)
        } catch {}

        const speed = 300 + motion.speed * 100

        let focusValue = false
        if (dragMode === "snap" && (type === "loop" || type === "slide")) {
            focusValue = snapFocus === "center"
        }

        const containerWidth = splideRef.current.clientWidth
        const desiredSlideWidth = 200
        const calculatedPerPage = Math.floor(
            containerWidth / (desiredSlideWidth + gap)
        )
        const perPage = calculatedPerPage > 0 ? calculatedPerPage : 1

        // @ts-ignore
        const SplideClass = window["Splide"]
        const splideOptions = {
            type: type,
            drag: dragMode === "free" ? "free" : true,
            autoWidth: true,
            autoHeight: true,
            gap: gap + "px",
            speed: speed,
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
            // @ts-ignore
            splideOptions.perPage = perPage
        }
        const splide = new SplideClass(splideRef.current, splideOptions)

        splide.mount()
        splide.on("drag", () => setIsDragging(true))
        splide.on("dragged", () => setIsDragging(false))
        setSplideInstance(splide)
    }

    // Detect if the very last slide is fully visible — uses BoundingClientRect,
    // not scrollLeft (which is always 0 with Splide's CSS-transform approach)
    const isLastFullyVisible = React.useCallback(() => {
        try {
            const track = splideRef.current?.querySelector(".splide__track")
            const slides = splideRef.current?.querySelectorAll(".splide__slide")
            if (!track || !slides || !slides.length) return false
            const trackRect = track.getBoundingClientRect()
            const lastRect = slides[slides.length - 1].getBoundingClientRect()
            return lastRect.right <= trackRect.right + 1
        } catch (e) {
            return false
        }
    }, [])

    // Update arrow state using actual DOM geometry instead of scrollLeft
    const updateArrowState = React.useCallback(() => {
        if (!splideInstance) return
        const idx = splideInstance.index
        const isLoop = splideInstance.options.type === "loop"
        setCanGoPrev(isLoop || idx > 0)
        setCanGoNext(isLoop || !isLastFullyVisible())
    }, [splideInstance, isLastFullyVisible])

    React.useEffect(() => {
        if (!splideInstance) return
        updateArrowState()
        splideInstance.on("move", updateArrowState)
        splideInstance.on("moved", updateArrowState)
        splideInstance.on("mounted", updateArrowState)
        splideInstance.on("resized", updateArrowState)
        return () => {
            splideInstance.off("move", updateArrowState)
            splideInstance.off("moved", updateArrowState)
            splideInstance.off("mounted", updateArrowState)
            splideInstance.off("resized", updateArrowState)
        }
    }, [splideInstance, updateArrowState])

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
                    height: props.height || "100%",
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
                    {placeholderWidths.map((width, index) => (
                        <li
                            key={index}
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
        const isLoop = splideInstance.options.type === "loop"
        if (isLoop || splideInstance.index > 0) splideInstance.go("<")
    }

    const handleNext = () => {
        if (!splideInstance) return
        const isLoop = splideInstance.options.type === "loop"
        let end = 0
        try {
            end = splideInstance.Components.Controller.getEnd()
        } catch (e) {
            end = Math.max(0, splideInstance.length - (splideInstance.options.perPage || 1))
        }
        if (isLoop || splideInstance.index < end) splideInstance.go(">")
    }

    const ArrowButton = React.useMemo(() => {
        return function ArrowButton({ onClick, icon, style = {}, disabled }) {
            return (
                <button
                    onClick={disabled ? undefined : onClick}
                    disabled={disabled}
                    style={{
                        background: arrowFill,
                        border: "none",
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
                                width: "60%",
                                height: "60%",
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
    }, [arrowFill, arrowSize, arrowRadius])

    const getGroupPositionStyles = (align) => {
        const styles = {
            topLeft: { top: arrowOffsetY, left: arrowOffsetX, transform: "none" },
            topCenter: { top: arrowOffsetY, left: "50%", transform: "translateX(-50%)" },
            topRight: { top: arrowOffsetY, right: arrowOffsetX, transform: "none" },
            centerLeft: { top: "50%", left: arrowOffsetX, transform: "translateY(-50%)" },
            center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
            centerRight: { top: "50%", right: arrowOffsetX, transform: "translateY(-50%)" },
            bottomLeft: { bottom: arrowOffsetY, left: arrowOffsetX, transform: "none" },
            bottomCenter: { bottom: arrowOffsetY, left: "50%", transform: "translateX(-50%)" },
            bottomRight: { bottom: arrowOffsetY, right: arrowOffsetX, transform: "none" },
        }
        return styles[align] || styles["centerLeft"]
    }

    return (
        <Frame
            background="transparent"
            width={props.width}
            height={props.height || "auto"}
            {...props}
            style={{
                display: "block",
                position: "relative",
                WebkitOverflowScrolling: "touch",
                willChange: "transform",
                overflow: parentOverflow,
                boxSizing: "border-box",
                width: "100%",
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
                <>
                    <ArrowButton
                        onClick={handlePrev}
                        icon={arrowIconPrev}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: arrowOffsetX,
                            transform: "translateY(-50%)",
                        }}
                        disabled={!canGoPrev}
                    />
                    <ArrowButton
                        onClick={handleNext}
                        icon={arrowIconNext}
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: arrowOffsetX,
                            transform: "translateY(-50%)",
                        }}
                        disabled={!canGoNext}
                    />
                </>
            )}

            {showArrows && arrowPosition === "group" && (
                <div
                    style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "row",
                        gap: arrowGap,
                        ...getGroupPositionStyles(arrowAlign),
                    }}
                >
                    <ArrowButton
                        onClick={handlePrev}
                        icon={arrowIconPrev}
                        style={{}}
                        disabled={!canGoPrev}
                    />
                    <ArrowButton
                        onClick={handleNext}
                        icon={arrowIconNext}
                        style={{}}
                        disabled={!canGoNext}
                    />
                </div>
            )}
        </Frame>
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
    arrowFill: "#000",
    arrowSize: 32,
    arrowRadius: 16,
    arrowGap: 8,
    arrowPosition: "space",
    arrowAlign: "centerLeft",
    arrowOffsetX: 0,
    arrowOffsetY: 0,
}

addPropertyControls(BetterCarousel, {
    slideFrames: {
        type: ControlType.Array,
        title: "Content",
        propertyControl: { type: ControlType.ComponentInstance },
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
                (props.type === "loop" || props.type === "slide") &&
                props.dragMode === "snap"
            ),
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: { type: ControlType.Number, title: "Speed", min: 1, max: 5, step: 1, displayStepper: true },
            momentum: { type: ControlType.Number, title: "Momentum", min: 100, max: 1000, step: 50, displayStepper: true },
        },
    },
    padding: {
        type: ControlType.Object,
        title: "Padding",
        controls: {
            left: { type: ControlType.Number, title: "Left", min: 0, max: 200, step: 1 },
            right: { type: ControlType.Number, title: "Right", min: 0, max: 200, step: 1 },
        },
    },
    parentOverflow: {
        type: ControlType.SegmentedEnum,
        title: "Overflow",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },
    showArrows: { type: ControlType.Boolean, title: "Show Arrows" },
    arrowFill: { type: ControlType.Color, title: "Arrow Fill", hidden: (props) => !props.showArrows },
    arrowSize: { type: ControlType.Number, title: "Arrow Size", min: 16, max: 100, hidden: (props) => !props.showArrows },
    arrowRadius: { type: ControlType.Number, title: "Arrow Radius", min: 0, max: 100, hidden: (props) => !props.showArrows },
    arrowGap: { type: ControlType.Number, title: "Arrow Gap", min: 0, max: 100, hidden: (props) => !props.showArrows || props.arrowPosition !== "group" },
    arrowPosition: {
        type: ControlType.SegmentedEnum,
        title: "Arrow Layout",
        options: ["space", "group"],
        optionTitles: ["Split", "Group"],
        hidden: (props) => !props.showArrows,
    },
    arrowAlign: {
        type: ControlType.Enum,
        title: "Arrow Align",
        options: ["topLeft","topCenter","topRight","centerLeft","center","centerRight","bottomLeft","bottomCenter","bottomRight"],
        optionTitles: ["Top Left","Top Center","Top Right","Center Left","Center","Center Right","Bottom Left","Bottom Center","Bottom Right"],
        hidden: (props) => !props.showArrows || props.arrowPosition === "space",
    },
    arrowOffsetX: { type: ControlType.Number, title: "Offset X", step: 1, hidden: (props) => !props.showArrows },
    arrowOffsetY: { type: ControlType.Number, title: "Offset Y", step: 1, hidden: (props) => !props.showArrows },
    arrowIconPrev: { type: ControlType.Image, title: "Prev Icon", hidden: (props) => !props.showArrows },
    arrowIconNext: { type: ControlType.Image, title: "Next Icon", hidden: (props) => !props.showArrows },
})
