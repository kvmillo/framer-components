import { Override } from "framer"
import { useEffect, useRef } from "react"

export function FabricScrollRotateSpring(): Override {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.style.transformOrigin = "50% 1%"

        let lastY = window.scrollY
        let lastTime = Date.now()
        let vel = 0
        let smooth = 0
        let rafId: number

        const onScroll = () => {
            const now = Date.now()
            const dt = Math.max(1, now - lastTime)
            vel = ((window.scrollY - lastY) / dt) * 1000
            lastY = window.scrollY
            lastTime = now
        }

        const tick = () => {
            smooth += (vel - smooth) * 0.08
            vel *= 0.88
            const angle = Math.max(-1.6, Math.min(1.6, smooth / 1250))
            el.style.transform = `rotateZ(${angle}deg)`
            rafId = requestAnimationFrame(tick)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        rafId = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener("scroll", onScroll)
            cancelAnimationFrame(rafId)
            el.style.transform = ""
            el.style.transformOrigin = ""
        }
    }, [])

    return { ref }
}

export function FabricScrollRotateSpringReverse(): Override {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        el.style.transformOrigin = "50% 1%"

        let lastY = window.scrollY
        let lastTime = Date.now()
        let vel = 0
        let smooth = 0
        let rafId: number

        const onScroll = () => {
            const now = Date.now()
            const dt = Math.max(1, now - lastTime)
            vel = ((window.scrollY - lastY) / dt) * 1000
            lastY = window.scrollY
            lastTime = now
        }

        const tick = () => {
            smooth += (vel - smooth) * 0.08
            vel *= 0.88
            const angle = Math.max(-1.6, Math.min(1.6, smooth / 1250))
            el.style.transform = `rotateZ(${-angle}deg)`
            rafId = requestAnimationFrame(tick)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        rafId = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener("scroll", onScroll)
            cancelAnimationFrame(rafId)
            el.style.transform = ""
            el.style.transformOrigin = ""
        }
    }, [])

    return { ref }
}
