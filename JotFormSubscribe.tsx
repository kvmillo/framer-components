import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, startTransition, type CSSProperties } from "react"

/**
 * Custom styled Subscribe form that submits to JotForm (ID: 260905043710145).
 *
 * Fields: First Name, Last Name, Email, Submit button.
 *
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 280
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function JotFormSubscribe(props: Props) {
    const {
        style,
        input,
        button,
        label,
        caption,
        form,
        submitButtonText,
        showSuccessMessage,
        successMessage,
    } = props

    const scopeId = useRef(`jfsub-${Math.random().toString(36).slice(2, 8)}`).current

    const [values, setValues] = useState({ firstName: "", lastName: "", email: "" })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [focused, setFocused] = useState<string | null>(null)
    const [buttonHovered, setButtonHovered] = useState(false)
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

    function validate() {
        const e: Record<string, string> = {}
        if (!values.firstName.trim()) e.firstName = "Required"
        if (!values.lastName.trim()) e.lastName = "Required"
        if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
            e.email = "Enter a valid email address"
        return e
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const errs = validate()
        startTransition(() => setErrors(errs))
        if (Object.keys(errs).length > 0) return

        startTransition(() => setStatus("loading"))

        const data = new FormData()
        data.append("formID", "260905043710145")
        data.append("q2_name[first]", values.firstName)
        data.append("q2_name[last]", values.lastName)
        data.append("q4_q4_email2", values.email)
        data.append("simple_spc", "260905043710145")
        data.append("submitSource", "embed")
        data.append("submitDate", new Date().toISOString())
        data.append("buildDate", "1775065269172")

        try {
            await fetch("https://submit.jotform.com/submit/260905043710145", {
                method: "POST",
                body: data,
                mode: "no-cors",
            })
            startTransition(() => setStatus("success"))
        } catch {
            startTransition(() => setStatus("error"))
        }
    }

    function set(field: string, value: string) {
        startTransition(() => {
            setValues((prev) => ({ ...prev, [field]: value }))
            if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
        })
    }

    // ─── Alignment helpers ────────────────────────────────────────────────────

    const alignItems =
        form.align === "center" ? "center" : form.align === "right" ? "flex-end" : "flex-start"
    const textAlign = form.align as CSSProperties["textAlign"]

    // ─── Button background ────────────────────────────────────────────────────

    const isHovered = buttonHovered && status !== "loading"
    const buttonBaseBg = button.useGradient
        ? `linear-gradient(${button.gradientAngle}deg, ${button.gradientFrom}, ${button.gradientTo})`
        : button.bg
    const buttonHoverBg = button.useGradient
        ? `linear-gradient(${button.gradientAngle}deg, ${button.gradientHoverFrom}, ${button.gradientHoverTo})`
        : button.hoverBg

    // ─── Shared style helpers ─────────────────────────────────────────────────

    const inputStyle = (field: string): CSSProperties => ({
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        background: input.bg,
        border: `1px ${input.borderStyle} ${focused === field ? input.focusBorderColor : errors[field] ? form.errorColor : input.borderColor}`,
        borderRadius: input.borderRadius,
        padding: `${input.paddingV}px ${input.paddingH}px`,
        color: input.textColor,
        outline: "none",
        transition: "border-color 0.15s ease",
        ...input.font,
        WebkitAppearance: "none",
        appearance: "none",
    })

    const labelStyle: CSSProperties = {
        display: "block",
        marginBottom: 6,
        color: label.color,
        textAlign,
        ...label.font,
    }

    const errorStyle: CSSProperties = {
        marginTop: 4,
        fontSize: 12,
        color: form.errorColor,
        textAlign,
        ...label.font,
        fontWeight: 400,
    }

    const fieldStyle: CSSProperties = { display: "flex", flexDirection: "column", width: "100%" }

    // ─── Success state ────────────────────────────────────────────────────────

    if (status === "success" && showSuccessMessage) {
        return (
            <div
                style={{
                    position: "relative",
                    background: form.bg,
                    borderRadius: input.borderRadius,
                    padding: `${input.paddingV * 3}px ${input.paddingH * 2}px`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    minHeight: 120,
                    textAlign: "center",
                    ...style,
                }}
            >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill={button.bg} opacity={0.12} />
                    <path
                        d="M13 20l5 5 9-9"
                        stroke={button.bg}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <p style={{ margin: 0, color: input.textColor, ...label.font }}>{successMessage}</p>
            </div>
        )
    }

    // ─── Main form ────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                .${scopeId} input::placeholder {
                    color: ${input.placeholderColor};
                    opacity: 1;
                }
            `}</style>
            <div
                className={scopeId}
                style={{
                    position: "relative",
                    background: form.bg,
                    width: "100%",
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{ display: "flex", flexDirection: "column", gap: form.gap, alignItems }}
                >
                    {/* Row: First Name + Last Name */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: form.gap, width: "100%" }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>First name *</label>
                            <input
                                type="text"
                                placeholder="John"
                                value={values.firstName}
                                onChange={(e) => set("firstName", e.target.value)}
                                onFocus={() => startTransition(() => setFocused("firstName"))}
                                onBlur={() => startTransition(() => setFocused(null))}
                                style={inputStyle("firstName")}
                            />
                            {errors.firstName && <span style={errorStyle}>{errors.firstName}</span>}
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Last name *</label>
                            <input
                                type="text"
                                placeholder="Doe"
                                value={values.lastName}
                                onChange={(e) => set("lastName", e.target.value)}
                                onFocus={() => startTransition(() => setFocused("lastName"))}
                                onBlur={() => startTransition(() => setFocused(null))}
                                style={inputStyle("lastName")}
                            />
                            {errors.lastName && <span style={errorStyle}>{errors.lastName}</span>}
                        </div>
                    </div>

                    {/* Email */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Email address *</label>
                        <input
                            type="email"
                            placeholder="example@example.com"
                            value={values.email}
                            onChange={(e) => set("email", e.target.value)}
                            onFocus={() => startTransition(() => setFocused("email"))}
                            onBlur={() => startTransition(() => setFocused(null))}
                            style={inputStyle("email")}
                        />
                        {errors.email && <span style={errorStyle}>{errors.email}</span>}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        onMouseEnter={() => startTransition(() => setButtonHovered(true))}
                        onMouseLeave={() => startTransition(() => setButtonHovered(false))}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            width: button.width === "fill" ? "100%" : "auto",
                            padding: `${button.paddingV}px ${button.paddingH}px`,
                            background: buttonBaseBg,
                            color: button.textColor,
                            border: "none",
                            boxShadow: button.borderWidth > 0
                                ? `inset 0 0 0 ${button.borderWidth}px ${button.borderColor}`
                                : "none",
                            borderRadius: button.borderRadius,
                            cursor: status === "loading" ? "wait" : "pointer",
                            opacity: status === "loading" ? 0.7 : 1,
                            overflow: "hidden",
                            transition: "opacity 0.15s ease",
                            ...button.font,
                        }}
                    >
                        {/* Hover overlay */}
                        <span
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: buttonHoverBg,
                                opacity: isHovered ? 1 : 0,
                                transition: "opacity 0.2s ease",
                                pointerEvents: "none",
                            }}
                        />
                        {/* Content above overlay */}
                        <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                            {status === "loading" ? (
                                <>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{ animation: "jfsub-spin 0.8s linear infinite" }}
                                    >
                                        <circle cx="8" cy="8" r="6" stroke={button.textColor} strokeWidth="2" strokeOpacity="0.3" />
                                        <path d="M8 2a6 6 0 0 1 6 6" stroke={button.textColor} strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <style>{`@keyframes jfsub-spin { to { transform: rotate(360deg); } }`}</style>
                                    Sending…
                                </>
                            ) : status === "error" ? (
                                "Something went wrong — try again"
                            ) : (
                                submitButtonText
                            )}
                        </span>
                    </button>

                </form>
            </div>
        </>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps {
    font: Record<string, any>
    bg: string
    borderColor: string
    borderStyle: "solid" | "dashed" | "dotted"
    focusBorderColor: string
    textColor: string
    placeholderColor: string
    borderRadius: number
    paddingV: number
    paddingH: number
}

