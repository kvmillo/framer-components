// Framer Code Component — Cogent Gated Resources HubSpot Form (Direct API)
// Portal ID: 48361805 | Form ID: 0490e3d4-bfa5-4af6-8986-e5aa995fe3f1 | Region: na2
//
// Custom-styled HubSpot form:
//   · Custom CSS styling (matches Framer design tokens)
//   · UTM auto-capture (persisted via sessionStorage)
//   · CID via dedicated property control
//   · Custom success state: renders a Framer ComponentInstance when submission succeeds
//   · Uses HubSpot v2 endpoint so notifications/workflows still fire

import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const PORTAL_ID = "48361805"
const FORM_ID = "0490e3d4-bfa5-4af6-8986-e5aa995fe3f1"
const SESSION_KEY = "cogent_hs_form_params"

// ── Design Tokens ────────────────────────────────────────────
const FONT = "'Geist', sans-serif"

const LABEL_COLOR = "#3D4148"
const LABEL_SIZE = 16
const LABEL_LINE_HEIGHT = "1.4em"
const LABEL_LETTER_SPACING = "-0.02em"

const PLACEHOLDER_COLOR = "#B5C0C7"

const INPUT_VALUE_COLOR = "#636D7A"
const INPUT_SIZE = 14
const INPUT_LINE_HEIGHT = "1.4em"
const INPUT_LETTER_SPACING = "0em"

const HELPER_COLOR = "#3D4148"
const ERROR_COLOR = "#DA5C57"
const HELPER_SIZE = 8
const HELPER_LINE_HEIGHT = "1.4em"

const INPUT_BG = "#FFFFFF"
const BORDER_DEFAULT = "#D3DBDD"
const BORDER_FOCUS = "#A6B1BC"
const BORDER_HOVER = "#A6B1BC"
const BORDER_ERROR = "#DA5C57"
const INPUT_RADIUS = 6
const INPUT_PADDING = 10
const LABEL_GAP = 4
const ROW_GAP = 30
const COL_GAP = 20
const TRANSITION = "150ms ease"

const CHECKBOX_SIZE = 16
const CHECKBOX_RADIUS = 2
const CHECKBOX_INNER_SIZE = 8
const CHECKBOX_INNER_COLOR = "#D8813E"
const CHECKBOX_LABEL_COLOR = "#636D7A"
const CHECKBOX_GAP = 8

const BUTTON_BG = "#111112"
const BUTTON_BG_HOVER = "#232325"
const BUTTON_TEXT_COLOR = "#FFFFFF"
const BUTTON_SIZE = 16
const BUTTON_LINE_HEIGHT = "1.2em"
const BUTTON_RADIUS = 8
const BUTTON_PADDING = "10px 26px"
const BUTTON_HEIGHT = 42

// ── Scoped CSS ──────────────────────────────────────────────
// Injected into <head> to style pseudo-elements (::placeholder) and to
// remove default browser focus outlines. A class scope keeps this from
// bleeding into other components.
const FORM_CLASS = "cogent-hs-form"
const formCSS = `
.${FORM_CLASS} input::placeholder{color:${PLACEHOLDER_COLOR};font-family:${FONT};font-size:${INPUT_SIZE}px;line-height:${INPUT_LINE_HEIGHT};letter-spacing:0em;opacity:1}
.${FORM_CLASS} input:focus,.${FORM_CLASS} button:focus{outline:none;box-shadow:none}
.${FORM_CLASS} .cogent-checkbox-row:hover .cogent-checkbox-box{border-color:${BORDER_HOVER}}
.${FORM_CLASS} .cogent-checkbox-row:focus-within .cogent-checkbox-box{border-color:${BORDER_FOCUS}}
.${FORM_CLASS} .cogent-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:cogent-spin 0.7s linear infinite;display:inline-block}
@keyframes cogent-spin{to{transform:rotate(360deg)}}
`

// ── Helpers ─────────────────────────────────────────────────
function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
    return match ? decodeURIComponent(match[2]) : ""
}
function isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}
function captureAndPersistParams(): Record<string, string> {
    const p = new URLSearchParams(window.location.search)
    let stored: Record<string, string> = {}
    try { stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
    ;["utm_source","utm_medium","utm_campaign","utm_term","utm_content"]
        .forEach(k => { const v = p.get(k); if (v) stored[k] = v })
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored)) } catch {}
    return stored
}

// ── Types ───────────────────────────────────────────────────
type Props = {
    cidValue?: string
    successContent?: React.ReactNode
    style?: React.CSSProperties
}

