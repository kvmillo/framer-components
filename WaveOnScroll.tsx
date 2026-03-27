import { Override } from "framer"
import { useEffect, useRef } from "react"

function useWaveOnScroll(reverse: boolean) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const isMobile = window.innerWidth < 768
        const maxAngle = isMobile ? 3.5 : 1.6
        const divisor = isMobile ? 600 : 1250
        const springFactor = isMobile ? 0.14 : 0.08
        const velDecay = isMobile ? 0.82 : 0.88

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
            const isReturning = isMobile && (Math.abs(vel) < 80 || vel * smooth < 0)
            smooth += (vel - smooth) * (isReturning ? 0.22 : springFactor)
            vel *= velDecay
            const angle = Math.max(-maxAngle, Math.min(maxAngle, smooth / divisor))
            el.style.transform = `rotateZ(${reverse ? -angle : angle}deg)`
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

export function FabricScrollRotateSpring(): Override {
    return useWaveOnScroll(false)
}

export function FabricScrollRotateSpringReverse(): Override {
    return useWaveOnScroll(true)
}