interface ButtonProps {
    font: Record<string, any>
    bg: string
    hoverBg: string
    textColor: string
    width: "fill" | "fit"
    paddingV: number
    paddingH: number
    borderRadius: number
    borderColor: string
    borderWidth: number
    useGradient: boolean
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    gradientHoverFrom: string
    gradientHoverTo: string
}

interface CaptionProps {
    font: Record<string, any>
    color: string
}

interface LabelProps {
    font: Record<string, any>
    color: string
}

interface FormProps {
    bg: string
    gap: number
    errorColor: string
    align: "left" | "center" | "right"
}

interface Props {
    style?: CSSProperties
    input: InputProps
    button: ButtonProps
    caption: CaptionProps
    label: LabelProps
    form: FormProps
    submitButtonText: string
    showSuccessMessage: boolean
    successMessage: string
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(JotFormSubscribe, {
    input: {
        type: ControlType.Object,
        title: "Input",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.5em" },
                title: "Font",
            },
            bg: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Background",
            },
            borderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.15)",
                title: "Border Color",
            },
            borderStyle: {
                type: ControlType.Enum,
                options: ["solid", "dashed", "dotted"],
                optionTitles: ["Solid", "Dashed", "Dotted"],
                defaultValue: "solid",
                title: "Border Style",
            },
            focusBorderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.6)",
                title: "Focus Border",
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Text",
            },
            placeholderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.3)",
                title: "Placeholder",
            },
            borderRadius: {
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
                title: "Radius",
            },
            paddingV: {
                type: ControlType.Number,
                defaultValue: 11,
                min: 4,
                max: 400,
                step: 1,
                displayStepper: true,
                title: "Padding V",
            },
            paddingH: {
                type: ControlType.Number,
                defaultValue: 14,
                min: 4,
                max: 400,
                step: 1,
                displayStepper: true,
                title: "Padding H",
            },
        },
    },

    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "15px", variant: "Medium", lineHeight: "1.5em" },
                title: "Font",
            },
            bg: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Background",
                hidden: (props) => props.useGradient,
            },
            hoverBg: {
                type: ControlType.Color,
                defaultValue: "#333333",
                title: "Hover BG",
                hidden: (props) => props.useGradient,
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Text",
            },
            width: {
                type: ControlType.Enum,
                options: ["fill", "fit"],
                optionTitles: ["Fill", "Fit Content"],
                displaySegmentedControl: true,
                defaultValue: "fill",
                title: "Width",
            },
            paddingV: {
                type: ControlType.Number,
                defaultValue: 14,
                min: 4,
                max: 64,
                step: 1,
                displayStepper: true,
                title: "Padding V",
            },
            paddingH: {
                type: ControlType.Number,
                defaultValue: 24,
                min: 4,
                max: 96,
                step: 1,
                displayStepper: true,
                title: "Padding H",
            },
            borderRadius: {
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
                title: "Radius",
            },
            borderColor: {
                type: ControlType.Color,
                defaultValue: "transparent",
                title: "Border Color",
            },
            borderWidth: {
                type: ControlType.Number,
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 1,
                displayStepper: true,
                title: "Border Width",
            },
            useGradient: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Gradient",
            },
            gradientFrom: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Gradient From",
                hidden: (props) => !props.useGradient,
            },
            gradientTo: {
                type: ControlType.Color,
                defaultValue: "#555555",
                title: "Gradient To",
                hidden: (props) => !props.useGradient,
            },
            gradientAngle: {
                type: ControlType.Number,
                defaultValue: 135,
                min: 0,
                max: 360,
                step: 5,
                title: "Gradient Angle",
                hidden: (props) => !props.useGradient,
            },
            gradientHoverFrom: {
                type: ControlType.Color,
                defaultValue: "#333333",
                title: "Hover From",
                hidden: (props) => !props.useGradient,
            },
            gradientHoverTo: {
                type: ControlType.Color,
                defaultValue: "#666666",
                title: "Hover To",
                hidden: (props) => !props.useGradient,
            },
        },
    },

    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "12px", variant: "Regular", lineHeight: "1.4em" },
                title: "Font",
            },
            color: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.35)",
                title: "Color",
            },
        },
    },

    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.4em" },
                title: "Font",
            },
            color: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.7)",
                title: "Color",
            },
        },
    },

    form: {
        type: ControlType.Object,
        title: "Form",
        controls: {
            bg: {
                type: ControlType.Color,
                defaultValue: "transparent",
                title: "Background",
            },
            gap: {
                type: ControlType.Number,
                defaultValue: 20,
                min: 4,
                max: 64,
                step: 2,
                displayStepper: true,
                title: "Field Gap",
            },
            errorColor: {
                type: ControlType.Color,
                defaultValue: "#e53e3e",
                title: "Error Color",
            },
            align: {
                type: ControlType.Enum,
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
                title: "Align",
            },
        },
    },

    submitButtonText: {
        type: ControlType.String,
        defaultValue: "Subscribe",
        title: "Button Label",
    },
    showSuccessMessage: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show Success State",
    },
    successMessage: {
        type: ControlType.String,
        defaultValue: "You're subscribed!",
        title: "Success Message",
        hidden: (props) => !props.showSuccessMessage,
    },
})
