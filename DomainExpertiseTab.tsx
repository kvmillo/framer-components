import type { ComponentType } from "react"
import { useEffect, useRef, useState } from "react"

/**
 * @framerDisableUnlink
 */

// Module-level shared state — all instances on the page share this
let activeId: symbol | null = null
const subscribers = new Set<() => void>()

function notify() {
    subscribers.forEach((fn) => fn())
}

// Desktop ≥ 1360px, Tablet 810–1359px, Phone < 810px → "Mobile" variant
function getPrefix(): "Desktop" | "Tablet" | "Mobile" {
    if (typeof window === "undefined") return "Desktop"
    if (window.innerWidth >= 1360) return "Desktop"
    if (window.innerWidth >= 810) return "Tablet"
    return "Mobile"
}

export function withDomainExpertiseTab(Component: ComponentType): ComponentType {
    return (props: any) => {
        const instanceId = useRef(Symbol())
        const [isActive, setIsActive] = useState(false)
        const [prefix, setPrefix] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop")

        useEffect(() => {
            setPrefix(getPrefix())

            // If this instance's variant is already Active on load, claim the activeId
            if (typeof props.variant === "string" && props.variant.includes("Active")) {
                activeId = instanceId.current
            }

            const onActiveChange = () => setIsActive(activeId === instanceId.current)
            const onResize = () => setPrefix(getPrefix())

            subscribers.add(onActiveChange)
            onActiveChange() // sync initial state after potentially claiming activeId
            window.addEventListener("resize", onResize)

            return () => {
                subscribers.delete(onActiveChange)
                window.removeEventListener("resize", onResize)
            }
        }, [])

        return (
            <Component
                {...props}
                variant={isActive ? `${prefix} Active` : `${prefix} Inactive`}
                onHoverStart={() => {
                    activeId = instanceId.current
                    notify()
                }}
            />
        )
    }
}
