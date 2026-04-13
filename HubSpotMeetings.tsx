// Framer Code Component — HubSpot Meetings Embed with Skeleton Loader
// Reads ajax_last_email from localStorage/sessionStorage to prefill email

import { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

const SKELETON_COLOR = "rgba(0,0,0,0.07)"
const SKELETON_SHINE = "rgba(0,0,0,0.04)"

function SkeletonBlock({ width = "100%", height = 16, radius = 6, style = {} }: {
    width?: string | number
    height?: number
    radius?: number
    style?: React.CSSProperties
}) {
    return (
        <div style={{
            width,
            height,
            borderRadius: radius,
            background: `linear-gradient(90deg, ${SKELETON_COLOR} 25%, ${SKELETON_SHINE} 50%, ${SKELETON_COLOR} 75%)`,
            backgroundSize: "200% 100%",
            animation: "skeletonShimmer 1.4s ease infinite",
            flexShrink: 0,
            ...style,
        }} />
    )
}

function MeetingsSkeleton() {
    return (
        <div style={{
            width: "100%",
            height: "100%",
            padding: "32px 24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 24,
        }}>
            {/* Host info */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: SKELETON_COLOR,
                    animation: "skeletonShimmer 1.4s ease infinite",
                    backgroundSize: "200% 100%",
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <SkeletonBlock width="40%" height={14} />
                    <SkeletonBlock width="60%" height={12} />
                </div>
            </div>

            {/* Meeting title + duration */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SkeletonBlock width="70%" height={20} radius={6} />
                <SkeletonBlock width="30%" height={13} radius={6} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: SKELETON_COLOR }} />

            {/* Calendar header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <SkeletonBlock width={20} height={20} radius={4} />
                <SkeletonBlock width="35%" height={16} radius={6} />
                <SkeletonBlock width={20} height={20} radius={4} />
            </div>

            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonBlock key={i} height={12} radius={4} />
                ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} style={{
                        height: 32,
                        borderRadius: 6,
                        background: i % 7 === 0 || i % 7 === 6 || i < 2 || i > 29
                            ? "transparent"
                            : SKELETON_COLOR,
                        animation: i % 7 === 0 || i % 7 === 6 || i < 2 || i > 29
                            ? "none"
                            : "skeletonShimmer 1.4s ease infinite",
                        backgroundSize: "200% 100%",
                    }} />
                ))}
            </div>

            {/* Time slots */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonBlock key={i} height={40} radius={8} width="100%" />
                ))}
            </div>
        </div>
    )
}

export default function HubSpotMeetings(props) {
    const { meetingUrl, height } = props
    const [loaded, setLoaded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const scriptRef = useRef<HTMLScriptElement | null>(null)

    useEffect(() => {
        if (!meetingUrl) return

        // Read prefill email
        let email = ""
        try {
            email = localStorage.getItem("ajax_last_email") || sessionStorage.getItem("ajax_last_email") || ""
        } catch (e) {}

        // Build URL with email prefill
        let finalUrl = meetingUrl
        try {
            const u = new URL(meetingUrl)
            if (email && !u.searchParams.get("email")) u.searchParams.set("email", email)
            finalUrl = u.toString()
        } catch (e) {}

        // Set data-src on container
        if (containerRef.current) {
            containerRef.current.setAttribute("data-src", finalUrl)
        }

        // Load HubSpot embed script
        if (!document.querySelector('script[src*="MeetingsEmbedCode"]')) {
            const script = document.createElement("script")
            script.src = "https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"
            script.type = "text/javascript"
            script.async = true
            document.body.appendChild(script)
            scriptRef.current = script
        } else {
            // Script already loaded — re-init if HubSpot exposes it
            if ((window as any).HubSpotConversations?.widget?.refresh) {
                (window as any).HubSpotConversations.widget.refresh()
            }
        }

        // Watch for the iframe to appear and fire onload
        const observer = new MutationObserver(() => {
            const iframe = containerRef.current?.querySelector("iframe")
            if (iframe) {
                observer.disconnect()
                iframe.addEventListener("load", () => setLoaded(true))
                // Fallback: if already loaded
                if (iframe.contentDocument?.readyState === "complete") setLoaded(true)
            }
        })

        if (containerRef.current) {
            observer.observe(containerRef.current, { childList: true, subtree: true })
        }

        // Fallback timeout — show iframe after 8s regardless
        const fallback = setTimeout(() => setLoaded(true), 8000)

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
            `}</style>

            {/* Skeleton — shown until iframe loads */}
            <div style={{
                position: "absolute",
                inset: 0,
                opacity: loaded ? 0 : 1,
                transition: "opacity 0.4s ease",
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
                transition: "opacity 0.4s ease",
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
