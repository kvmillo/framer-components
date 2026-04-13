// Framer Code Component — HubSpot Meetings Embed with Skeleton Loader

import { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

const PURPLE = "#3804E6"
const SHIMMER = `linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%)`
const SHIMMER_LIGHT = `linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%)`

const shimmerStyle = (dark: boolean): React.CSSProperties => ({
    background: dark ? SHIMMER : SHIMMER_LIGHT,
    backgroundSize: "200% 100%",
    animation: "skeletonShimmer 1.6s ease infinite",
})

function Block({ w = "100%", h = 14, r = 6, dark = false, style = {} }: {
    w?: string | number; h?: number; r?: number; dark?: boolean; style?: React.CSSProperties
}) {
    return (
        <div style={{
            width: w, height: h, borderRadius: r,
            ...shimmerStyle(dark),
            flexShrink: 0,
            ...style,
        }} />
    )
}

function MeetingsSkeleton() {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

    return (
        <div style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", borderRadius: 8 }}>
            {/* Left — purple calendar panel */}
            <div style={{
                width: "52%",
                background: PURPLE,
                padding: "32px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                boxSizing: "border-box",
            }}>
                {/* Avatar */}
                <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    ...shimmerStyle(true),
                }} />

                {/* Title */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", alignItems: "center" }}>
                    <Block w="80%" h={14} r={6} dark />
                    <Block w="60%" h={14} r={6} dark />
                </div>

                {/* Month nav */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <Block w={20} h={20} r={4} dark />
                    <Block w="45%" h={18} r={6} dark />
                    <Block w={20} h={20} r={4} dark />
                </div>

                {/* Day labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, width: "100%" }}>
                    {days.map((d) => (
                        <div key={d} style={{
                            height: 12, borderRadius: 4,
                            background: "rgba(255,255,255,0.25)",
                        }} />
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, width: "100%" }}>
                    {Array.from({ length: 35 }).map((_, i) => {
                        const col = i % 7
                        const isEmpty = col === 0 || col === 6 || i < 3 || i > 30
                        return (
                            <div key={i} style={{
                                height: 30,
                                borderRadius: 50,
                                background: isEmpty ? "transparent" : "rgba(255,255,255,0.15)",
                                ...(isEmpty ? {} : shimmerStyle(true)),
                            }} />
                        )
                    })}
                </div>
            </div>

            {/* Right — white time panel */}
            <div style={{
                flex: 1,
                background: "#fff",
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                boxSizing: "border-box",
            }}>
                {/* Meeting location */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Block w="55%" h={14} r={5} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Block w={14} h={14} r={3} />
                        <Block w="30%" h={12} r={5} />
                    </div>
                </div>

                {/* Meeting duration */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Block w="55%" h={14} r={5} />
                    <Block w="100%" h={40} r={8} />
                </div>

                {/* Time slots */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Block w="65%" h={14} r={5} />
                    <Block w="50%" h={12} r={5} />
                    <div style={{ height: 8 }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Block key={i} w="100%" h={44} r={8} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function HubSpotMeetings(props) {
    const { meetingUrl, height } = props
    const [loaded, setLoaded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!meetingUrl) return

        let email = ""
        try {
            email = localStorage.getItem("ajax_last_email") || sessionStorage.getItem("ajax_last_email") || ""
        } catch (e) {}

        let finalUrl = meetingUrl
        try {
            const u = new URL(meetingUrl)
            if (email && !u.searchParams.get("email")) u.searchParams.set("email", email)
            finalUrl = u.toString()
        } catch (e) {}

        if (containerRef.current) {
            containerRef.current.setAttribute("data-src", finalUrl)
        }

        if (!document.querySelector('script[src*="MeetingsEmbedCode"]')) {
            const script = document.createElement("script")
            script.src = "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"
            script.type = "text/javascript"
            script.async = true
            document.body.appendChild(script)
        }

        // Watch for iframe and add extra delay after load event
        // so HubSpot has time to render content inside the iframe
        const observer = new MutationObserver(() => {
            const iframe = containerRef.current?.querySelector("iframe")
            if (iframe) {
                observer.disconnect()
                const onLoad = () => {
                    // Wait 1.2s after iframe load before fading skeleton
                    setTimeout(() => setLoaded(true), 1200)
                }
                iframe.addEventListener("load", onLoad)
                if ((iframe as any).complete) onLoad()
            }
        })

        if (containerRef.current) {
            observer.observe(containerRef.current, { childList: true, subtree: true })
        }

        // Hard fallback at 15s
        const fallback = setTimeout(() => setLoaded(true), 15000)

        return () => {
            observer.disconnect()
            clearTimeout(fallback)
        }
    }, [meetingUrl])

    return (
        <div style={{ width: "100%", height, position: "relative", overflow: "hidden" }}>
            <style>{`
                @keyframes skeletonShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .meetings-iframe-container iframe {
                    width: 100% !important;
                    max-width: 100% !important;
                    min-width: 100% !important;
                }
            `}</style>

            {/* Skeleton */}
            <div style={{
                position: "absolute",
                inset: 0,
                opacity: loaded ? 0 : 1,
                transition: "opacity 0.6s ease",
                pointerEvents: loaded ? "none" : "auto",
                zIndex: 1,
            }}>
                <MeetingsSkeleton />
            </div>

            {/* HubSpot embed */}
            <div style={{
                width: "100%",
                height: "calc(100% + 40px)",
                marginTop: -40,
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.6s ease",
            }}>
                <div
                    ref={containerRef}
                    className="meetings-iframe-container"
                    data-src={meetingUrl}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        </div>
    )
}

HubSpotMeetings.displayName = "HubSpot Meetings"

addPropertyControls(HubSpotMeetings, {
    meetingUrl: {
        type: ControlType.String,
        title: "Meeting URL",
        defaultValue: "https://meetings.hubspot.com/jack-ajax/ajax-demo-call-round-robin-website?embed=true",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 700,
        min: 400,
        max: 1200,
        step: 10,
    },
})
