import { addPropertyControls, ControlType } from "framer"
import { useState, useMemo, useRef, useId, startTransition, type CSSProperties } from "react"

/**
 * Email input that blocks personal email domains (gmail, yahoo, etc.)
 * Drop inside a Framer Form — uses setCustomValidity() so the form
 * natively refuses to submit when the domain is blocked or format is invalid.
 *
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 96
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EmailInput(props: Props) {
    const {
        style,
        name,
        required,
        defaultValue,
        label,
        input,
        placeholder,
        helper,
        blockedDomains,
        blockedMessage,
        invalidMessage,
        requiredMessage,
        layout,
    } = props

    const reactId = useId()
    const scopeId = useRef(`eiput-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`).current
    const inputRef = useRef<HTMLInputElement | null>(null)

    const [value, setValue] = useState(defaultValue ?? "")
    const [focused, setFocused] = useState(false)
    const [touched, setTouched] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string>("")

    const normalizedBlocked = useMemo(
        () =>
            (blockedDomains ?? [])
                .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
                .filter(Boolean),
        [blockedDomains]
    )

    function validate(v: string): string {
        const trimmed = v.trim()
        if (!trimmed) return required ? requiredMessage : ""
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRe.test(trimmed)) return invalidMessage
        const domain = trimmed.split("@")[1]?.toLowerCase() ?? ""
        if (normalizedBlocked.some((b) => domain === b || domain.endsWith("." + b))) {
            return blockedMessage
        }
        return ""
    }

    function applyValidity(v: string) {
        const msg = validate(v)
        startTransition(() => setErrorMsg(msg))
        const el = inputRef.current
        if (el) el.setCustomValidity(msg)
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value
        startTransition(() => setValue(v))
        applyValidity(v)
    }

    function onBlur() {
        startTransition(() => {
            setFocused(false)
            setTouched(true)
        })
        applyValidity(value)
    }

    const showError = touched && !!errorMsg

    const borderColor = showError
        ? input.errorBorderColor
        : focused
          ? input.focusBorderColor
          : input.borderColor

    const labelStyle: CSSProperties = {
        ...label.font,
        color: label.color,
        display: label.show ? "inline-block" : "none",
    }

    const inputStyle: CSSProperties = {
        width: "100%",
        boxSizing: "border-box",
        padding: `${input.paddingV}px ${input.paddingH}px`,
        background: input.bg,
        color: input.textColor,
        borderRadius: input.borderRadius,
        border: `${input.borderWidth}px ${input.borderStyle} ${borderColor}`,
        outline: "none",
        transition: "border-color 0.15s ease, background 0.15s ease",
        appearance: "none",
        WebkitAppearance: "none",
        ...input.font,
    }

    const helperBaseStyle: CSSProperties = {
        ...helper.font,
        color: showError ? helper.errorColor : helper.color,
        display: showError || helper.text ? "inline-block" : "none",
    }

    return (
        <>
            <style>{`
                .${scopeId}-input::placeholder {
                    color: ${input.placeholderColor};
                    opacity: 1;
                }
                .${scopeId}-input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 1000px ${input.bg} inset;
                    -webkit-text-fill-color: ${input.textColor};
                    caret-color: ${input.textColor};
                }
            `}</style>
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: layout.gap,
                    width: "100%",
                    ...style,
                }}
            >
                {label.show && (
                    <label htmlFor={scopeId} style={labelStyle}>
                        {label.text}
                        {required && label.showRequiredMark && (
                            <span style={{ color: label.requiredMarkColor, marginLeft: 2 }}>
                                {label.requiredMark}
                            </span>
                        )}
                    </label>
                )}
                <input
                    ref={inputRef}
                    id={scopeId}
                    className={`${scopeId}-input`}
                    type="email"
                    name={name || "email"}
                    value={value}
                    required={required}
                    placeholder={placeholder}
                    autoComplete="email"
                    inputMode="email"
                    onChange={onChange}
                    onFocus={() => startTransition(() => setFocused(true))}
                    onBlur={onBlur}
                    style={inputStyle}
                />
                {(showError || helper.text) && (
                    <span style={helperBaseStyle}>
                        {showError ? errorMsg : helper.text}
                    </span>
                )}
            </div>
        </>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LabelProps {
    show: boolean
    text: string
    font: Record<string, any>
    color: string
    showRequiredMark: boolean
    requiredMark: string
    requiredMarkColor: string
}

interface InputStyleProps {
    font: Record<string, any>
    bg: string
    textColor: string
    placeholderColor: string
    borderColor: string
    focusBorderColor: string
    errorBorderColor: string
    borderStyle: "solid" | "dashed" | "dotted"
    borderWidth: number
    borderRadius: number
    paddingV: number
    paddingH: number
}

interface HelperProps {
    text: string
    font: Record<string, any>
    color: string
    errorColor: string
}

interface LayoutProps {
    gap: number
}

interface Props {
    style?: CSSProperties
    name: string
    required: boolean
    defaultValue: string
    label: LabelProps
    input: InputStyleProps
    placeholder: string
    helper: HelperProps
    blockedDomains: string[]
    blockedMessage: string
    invalidMessage: string
    requiredMessage: string
    layout: LayoutProps
}

// ─── Property Controls ────────────────────────────────────────────────────────

const DEFAULT_BLOCKED = [
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "ymail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "gmx.com",
    "gmx.net",
    "mail.com",
    "zoho.com",
    "yandex.com",
    "yandex.ru",
    "tutanota.com",
    "fastmail.com",
]

addPropertyControls(EmailInput, {
    name: {
        type: ControlType.String,
        defaultValue: "email",
        title: "Field Name",
        description: "Name attribute used when the parent form submits.",
    },
    required: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Required",
    },
    defaultValue: {
        type: ControlType.String,
        defaultValue: "",
        title: "Default Value",
    },
    placeholder: {
        type: ControlType.String,
        defaultValue: "you@company.com",
        title: "Placeholder",
    },

    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            show: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show",
            },
            text: {
                type: ControlType.String,
                defaultValue: "Work email",
                title: "Text",
                hidden: (p: any) => !p.show,
            },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
                title: "Font",
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Color",
                hidden: (p: any) => !p.show,
            },
            showRequiredMark: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Show *",
                hidden: (p: any) => !p.show,
            },
            requiredMark: {
                type: ControlType.String,
                defaultValue: "*",
                title: "Mark",
                hidden: (p: any) => !p.show || !p.showRequiredMark,
            },
            requiredMarkColor: {
                type: ControlType.Color,
                defaultValue: "#e11d48",
                title: "Mark Color",
                hidden: (p: any) => !p.show || !p.showRequiredMark,
            },
        },
    },

    input: {
        type: ControlType.Object,
        title: "Input",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Regular",
                    lineHeight: "1.5em",
                    letterSpacing: "0em",
                },
                title: "Font",
            },
            bg: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Background",
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Text Color",
            },
            placeholderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.35)",
                title: "Placeholder Color",
            },
            borderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.15)",
                title: "Border",
            },
            focusBorderColor: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Focus Border",
            },
            errorBorderColor: {
                type: ControlType.Color,
                defaultValue: "#e11d48",
                title: "Error Border",
            },
            borderStyle: {
                type: ControlType.Enum,
                options: ["solid", "dashed", "dotted"],
                optionTitles: ["Solid", "Dashed", "Dotted"],
                defaultValue: "solid",
                title: "Border Style",
            },
            borderWidth: {
                type: ControlType.Number,
                defaultValue: 1,
                min: 0,
                max: 8,
                step: 1,
                displayStepper: true,
                title: "Border Width",
            },
            borderRadius: {
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 48,
                step: 1,
                displayStepper: true,
                title: "Radius",
            },
            paddingV: {
                type: ControlType.Number,
                defaultValue: 12,
                min: 0,
                max: 64,
                step: 1,
                displayStepper: true,
                title: "Padding V",
            },
            paddingH: {
                type: ControlType.Number,
                defaultValue: 14,
                min: 0,
                max: 64,
                step: 1,
                displayStepper: true,
                title: "Padding H",
            },
        },
    },

    helper: {
        type: ControlType.Object,
        title: "Helper Text",
        controls: {
            text: {
                type: ControlType.String,
                defaultValue: "Please use your work email.",
                title: "Text",
                displayTextArea: true,
            },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Regular",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
                title: "Font",
            },
            color: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.55)",
                title: "Color",
            },
            errorColor: {
                type: ControlType.Color,
                defaultValue: "#e11d48",
                title: "Error Color",
            },
        },
    },

    blockedDomains: {
        type: ControlType.Array,
        title: "Blocked Domains",
        defaultValue: DEFAULT_BLOCKED,
        control: {
            type: ControlType.String,
            placeholder: "gmail.com",
        },
    },
    blockedMessage: {
        type: ControlType.String,
        defaultValue: "Please use your work email — personal email addresses aren't accepted.",
        title: "Blocked Msg",
        displayTextArea: true,
    },
    invalidMessage: {
        type: ControlType.String,
        defaultValue: "Enter a valid email address.",
        title: "Invalid Msg",
    },
    requiredMessage: {
        type: ControlType.String,
        defaultValue: "Email is required.",
        title: "Required Msg",
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            gap: {
                type: ControlType.Number,
                defaultValue: 6,
                min: 0,
                max: 40,
                step: 1,
                displayStepper: true,
                title: "Gap",
            },
        },
    },
})
