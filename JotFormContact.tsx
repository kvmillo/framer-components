import { addPropertyControls, ControlType } from "framer"
import { useState, startTransition, type CSSProperties } from "react"

/**
 * Custom styled Contact Us form that submits to JotForm (ID: 260886337622060).
 *
 * Fields: First Name, Last Name, Email, Inquiry Type (dropdown),
 * Message (textarea), Consent checkbox, Submit button.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function JotFormContact(props: Props) {
    const {
        style,
        input,
        button,
        label,
        form,
        submitButtonText,
        showSuccessMessage,
        successMessage,
    } = props

    const [values, setValues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        inquiryType: "",
        message: "",
        consent: false,
    })
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
        if (!values.inquiryType) e.inquiryType = "Required"
        if (!values.message.trim()) e.message = "Required"
        if (!values.consent) e.consent = "You must agree to continue"
        return e
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const errs = validate()
        startTransition(() => setErrors(errs))
        if (Object.keys(errs).length > 0) return

        startTransition(() => setStatus("loading"))

        const data = new FormData()
        data.append("formID", "260886337622060")
        data.append("q2_q2_fullname0[first]", values.firstName)
        data.append("q2_q2_fullname0[last]", "")
        data.append("q3_q3_fullname1[first]", "")
        data.append("q3_q3_fullname1[last]", values.lastName)
        data.append("q4_q4_email2", values.email)
        data.append("q5_q5_dropdown3", values.inquiryType)
        data.append("q6_q6_textarea4", values.message)
        if (values.consent) data.append("q7_q7_checkbox5[]", "I agree")
        data.append("simple_spc", "260886337622060-260886337622060")
        data.append("submitSource", "embed")
        data.append("submitDate", new Date().toISOString())
        data.append("buildDate", "1774905042321")

        try {
            await fetch("https://submit.jotform.com/submit/260886337622060", {
                method: "POST",
                body: data,
                mode: "no-cors",
            })
            startTransition(() => setStatus("success"))
        } catch {
            startTransition(() => setStatus("error"))
        }
    }

    function set(field: string, value: string | boolean) {
        startTransition(() => {
            setValues((prev) => ({ ...prev, [field]: value }))
            if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
        })
    }

    // ─── Shared style helpers ─────────────────────────────────────────────────

    const inputStyle = (field: string): CSSProperties => ({
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        background: input.bg,
        border: `1px solid ${focused === field ? input.focusBorderColor : errors[field] ? form.errorColor : input.borderColor}`,
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
        ...label.font,
    }

    const errorStyle: CSSProperties = {
        marginTop: 4,
        fontSize: 12,
        color: form.errorColor,
        ...label.font,
        fontWeight: 400,
    }

    const fieldStyle: CSSProperties = { display: "flex", flexDirection: "column" }

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
                    minHeight: 160,
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
        <div
            style={{
                position: "relative",
                background: form.bg,
                width: "100%",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: form.gap }}>

                {/* Row: First Name + Last Name */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: form.gap }}>
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

                {/* Inquiry Type */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>Inquiry type *</label>
                    <div style={{ position: "relative" }}>
                        <select
                            value={values.inquiryType}
                            onChange={(e) => set("inquiryType", e.target.value)}
                            onFocus={() => startTransition(() => setFocused("inquiryType"))}
                            onBlur={() => startTransition(() => setFocused(null))}
                            style={{
                                ...inputStyle("inquiryType"),
                                cursor: "pointer",
                                paddingRight: input.paddingH + 28,
                                color: values.inquiryType ? input.textColor : input.placeholderColor,
                            }}
                        >
                            <option value="" disabled hidden>Please select</option>
                            <option value="General Question">General Question</option>
                            <option value="Support">Support</option>
                            <option value="Feedback">Feedback</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Other">Other</option>
                        </select>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                                position: "absolute",
                                right: input.paddingH,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                opacity: 0.5,
                            }}
                        >
                            <path
                                d="M4 6l4 4 4-4"
                                stroke={input.textColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    {errors.inquiryType && <span style={errorStyle}>{errors.inquiryType}</span>}
                </div>

                {/* Message */}
                <div style={fieldStyle}>
                    <label style={labelStyle}>What's on your mind? *</label>
                    <textarea
                        placeholder="Tell us more..."
                        value={values.message}
                        onChange={(e) => set("message", e.target.value)}
                        onFocus={() => startTransition(() => setFocused("message"))}
                        onBlur={() => startTransition(() => setFocused(null))}
                        rows={5}
                        style={{
                            ...inputStyle("message"),
                            resize: "vertical",
                            minHeight: 120,
                        }}
                    />
                    {errors.message && <span style={errorStyle}>{errors.message}</span>}
                </div>

                {/* Consent */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                        <span
                            style={{
                                flexShrink: 0,
                                width: 18,
                                height: 18,
                                marginTop: 1,
                                borderRadius: Math.min(input.borderRadius as number, 4),
                                border: `1.5px solid ${values.consent ? button.bg : errors.consent ? form.errorColor : input.borderColor}`,
                                background: values.consent ? button.bg : input.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {values.consent && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path
                                        d="M2 5l2.5 2.5L8 3"
                                        stroke={button.textColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </span>
                        <input
                            type="checkbox"
                            checked={values.consent}
                            onChange={(e) => set("consent", e.target.checked)}
                            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{ ...label.font, color: label.color, lineHeight: "1.4" }}>
                            I agree to receive follow-up communication and occasional updates by email. *
                        </span>
                    </label>
                    {errors.consent && <span style={{ ...errorStyle, marginLeft: 28 }}>{errors.consent}</span>}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={status === "loading"}
                    onMouseEnter={() => startTransition(() => setButtonHovered(true))}
                    onMouseLeave={() => startTransition(() => setButtonHovered(false))}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        width: "100%",
                        padding: `${input.paddingV + 4}px ${input.paddingH}px`,
                        background: buttonHovered && status !== "loading" ? button.hoverBg : button.bg,
                        color: button.textColor,
                        border: "none",
                        borderRadius: input.borderRadius,
                        cursor: status === "loading" ? "wait" : "pointer",
                        opacity: status === "loading" ? 0.7 : 1,
                        transition: "background 0.15s ease, opacity 0.15s ease",
                        ...button.font,
                    }}
                >
                    {status === "loading" ? (
                        <>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{ animation: "jf-spin 0.8s linear infinite" }}
                            >
                                <circle cx="8" cy="8" r="6" stroke={button.textColor} strokeWidth="2" strokeOpacity="0.3" />
                                <path d="M8 2a6 6 0 0 1 6 6" stroke={button.textColor} strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <style>{`@keyframes jf-spin { to { transform: rotate(360deg); } }`}</style>
                            Sending…
                        </>
                    ) : status === "error" ? (
                        "Something went wrong — try again"
                    ) : (
                        submitButtonText
                    )}
                </button>

            </form>
        </div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps {
    font: Record<string, any>
    bg: string
    borderColor: string
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
}

interface LabelProps {
    font: Record<string, any>
    color: string
}

interface FormProps {
    bg: string
    gap: number
    errorColor: string
}

interface Props {
    style?: CSSProperties
    input: InputProps
    button: ButtonProps
    label: LabelProps
    form: FormProps
    submitButtonText: string
    showSuccessMessage: boolean
    successMessage: string
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(JotFormContact, {
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
                title: "Border",
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
                max: 24,
                step: 1,
                displayStepper: true,
                title: "Radius",
            },
            paddingV: {
                type: ControlType.Number,
                defaultValue: 11,
                min: 6,
                max: 24,
                step: 1,
                displayStepper: true,
                title: "Padding V",
            },
            paddingH: {
                type: ControlType.Number,
                defaultValue: 14,
                min: 8,
                max: 32,
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
            },
            hoverBg: {
                type: ControlType.Color,
                defaultValue: "#333333",
                title: "Hover BG",
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Text",
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
                min: 8,
                max: 48,
                step: 2,
                displayStepper: true,
                title: "Field Gap",
            },
            errorColor: {
                type: ControlType.Color,
                defaultValue: "#e53e3e",
                title: "Error Color",
            },
        },
    },

    submitButtonText: {
        type: ControlType.String,
        defaultValue: "Submit inquiry",
        title: "Button Label",
    },
    showSuccessMessage: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show Success State",
    },
    successMessage: {
        type: ControlType.String,
        defaultValue: "Thanks! We'll be in touch soon.",
        title: "Success Message",
        hidden: (props) => !props.showSuccessMessage,
    },
})
