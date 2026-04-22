// Framer Code Component — Cogent Gated Resources HubSpot Form (Direct API)
// Portal ID: 48361805 | Form ID: 0490e3d4-bfa5-4af6-8986-e5aa995fe3f1 | Region: na2
//
// Custom-styled HubSpot form:
//   · Custom CSS styling (matches Framer design tokens)
//   · UTM auto-capture (persisted via sessionStorage)
//   · 5 hidden field slots (name + value pairs via property controls)
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
const BORDER_ERROR = "#DA5C57"
const INPUT_RADIUS = 6
const INPUT_PADDING = 10
const LABEL_GAP = 4
const ROW_GAP = 30
const COL_GAP = 20
const TRANSITION = "150ms ease"

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
.${FORM_CLASS} input:focus{outline:none;box-shadow:none}
.${FORM_CLASS} button:focus{outline:none}
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
    hidden1Name?: string
    hidden1Value?: string
    hidden2Name?: string
    hidden2Value?: string
    hidden3Name?: string
    hidden3Value?: string
    hidden4Name?: string
    hidden4Value?: string
    hidden5Name?: string
    hidden5Value?: string
    successContent?: React.ReactNode
    style?: React.CSSProperties
}

// ── Component ───────────────────────────────────────────────
export default function CogentHubSpotForm(props: Props) {
    const { successContent, style } = props

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [jobTitle, setJobTitle] = useState("")
    const [emailError, setEmailError] = useState("")
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

    const handleEmailBlur = () => {
        setFocused("")
        if (email && !isValidEmail(email)) {
            setEmailError("Please enter a valid email address.")
        }
    }
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
        if (emailError) setEmailError("")
    }

    const handleSubmit = async () => {
        if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email address.")
            return
        }
        setEmailError("")
        setSubmitError("")
        setStatus("loading")

        let tracked: Record<string, string> = {}
        try { tracked = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") } catch {}
        const hutk = getCookie("hubspotutk")

        const hsFields: { name: string; value: string }[] = [
            { name: "firstname", value: firstName },
            { name: "lastname", value: lastName },
            { name: "email", value: email },
            { name: "jobtitle", value: jobTitle },
            { name: "utm_source", value: tracked.utm_source || "" },
            { name: "utm_medium", value: tracked.utm_medium || "" },
            { name: "utm_campaign", value: tracked.utm_campaign || "" },
            { name: "utm_term", value: tracked.utm_term || "" },
            { name: "utm_content", value: tracked.utm_content || "" },
        ]
        for (let i = 1; i <= 5; i++) {
            const name = (props as any)[`hidden${i}Name`] as string | undefined
            const value = (props as any)[`hidden${i}Value`] as string | undefined
            if (name && value) hsFields.push({ name, value })
        }
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
            {/* Row 1: First name + Last name */}
            <div style={rowStyle}>
                <div style={{ ...fieldWrap, flex: "1 1 160px" }}>
                    <label style={labelStyle}>First name</label>
                    <input
                        type="text"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onFocus={() => setFocused("firstname")}
                        onBlur={() => setFocused("")}
                        style={inputStyle("firstname", false)}
                        autoComplete="given-name"
                    />
                </div>
                <div style={{ ...fieldWrap, flex: "1 1 160px" }}>
                    <label style={labelStyle}>Last name</label>
                    <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onFocus={() => setFocused("lastname")}
                        onBlur={() => setFocused("")}
                        style={inputStyle("lastname", false)}
                        autoComplete="family-name"
                    />
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
                    onChange={handleEmailChange}
                    onFocus={() => setFocused("email")}
                    onBlur={handleEmailBlur}
                    style={inputStyle("email", !!emailError)}
                    autoComplete="email"
                    required
                />
                {emailError && <div style={errorStyle}>{emailError}</div>}
            </div>

            {/* Row 3: Job title */}
            <div style={fieldWrap}>
                <label style={labelStyle}>Job title</label>
                <input
                    type="text"
                    placeholder="Marketing Manager"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    onFocus={() => setFocused("jobtitle")}
                    onBlur={() => setFocused("")}
                    style={inputStyle("jobtitle", false)}
                    autoComplete="organization-title"
                />
            </div>

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
    successContent: {
        type: ControlType.ComponentInstance,
        title: "Success Slot",
    },
    hidden1Name: { type: ControlType.String, title: "Hidden 1 Name", defaultValue: "" },
    hidden1Value: { type: ControlType.String, title: "Hidden 1 Value", defaultValue: "" },
    hidden2Name: { type: ControlType.String, title: "Hidden 2 Name", defaultValue: "" },
    hidden2Value: { type: ControlType.String, title: "Hidden 2 Value", defaultValue: "" },
    hidden3Name: { type: ControlType.String, title: "Hidden 3 Name", defaultValue: "" },
    hidden3Value: { type: ControlType.String, title: "Hidden 3 Value", defaultValue: "" },
    hidden4Name: { type: ControlType.String, title: "Hidden 4 Name", defaultValue: "" },
    hidden4Value: { type: ControlType.String, title: "Hidden 4 Value", defaultValue: "" },
    hidden5Name: { type: ControlType.String, title: "Hidden 5 Name", defaultValue: "" },
    hidden5Value: { type: ControlType.String, title: "Hidden 5 Value", defaultValue: "" },
})