// ── Component ───────────────────────────────────────────────
export default function CogentHubSpotForm(props: Props) {
    const { cidValue, successContent, style } = props

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [optinSubscriber, setOptinSubscriber] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitError, setSubmitError] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [focused, setFocused] = useState<string>("")

    useEffect(() => {
        captureAndPersistParams()
        const id = "cogent-hs-form-styles"
        if (!document.getElementById(id)) {
            const el = document.createElement("style")
            el.id = id
            el.textContent = formCSS
            document.head.appendChild(el)
        }
    }, [])

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
    }

    const validate = (): boolean => {
        const next: Record<string, string> = {}
        if (!firstName.trim()) next.firstname = "Required"
        if (!lastName.trim()) next.lastname = "Required"
        if (!email.trim()) next.email = "Required"
        else if (!isValidEmail(email)) next.email = "Please enter a valid email address."
        if (!companyName.trim()) next.company = "Required"
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async () => {
        setSubmitError("")
        if (!validate()) return
        setStatus("loading")

        let tracked: Record<string, string> = {}
        try { tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
        const hutk = getCookie("hubspotutk")

        const hsFields: { name: string; value: string }[] = [
            { name: "firstname", value: firstName },
            { name: "lastname", value: lastName },
            { name: "email", value: email },
            { name: "name", value: companyName },
            { name: "optin_subscriber", value: optinSubscriber ? "true" : "false" },
            { name: "utm_source", value: tracked.utm_source || "" },
            { name: "utm_medium", value: tracked.utm_medium || "" },
            { name: "utm_campaign", value: tracked.utm_campaign || "" },
            { name: "utm_term", value: tracked.utm_term || "" },
            { name: "utm_content", value: tracked.utm_content || "" },
            { name: "cid", value: cidValue || "" },
        ]
        const filtered = hsFields.filter(f => f.value !== "")

        try {
            const formData = new URLSearchParams()
            filtered.forEach(f => formData.append(f.name, f.value))
            formData.append("hs_context", JSON.stringify({
                hutk: hutk || undefined,
                pageUri: window.location.href,
                pageName: document.title,
            }))
            await fetch(
                `https://forms.hubspot.com/uploads/form/v2/${PORTAL_ID}/${FORM_ID}`,
                {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString(),
                }
            )
            try { sessionStorage.removeItem(SESSION_KEY) } catch {}
            setStatus("success")
        } catch {
            setSubmitError("Network error. Please try again.")
            setStatus("error")
        }
    }

    // ── Styles ─────────────────────────────────────────────
    const labelStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: LABEL_SIZE,
        lineHeight: LABEL_LINE_HEIGHT,
        letterSpacing: LABEL_LETTER_SPACING,
        color: LABEL_COLOR,
        fontWeight: 400,
    }
    const requiredStyle: React.CSSProperties = { color: ERROR_COLOR }
    const inputStyle = (field: string, hasError: boolean): React.CSSProperties => ({
        width: "100%",
        padding: `${INPUT_PADDING}px`,
        fontFamily: FONT,
        fontSize: INPUT_SIZE,
        lineHeight: INPUT_LINE_HEIGHT,
        letterSpacing: INPUT_LETTER_SPACING,
        color: INPUT_VALUE_COLOR,
        background: INPUT_BG,
        border: `1px solid ${hasError ? BORDER_ERROR : focused === field ? BORDER_FOCUS : BORDER_DEFAULT}`,
        borderRadius: INPUT_RADIUS,
        outline: "none",
        boxSizing: "border-box",
        transition: `border-color ${TRANSITION}`,
        appearance: "none",
        WebkitAppearance: "none",
        margin: 0,
    })
    const helperStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: HELPER_SIZE,
        lineHeight: HELPER_LINE_HEIGHT,
        color: HELPER_COLOR,
        letterSpacing: "0em",
    }
    const errorStyle: React.CSSProperties = { ...helperStyle, color: ERROR_COLOR }
    const buttonStyle: React.CSSProperties = {
        alignSelf: "flex-start",
        padding: BUTTON_PADDING,
        height: BUTTON_HEIGHT,
        background: BUTTON_BG,
        color: BUTTON_TEXT_COLOR,
        fontFamily: FONT,
        fontSize: BUTTON_SIZE,
        lineHeight: BUTTON_LINE_HEIGHT,
        letterSpacing: "0em",
        fontWeight: 400,
        borderRadius: BUTTON_RADIUS,
        border: "none",
        cursor: status === "loading" ? "wait" : "pointer",
        opacity: 1,
        transition: `background ${TRANSITION}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
    }
    const fieldWrap: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: LABEL_GAP,
        flex: 1,
        minWidth: 0,
    }
    const rowStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "row",
        gap: COL_GAP,
        width: "100%",
        flexWrap: "wrap",
    }
    const formStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: ROW_GAP,
        width: "100%",
        fontFamily: FONT,
        ...style,
    }
    const checkboxRowStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: CHECKBOX_GAP,
        cursor: "pointer",
        userSelect: "none",
    }
    const checkboxBoxStyle: React.CSSProperties = {
        width: CHECKBOX_SIZE,
        height: CHECKBOX_SIZE,
        background: INPUT_BG,
        border: `1px solid ${BORDER_DEFAULT}`,
        borderRadius: CHECKBOX_RADIUS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: `border-color ${TRANSITION}`,
        boxSizing: "border-box",
    }
    const checkboxInnerStyle: React.CSSProperties = {
        width: CHECKBOX_INNER_SIZE,
        height: CHECKBOX_INNER_SIZE,
        background: CHECKBOX_INNER_COLOR,
        opacity: optinSubscriber ? 1 : 0,
        transition: `opacity ${TRANSITION}`,
    }
    const checkboxLabelStyle: React.CSSProperties = {
        fontFamily: FONT,
        fontSize: 16,
        lineHeight: "1.4em",
        letterSpacing: "-0.02em",
        color: CHECKBOX_LABEL_COLOR,
    }
    const visuallyHidden: React.CSSProperties = {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
    }

    // ── Render ─────────────────────────────────────────────
    if (status === "success") {
        return (
            <div className={FORM_CLASS} style={{ width: "100%", ...style }}>
                {successContent ?? (
                    <div style={{ ...labelStyle, color: LABEL_COLOR }}>
                        Thanks! We'll be in touch shortly.
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={FORM_CLASS} style={formStyle}>
            {/* Row 1: First name + Last name (both required) */}
            <div style={rowStyle}>
                <div style={{ ...fieldWrap, flex: "1 1 160px" }}>
                    <label style={labelStyle}>
                        First name<span style={requiredStyle}>*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); clearError("firstname") }}
                        onFocus={() => setFocused("firstname")}
                        onBlur={() => setFocused("")}
                        style={inputStyle("firstname", !!errors.firstname)}
                        autoComplete="given-name"
                    />
                    {errors.firstname && <div style={errorStyle}>{errors.firstname}</div>}
                </div>
                <div style={{ ...fieldWrap, flex: "1 1 160px" }}>
                    <label style={labelStyle}>
                        Last name<span style={requiredStyle}>*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value); clearError("lastname") }}
                        onFocus={() => setFocused("lastname")}
                        onBlur={() => setFocused("")}
                        style={inputStyle("lastname", !!errors.lastname)}
                        autoComplete="family-name"
                    />
                    {errors.lastname && <div style={errorStyle}>{errors.lastname}</div>}
                </div>
            </div>

            {/* Row 2: Work email (required) */}
            <div style={fieldWrap}>
                <label style={labelStyle}>
                    Work email<span style={requiredStyle}>*</span>
                </label>
                <input
                    type="email"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError("email") }}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    style={inputStyle("email", !!errors.email)}
                    autoComplete="email"
                    required
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
            </div>

            {/* Row 3: Company name (required) */}
            <div style={fieldWrap}>
                <label style={labelStyle}>
                    Company name<span style={requiredStyle}>*</span>
                </label>
                <input
                    type="text"
                    placeholder="Acme Inc."
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); clearError("company") }}
                    onFocus={() => setFocused("company")}
                    onBlur={() => setFocused("")}
                    style={inputStyle("company", !!errors.company)}
                    autoComplete="organization"
                />
                {errors.company && <div style={errorStyle}>{errors.company}</div>}
            </div>

            {/* Row 4: Opt-in subscriber checkbox */}
            <label className="cogent-checkbox-row" style={checkboxRowStyle}>
                <span className="cogent-checkbox-box" style={checkboxBoxStyle}>
                    <span style={checkboxInnerStyle} />
                </span>
                <input
                    type="checkbox"
                    checked={optinSubscriber}
                    onChange={(e) => setOptinSubscriber(e.target.checked)}
                    style={visuallyHidden}
                />
                <span style={checkboxLabelStyle}>Subscribe to updates from Cogent</span>
            </label>

            {submitError && <div style={errorStyle}>{submitError}</div>}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "loading"}
                style={buttonStyle}
                onMouseEnter={(e) => {
                    if (status !== "loading") {
                        (e.currentTarget as HTMLButtonElement).style.background = BUTTON_BG_HOVER
                    }
                }}
                onMouseLeave={(e) => {
                    if (status !== "loading") {
                        (e.currentTarget as HTMLButtonElement).style.background = BUTTON_BG
                    }
                }}
            >
                {status === "loading" ? <span className="cogent-spinner" /> : "Submit"}
            </button>
        </div>
    )
}

CogentHubSpotForm.displayName = "Cogent HubSpot Form"

// ── Property Controls ─────────────────────────────────────
addPropertyControls(CogentHubSpotForm, {
    cidValue: {
        type: ControlType.String,
        title: "CID",
        defaultValue: "",
        placeholder: "Campaign ID (optional)",
    },
    successContent: {
        type: ControlType.ComponentInstance,
        title: "Success Slot",
    },
})
