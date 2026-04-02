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

export function withDomainExpertiseTab(Component: ComponentType): ComponentType {
    return (props: any) => {
        // Stable unique ID per instance, created once on mount
        const instanceId = useRef(Symbol())
        const [isActive, setIsActive] = useState(false)

        useEffect(() => {
            const update = () => {
                setIsActive(activeId === instanceId.current)
            }
            subscribers.add(update)
            return () => {
                subscribers.delete(update)
            }
        }, [])

        return (
            <Component
                {...props}
                variant={isActive ? "Desktop Active" : "Desktop Inactive"}
                onHoverStart={() => {
                    activeId = instanceId.current
                    notify()
                }}
            />
        )
    }
}
