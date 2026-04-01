import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, startTransition, type CSSProperties } from "react"

/**
 * Custom styled Career Application Form that submits to JotForm (ID: 260885580434060).
 *
 * Fields: Full Name (first + last), Email, Position Inquiry (dropdown),
 * Upload Resume (file), Message (optional textarea), Consent checkbox, Submit button.
 *
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function JotFormCareer(props: Props) {
    const {
        style,
        input,
        button,
        checkbox,
        fileUpload,
        caption,
        label,
        form,
        submitButtonText,
        showSuccessMessage,
        successMessage,
    } = props

    const scopeId = useRef(`jfca-${Math.random().toString(36).slice(2, 8)}`).current

    const [values, setValues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        position: "",
        message: "",
        consent: false,
    })
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [focused, setFocused] = useState<string | null>(null)
    const [buttonHovered, setButtonHovered] = useState(false)
    const [fileHovered, setFileHovered] = useState(false)
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const fileInputRef = useRef<HTMLInputElement>(null)

    function validate() {
        const e: Record<string, string> = {}
        if (!values.firstName.trim()) e.firstName = "Required"
        if (!values.lastName.trim()) e.lastName = "Required"
        if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
            e.email = "Enter a valid email address"
        if (!values.position) e.position = "Required"
        if (!resumeFile) e.resume = "Please upload your resume"
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
        data.append("formID", "260885580434060")
        data.append("q2_q2_fullname0[first]", values.firstName)
        data.append("q2_q2_fullname0[last]", values.lastName)
        data.append("q3_q3_email1", values.email)
        data.append("q4_q4_dropdown2", values.position)
        if (resumeFile) data.append("q5_q5_fileupload3[]", resumeFile, resumeFile.name)
        data.append("q6_q6_textarea4", values.message)
        if (values.consent) data.append("q7_q7_checkbox5[]", "I agree")
        data.append("simple_spc", "260885580434060-260885580434060")
        data.append("submitSource", "embed")
        data.append("submitDate", new Date().toISOString())
        data.append("buildDate", "1774905085598")

        try {
            await fetch("https://submit.jotform.com/submit/260885580434060", {
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

    function handleFileChange(file: File | null) {
        startTransition(() => {
            setResumeFile(file)
            if (file && errors.resume) setErrors((prev) => { const n = { ...prev }; delete n.resume; return n })
        })
    }

    function handleFileDrop(e: React.DragEvent) {
        e.preventDefault()
        startTransition(() => setFileHovered(false))
        const file = e.dataTransfer.files?.[0]
        if (file) handleFileChange(file)
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

    const captionStyle: CSSProperties = {
        marginTop: 4,
        color: caption.color,
        textAlign,
        ...caption.font,
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
        <>
            <style>{`
                .${scopeId} input::placeholder,
                .${scopeId} textarea::placeholder {
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
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: form.gap,
                        alignItems,
                    }}
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

                    {/* Position Inquiry */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Position inquiry *</label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={values.position}
                                onChange={(e) => set("position", e.target.value)}
                                onFocus={() => startTransition(() => setFocused("position"))}
                                onBlur={() => startTransition(() => setFocused(null))}
                                style={{
                                    ...inputStyle("position"),
                                    cursor: "pointer",
                                    paddingRight: input.paddingH + 28,
                                    color: values.position ? input.textColor : input.placeholderColor,
                                }}
                            >
                                <option value="" disabled hidden>Please select</option>
                                <option value="General">General</option>
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
                        {errors.position && <span style={errorStyle}>{errors.position}</span>}
                    </div>

                    {/* Resume Upload */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Upload resume *</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); startTransition(() => setFileHovered(true)) }}
                            onDragLeave={() => startTransition(() => setFileHovered(false))}
                            onDrop={handleFileDrop}
                            style={{
                                display: "flex",
                                flexDirection: fileUpload.layout === "vertical" ? "column" : "row",
                                alignItems: "center",
                                justifyContent: fileUpload.layout === "vertical" ? "center" : "flex-start",
                                gap: fileUpload.layout === "vertical" ? 8 : 12,
                                padding: `${fileUpload.paddingV}px ${fileUpload.paddingH}px`,
                                textAlign: fileUpload.layout === "vertical" ? "center" : undefined,
                                background: fileHovered ? `${input.focusBorderColor}10` : input.bg,
                                border: `1px ${fileHovered ? "dashed" : fileUpload.borderStyle} ${errors.resume ? form.errorColor : fileHovered ? input.focusBorderColor : input.borderColor}`,
                                borderRadius: input.borderRadius,
                                cursor: "pointer",
                                transition: "border-color 0.15s ease, background 0.15s ease",
                                boxSizing: "border-box",
                            }}
                        >
                            {fileUpload.icon ? (
                                <img
                                    src={fileUpload.icon}
                                    width={fileUpload.iconSize}
                                    height={fileUpload.iconSize}
                                    style={{ flexShrink: 0, objectFit: "contain", opacity: resumeFile ? 0.7 : 0.4 }}
                                    alt=""
                                />
                            ) : (
                                <svg
                                    width={fileUpload.iconSize}
                                    height={fileUpload.iconSize}
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    style={{ flexShrink: 0, opacity: resumeFile ? 0.7 : 0.4 }}
                                >
                                    <path
                                        d="M10 13V5M10 5L7 8M10 5l3 3"
                                        stroke={resumeFile ? button.bg : input.textColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 16h12"
                                        stroke={resumeFile ? button.bg : input.textColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                            <span
                                style={{
                                    ...input.font,
                                    color: resumeFile ? input.textColor : input.placeholderColor,
                                    flex: fileUpload.layout === "vertical" ? undefined : 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {resumeFile ? resumeFile.name : "Click or drag to upload your resume"}
                            </span>
                            {resumeFile && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleFileChange(null)
                                        if (fileInputRef.current) fileInputRef.current.value = ""
                                    }}
                                    style={{
                                        ...input.font,
                                        color: form.errorColor,
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        opacity: 0.6,
                                        lineHeight: 1,
                                    }}
                                >
                                    ✕
                                </span>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                                style={{ display: "none" }}
                            />
                        </div>
                        {errors.resume ? (
                            <span style={errorStyle}>{errors.resume}</span>
                        ) : (
                            <span style={captionStyle}>PDF, DOC or DOCX · Max 10 MB</span>
                        )}
                    </div>

                    {/* Message (optional) */}
                    <div style={fieldStyle}>
                        <label style={labelStyle}>Message (optional)</label>
                        <textarea
                            placeholder="Anything you'd like to add..."
                            value={values.message}
                            onChange={(e) => set("message", e.target.value)}
                            onFocus={() => startTransition(() => setFocused("message"))}
                            onBlur={() => startTransition(() => setFocused(null))}
                            rows={4}
                            style={{
                                ...inputStyle("message"),
                                resize: "vertical",
                                minHeight: 100,
                            }}
                        />
                    </div>

                    {/* Consent */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                cursor: "pointer",
                                justifyContent: alignItems,
                            }}
                        >
                            <span
                                style={{
                                    flexShrink: 0,
                                    width: checkbox.size,
                                    height: checkbox.size,
                                    marginTop: 2,
                                    borderRadius: checkbox.borderRadius,
                                    border: `1.5px solid ${values.consent ? checkbox.checkedBg : errors.consent ? form.errorColor : input.borderColor}`,
                                    background: values.consent ? checkbox.checkedBg : checkbox.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {values.consent && (
                                    <svg
                                        width={checkbox.size * 0.55}
                                        height={checkbox.size * 0.55}
                                        viewBox="0 0 10 10"
                                        fill="none"
                                    >
                                        <path
                                            d="M2 5l2.5 2.5L8 3"
                                            stroke={checkbox.checkColor}
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
                            <span style={{ ...checkbox.font, color: checkbox.textColor, lineHeight: "1.4" }}>
                                I agree to receive follow-up communication and occasional updates by email. *
                            </span>
                        </label>
                        {errors.consent && (
                            <span style={{ ...errorStyle, marginLeft: checkbox.size + 10 }}>
                                {errors.consent}
                            </span>
                        )}
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
                                        style={{ animation: "jfca-spin 0.8s linear infinite" }}
                                    >
                                        <circle cx="8" cy="8" r="6" stroke={button.textColor} strokeWidth="2" strokeOpacity="0.3" />
                                        <path d="M8 2a6 6 0 0 1 6 6" stroke={button.textColor} strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <style>{`@keyframes jfca-spin { to { transform: rotate(360deg); } }`}</style>
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

interface CheckboxProps {
    size: number
    borderRadius: number
    bg: string
    checkedBg: string
    checkColor: string
    font: Record<string, any>
    textColor: string
}

interface FileUploadProps {
    layout: "horizontal" | "vertical"
    paddingV: number
    paddingH: number
    borderStyle: "solid" | "dashed" | "dotted"
    iconSize: number
    icon: string
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
    checkbox: CheckboxProps
    fileUpload: FileUploadProps
    caption: CaptionProps
    label: LabelProps
    form: FormProps
    submitButtonText: string
    showSuccessMessage: boolean
    successMessage: string
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(JotFormCareer, {
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

    checkbox: {
        type: ControlType.Object,
        title: "Checkbox",
        controls: {
            size: {
                type: ControlType.Number,
                defaultValue: 18,
                min: 12,
                max: 28,
                step: 1,
                displayStepper: true,
                title: "Size",
            },
            borderRadius: {
                type: ControlType.Number,
                defaultValue: 4,
                min: 0,
                max: 14,
                step: 1,
                displayStepper: true,
                title: "Radius",
            },
            bg: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Background",
            },
            checkedBg: {
                type: ControlType.Color,
                defaultValue: "#111111",
                title: "Checked BG",
            },
            checkColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Check Mark",
            },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.4em" },
                title: "Label Font",
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.7)",
                title: "Label Color",
            },
        },
    },

    fileUpload: {
        type: ControlType.Object,
        title: "File Upload",
        controls: {
            layout: {
                type: ControlType.Enum,
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                displaySegmentedControl: true,
                defaultValue: "horizontal",
                title: "Layout",
            },
            borderStyle: {
                type: ControlType.Enum,
                options: ["solid", "dashed", "dotted"],
                optionTitles: ["Solid", "Dashed", "Dotted"],
                defaultValue: "dashed",
                title: "Border Style",
            },
            icon: {
                type: ControlType.Image,
                title: "Icon",
            },
            iconSize: {
                type: ControlType.Number,
                defaultValue: 20,
                min: 12,
                max: 80,
                step: 1,
                displayStepper: true,
                title: "Icon Size",
            },
            paddingV: {
                type: ControlType.Number,
                defaultValue: 16,
                min: 4,
                max: 200,
                step: 1,
                displayStepper: true,
                title: "Padding V",
            },
            paddingH: {
                type: ControlType.Number,
                defaultValue: 16,
                min: 4,
                max: 200,
                step: 1,
                displayStepper: true,
                title: "Padding H",
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
        defaultValue: "Submit application",
        title: "Button Label",
    },
    showSuccessMessage: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show Success State",
    },
    successMessage: {
        type: ControlType.String,
        defaultValue: "Thanks! We'll review your application soon.",
        title: "Success Message",
        hidden: (props) => !props.showSuccessMessage,
    },
})
